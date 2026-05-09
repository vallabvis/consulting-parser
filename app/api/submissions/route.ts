import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/submissions
// Inserts a member-submitted opportunity into opportunity_submissions for officer review.
// Requires an authenticated session.

export async function POST(req: NextRequest) {
  // Verify the user is logged in
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { firm_name, title, application_url } = body

  if (!firm_name || typeof firm_name !== 'string' || !firm_name.trim()) {
    return NextResponse.json({ error: 'firm_name is required.' }, { status: 400 })
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required.' }, { status: 400 })
  }
  if (!application_url || typeof application_url !== 'string') {
    return NextResponse.json({ error: 'application_url is required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.from('opportunity_submissions').insert({
    submitted_by_email: (body.submitted_by_email as string | undefined) ?? user.email ?? '',
    firm_name:          (firm_name as string).trim(),
    raw_payload:        body,
    status:             'pending',
  })

  if (error) {
    console.error('opportunity_submissions insert error:', error)
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  // Optional Slack / webhook notification
  if (process.env.ADMIN_NOTIFY_WEBHOOK) {
    fetch(process.env.ADMIN_NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `New opportunity submission from ${user.email}: *${firm_name}* — ${title}`,
      }),
    }).catch(() => {})  // fire-and-forget; don't fail the request if webhook fails
  }

  return NextResponse.json({ ok: true })
}
