import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import type { FirmTier } from '@/lib/types'

// GET /api/ingest/greenhouse
// Triggered by Vercel cron every 6 hours (see vercel.json).
// Protected by CRON_SECRET header.

// ── Firm config ───────────────────────────────────────────────────────────────
// Slugs come from boards-api.greenhouse.io/v1/boards/{slug}/jobs
// Verify current slugs at: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
const FIRMS: { slug: string; name: string; tier: FirmTier }[] = [
  { slug: 'bain',                name: 'Bain & Company',     tier: 'mbb'   },
  { slug: 'zsassociates',        name: 'ZS Associates',      tier: 'tier2' },
  { slug: 'putnamassociates',    name: 'Putnam Associates',  tier: 'tier2' },
  { slug: 'analysisgroup',       name: 'Analysis Group',     tier: 'tier2' },
  { slug: 'cornerstoneresearch', name: 'Cornerstone Research', tier: 'tier2' },
]

const CONSULTING_TITLE_PATTERNS = [
  /analyst/i,
  /associate/i,
  /consultant/i,
  /intern/i,
  /scholar/i,
  /fellow/i,
  /summer\s+program/i,
  /sophomore/i,
  /freshman/i,
  /diversity/i,
]

function isConsultingRole(title: string): boolean {
  return CONSULTING_TITLE_PATTERNS.some((re) => re.test(title))
}

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  updated_at: string
}

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const secret = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: { firm: string; inserted: number; skipped: number; error?: string }[] = []

  for (const firm of FIRMS) {
    try {
      // ── Fetch Greenhouse board ──────────────────────────────────────────
      const ghRes = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${firm.slug}/jobs`,
        { next: { revalidate: 0 } }
      )

      if (!ghRes.ok) {
        results.push({ firm: firm.name, inserted: 0, skipped: 0, error: `HTTP ${ghRes.status}` })
        continue
      }

      const { jobs } = (await ghRes.json()) as { jobs: GreenhouseJob[] }
      const consulting = jobs.filter((j) => isConsultingRole(j.title))

      let inserted = 0
      let skipped = 0

      for (const job of consulting) {
        // Dedupe by source_url against pending_opportunities
        const { data: existing } = await supabase
          .from('pending_opportunities')
          .select('id')
          .eq('source_url', job.absolute_url)
          .maybeSingle()

        if (existing) {
          skipped++
          continue
        }

        await supabase.from('pending_opportunities').insert({
          firm_name:         firm.name,
          firm_tier:         firm.tier,
          role_title:        job.title,
          role_type:         'summer_internship', // default; officer adjusts in review
          target_grad_years: [],
          location:          job.location?.name ?? null,
          remote_eligible:   false,
          application_url:   job.absolute_url,
          source_url:        job.absolute_url,
          submission_source: 'greenhouse',
          last_verified:     new Date().toISOString(),
        })

        inserted++
      }

      results.push({ firm: firm.name, inserted, skipped })
    } catch (err) {
      results.push({
        firm: firm.name,
        inserted: 0,
        skipped: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({ ok: true, results })
}
