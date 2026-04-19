import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/reminders
// Triggered by Vercel cron daily at 8 AM UTC (see vercel.json).
// Sends deadline reminder emails to users whose tracked opportunities
// are due in 3 days or 1 day.

const REMINDER_WINDOWS_DAYS = [3, 1]

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const secret = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  let totalSent = 0
  const errors: string[] = []

  for (const daysAhead of REMINDER_WINDOWS_DAYS) {
    // Target window: deadline is between (now + daysAhead - 12h) and (now + daysAhead + 12h)
    // This gives a 24-hour window centred on the exact daysAhead mark, so the
    // daily cron won't miss or double-send if it fires a few hours late.
    const windowStart = new Date(now.getTime() + (daysAhead - 0.5) * 86_400_000)
    const windowEnd   = new Date(now.getTime() + (daysAhead + 0.5) * 86_400_000)

    const { data: applications, error } = await supabase
      .from('user_applications')
      .select(`
        id,
        status,
        user_id,
        profiles ( email, full_name ),
        opportunities ( firm_name, role_title, deadline, application_url )
      `)
      .in('status', ['interested', 'applied'])
      .gte('opportunities.deadline', windowStart.toISOString())
      .lte('opportunities.deadline', windowEnd.toISOString())

    if (error) {
      errors.push(`Window ${daysAhead}d: ${error.message}`)
      continue
    }

    for (const app of applications ?? []) {
      const profile     = (app as any).profiles
      const opportunity = (app as any).opportunities

      if (!profile?.email || !opportunity?.deadline) continue

      try {
        await sendReminderEmail({
          to:           profile.email,
          name:         profile.full_name,
          firmName:     opportunity.firm_name,
          roleTitle:    opportunity.role_title,
          deadline:     opportunity.deadline,
          applyUrl:     opportunity.application_url,
          daysRemaining: daysAhead,
        })
        totalSent++
      } catch (err) {
        errors.push(
          `Email to ${profile.email} failed: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, errors })
}

// ─── Email sender ─────────────────────────────────────────────────────────────

interface ReminderEmailParams {
  to: string
  name: string
  firmName: string
  roleTitle: string
  deadline: string
  applyUrl: string | null
  daysRemaining: number
}

async function sendReminderEmail(params: ReminderEmailParams) {
  const apiKey = process.env.RESEND_API_KEY

  // Graceful stub: log instead of sending when no real key is set
  if (!apiKey || apiKey.startsWith('re_stub')) {
    console.log('[reminders] STUB email to', params.to, {
      subject: buildSubject(params),
    })
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  await resend.emails.send({
    from:    'Wisco Consulting Hub <reminders@wisconsultinghub.com>',
    to:      params.to,
    subject: buildSubject(params),
    html:    buildHtmlBody(params),
  })
}

function buildSubject({ firmName, roleTitle, daysRemaining }: ReminderEmailParams) {
  return `⏰ Deadline in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}: ${firmName} – ${roleTitle}`
}

function buildHtmlBody({ name, firmName, roleTitle, deadline, applyUrl, daysRemaining }: ReminderEmailParams) {
  const deadlineFormatted = new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const applyLink = applyUrl
    ? `<p><a href="${applyUrl}" style="color:#C5050C;">Apply now →</a></p>`
    : ''

  return `
    <p>Hi ${name || 'there'},</p>
    <p>
      Just a reminder that the deadline for <strong>${firmName} – ${roleTitle}</strong>
      is in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>
      (${deadlineFormatted}).
    </p>
    ${applyLink}
    <p style="color:#888;font-size:12px;">
      You're receiving this because you saved this opportunity in your Wisco Consulting Hub tracker.
    </p>
  `
}
