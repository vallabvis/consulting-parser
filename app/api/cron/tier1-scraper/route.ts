import { NextRequest, NextResponse } from 'next/server'
import { parse as parseHtml } from 'node-html-parser'
import { anthropic } from '@/lib/anthropic'
import { createAdminClient } from '@/lib/supabase-server'
import type { RoleType, FirmTier } from '@/lib/types'

// GET /api/cron/tier1-scraper
// For each firm without an ATS provider, fetches its careers page and sends the
// text to Claude Haiku for structured opportunity extraction.
// Protected by CRON_SECRET. Runs daily at 5:00am Central via Vercel Cron.

const TIER1_MODEL = 'claude-haiku-4-5-20251001'
const CONCURRENCY = 5

const SYSTEM_PROMPT = `You are extracting consulting opportunities from a firm's careers page.
Return ONLY a JSON array (no markdown fences, no prose) matching this schema:

[
  {
    "title": "string",
    "role_type": "Summer Internship" | "Sophomore Program" | "Freshman Program" | "Diversity Program" | "Full-Time" | "Case Competition" | "Networking Event",
    "grad_years": [2027, 2028],
    "location": "string or null",
    "application_url": "string (absolute URL)",
    "application_deadline": "YYYY-MM-DD or null",
    "description": "string (1-3 sentences)",
    "how_to_apply": "string (steps or notes, 1-3 sentences)"
  }
]

Rules:
- Only include MANAGEMENT/STRATEGY consulting roles. Skip IT consulting, audit, tax, engineering advisory.
- If no relevant roles are listed, return [].
- grad_years: infer from program description. "Sophomore" = current sophomores (graduating in ~2 years). Be conservative — if unsure, return [].
- application_url MUST be absolute. If the page only has relative paths, prepend the firm's domain.
- Do not hallucinate deadlines. Return null if not explicitly stated.`

const ROLE_TYPE_MAP: Record<string, RoleType> = {
  'Summer Internship': 'summer_internship',
  'Sophomore Program': 'sophomore_program',
  'Freshman Program':  'freshman_program',
  'Diversity Program': 'diversity_program',
  'Full-Time':         'full_time',
  'Case Competition':  'case_competition',
  'Networking Event':  'networking_event',
}

interface ClaudeOpportunity {
  title: string
  role_type: string
  grad_years: number[]
  location: string | null
  application_url: string
  application_deadline: string | null
  description: string | null
  how_to_apply: string | null
}

interface Firm {
  id: string
  name: string
  tier: string
  careers_url: string
}

interface ExistingRow {
  id: string
  application_url: string | null
}

// Semaphore for bounding concurrent Vercel function work
function makeSemaphore(concurrency: number) {
  let active = 0
  const queue: Array<() => void> = []
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        active++
        fn().then(resolve, reject).finally(() => {
          active--
          queue.shift()?.()
        })
      }
      active < concurrency ? run() : queue.push(run)
    })
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const errors: Array<{ firm: string; error: string }> = []
  let firmsProcessed = 0, added = 0, updated = 0, deactivated = 0

  const { data: run } = await supabase
    .from('parser_runs')
    .insert({ tier: 'tier1', status: 'running' })
    .select('id')
    .single()
  const runId = run?.id as string | undefined

  const { data: firmsRaw } = await supabase
    .from('firms')
    .select('id, name, tier, careers_url')
    .is('ats_provider', null)
    .eq('active', true)
    .not('careers_url', 'is', null)

  if (!firmsRaw) {
    if (runId) await supabase.from('parser_runs').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', runId)
    return NextResponse.json({ error: 'Failed to fetch firms' }, { status: 500 })
  }

  const firms = firmsRaw as Firm[]
  const limit = makeSemaphore(CONCURRENCY)

  await Promise.all(
    firms.map((firm) =>
      limit(async () => {
        firmsProcessed++
        try {
          // 1. Fetch careers page
          const pageRes = await fetch(firm.careers_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; WiscoConsultingBot/1.0)',
              Accept: 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(10_000),
          })

          if (!pageRes.ok) {
            errors.push({ firm: firm.name, error: `HTTP ${pageRes.status}` })
            return
          }

          const rawHtml = await pageRes.text()
          if (rawHtml.length < 500) {
            errors.push({ firm: firm.name, error: 'Page content too short — likely a soft 404 or redirect' })
            return
          }

          // 2. Strip script/style/nav noise, truncate to ~30k chars
          const root = parseHtml(rawHtml)
          root.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())
          const pageText = root.structuredText.slice(0, 30_000)

          // 3. Ask Claude Haiku to extract opportunities
          const message = await anthropic.messages.create({
            model: TIER1_MODEL,
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: `Firm: ${firm.name}\nCareers page URL: ${firm.careers_url}\n\n${pageText}`,
            }],
          })

          const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

          let extracted: ClaudeOpportunity[]
          try {
            // Strip any accidental markdown fences before parsing
            const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
            extracted = JSON.parse(cleaned)
            if (!Array.isArray(extracted)) extracted = []
          } catch {
            errors.push({ firm: firm.name, error: `JSON parse failed: ${rawText.slice(0, 200)}` })
            return
          }

          // 4. Load existing active opportunities for this firm (deactivation tracking)
          const { data: existingRaw } = await supabase
            .from('opportunities')
            .select('id, application_url')
            .eq('firm_id', firm.id)
            .eq('status', 'active')

          const existingRows = (existingRaw ?? []) as ExistingRow[]
          const existingByUrl = new Map(
            existingRows
              .filter((r) => r.application_url !== null)
              .map((r) => [r.application_url!, r.id])
          )
          const processedUrls = new Set<string>()

          // 5. Upsert each extracted opportunity
          for (const opp of extracted) {
            if (!opp.application_url) continue
            processedUrls.add(opp.application_url)

            const roleType: RoleType = ROLE_TYPE_MAP[opp.role_type] ?? 'full_time'
            const deadline = opp.application_deadline
              ? new Date(opp.application_deadline).toISOString()
              : null

            if (existingByUrl.has(opp.application_url)) {
              // Refresh last_seen_at and ensure status is active
              await supabase
                .from('opportunities')
                .update({ last_seen_at: new Date().toISOString(), status: 'active' })
                .eq('id', existingByUrl.get(opp.application_url)!)
              updated++
            } else {
              await supabase.from('opportunities').insert({
                firm_id:           firm.id,
                firm_name:         firm.name,
                firm_tier:         firm.tier as FirmTier,
                role_title:        opp.title,
                role_type:         roleType,
                target_grad_years: opp.grad_years ?? [],
                location:          opp.location,
                deadline,
                application_url:   opp.application_url,
                status:            'active',
                source:            'tier1_scraper',
                last_seen_at:      new Date().toISOString(),
                description:       opp.description,
                how_to_apply:      opp.how_to_apply,
              })
              added++
            }
          }

          // 6. Expire listings not seen in this run (page no longer shows them)
          for (const [url, id] of existingByUrl) {
            if (!processedUrls.has(url)) {
              await supabase.from('opportunities').update({ status: 'expired' }).eq('id', id)
              deactivated++
            }
          }
        } catch (err) {
          errors.push({
            firm: firm.name,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      })
    )
  )

  const finalStatus =
    errors.length === 0 ? 'success' :
    errors.length < firms.length ? 'partial' :
    'failed'

  if (runId) {
    await supabase.from('parser_runs').update({
      status:                    finalStatus,
      completed_at:              new Date().toISOString(),
      firms_processed:           firmsProcessed,
      opportunities_added:       added,
      opportunities_updated:     updated,
      opportunities_deactivated: deactivated,
      errors,
    }).eq('id', runId)
  }

  return NextResponse.json({ ok: true, firmsProcessed, added, updated, deactivated, errors })
}
