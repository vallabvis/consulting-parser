import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import type { RoleType, FirmTier } from '@/lib/types'

// GET /api/cron/tier2-ats
// Fetches job listings from Greenhouse, Lever, and Ashby ATS APIs for each configured firm.
// Protected by CRON_SECRET. Runs daily at 5:15am Central via Vercel Cron.

const CONSULTING_WHITELIST = /consultant|consulting|strategy|associate|analyst/i
const CONSULTING_BLACKLIST = /software engineer|product manager|ui designer|ux designer|technician|developer|data scientist|devops|sre|swe/i

function isConsultingRole(title: string): boolean {
  return CONSULTING_WHITELIST.test(title) && !CONSULTING_BLACKLIST.test(title)
}

function inferRoleType(title: string, description = ''): RoleType {
  const text = (title + ' ' + description).toLowerCase()
  if (/sophomore/i.test(text))                        return 'sophomore_program'
  if (/freshman|first[\s-]year/i.test(text))          return 'freshman_program'
  if (/diversity|inclusion|underrepresented/i.test(text)) return 'diversity_program'
  if (/intern|summer/i.test(text))                    return 'summer_internship'
  if (/case\s*compet/i.test(text))                    return 'case_competition'
  if (/networking|info[\s-]?session/i.test(text))     return 'networking_event'
  return 'full_time'
}

interface NormalizedJob {
  externalId: string
  title: string
  location: string | null
  applicationUrl: string
  description: string | null
}

interface Firm {
  id: string
  name: string
  tier: string
  ats_provider: string
  ats_company_slug: string
}

interface ExistingRow {
  id: string
  external_id: string | null
}

// ── ATS fetchers ──────────────────────────────────────────────────────────────

// slug format: "tenant/wdN/BoardName"  e.g. "deloitte/wd1/Deloitte-Career"
async function fetchWorkday(slug: string): Promise<NormalizedJob[]> {
  const parts = slug.split('/')
  if (parts.length < 3) throw new Error(`Invalid Workday slug (expected tenant/wdN/Board): ${slug}`)
  const [tenant, instance, ...boardParts] = parts
  const board = boardParts.join('/')
  const baseUrl = `https://${tenant}.${instance}.myworkdayjobs.com`
  const apiUrl  = `${baseUrl}/wday/cxs/${tenant}/${board}/jobs`

  const results: NormalizedJob[] = []
  let offset = 0
  const limit = 20

  while (offset < 200) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: '' }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) throw new Error(`Workday HTTP ${res.status}`)

    const { jobPostings, total } = (await res.json()) as {
      jobPostings: Array<{ title: string; externalPath: string; locationsText?: string }>
      total: number
    }

    for (const job of jobPostings) {
      if (!isConsultingRole(job.title)) continue
      results.push({
        externalId:     job.externalPath,
        title:          job.title,
        location:       job.locationsText ?? null,
        applicationUrl: `${baseUrl}${job.externalPath}`,
        description:    null,
      })
    }

    offset += limit
    if (offset >= total) break
  }

  return results
}

async function fetchGreenhouse(slug: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Greenhouse HTTP ${res.status}`)
  const { jobs } = (await res.json()) as {
    jobs: Array<{ id: number; title: string; location: { name: string }; absolute_url: string }>
  }
  return jobs
    .filter((j) => isConsultingRole(j.title))
    .map((j) => ({
      externalId:     String(j.id),
      title:          j.title,
      location:       j.location?.name ?? null,
      applicationUrl: j.absolute_url,
      description:    null,
    }))
}

async function fetchLever(slug: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Lever HTTP ${res.status}`)
  const jobs = (await res.json()) as Array<{
    id: string
    text: string
    categories: { location?: string }
    hostedUrl: string
    descriptionPlain?: string
  }>
  return jobs
    .filter((j) => isConsultingRole(j.text))
    .map((j) => ({
      externalId:     j.id,
      title:          j.text,
      location:       j.categories?.location ?? null,
      applicationUrl: j.hostedUrl,
      description:    j.descriptionPlain?.slice(0, 500) ?? null,
    }))
}

async function fetchAshby(slug: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Ashby HTTP ${res.status}`)
  const { jobs } = (await res.json()) as {
    jobs: Array<{ id: string; title: string; locationName?: string; jobUrl: string; descriptionPlain?: string }>
  }
  return jobs
    .filter((j) => isConsultingRole(j.title))
    .map((j) => ({
      externalId:     j.id,
      title:          j.title,
      location:       j.locationName ?? null,
      applicationUrl: j.jobUrl,
      description:    j.descriptionPlain?.slice(0, 500) ?? null,
    }))
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const errors: Array<{ firm: string; error: string }> = []
  let firmsProcessed = 0, added = 0, updated = 0, deactivated = 0

  // Create a parser_run record to track this run
  const { data: run } = await supabase
    .from('parser_runs')
    .insert({ tier: 'tier2', status: 'running' })
    .select('id')
    .single()
  const runId = run?.id as string | undefined

  const { data: firmsRaw } = await supabase
    .from('firms')
    .select('id, name, tier, ats_provider, ats_company_slug')
    .not('ats_provider', 'is', null)
    .eq('active', true)

  if (!firmsRaw) {
    if (runId) await supabase.from('parser_runs').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', runId)
    return NextResponse.json({ error: 'Failed to fetch firms' }, { status: 500 })
  }

  const firms = firmsRaw as Firm[]

  for (const firm of firms) {
    firmsProcessed++
    try {
      let jobs: NormalizedJob[]
      if (firm.ats_provider === 'greenhouse') {
        jobs = await fetchGreenhouse(firm.ats_company_slug)
      } else if (firm.ats_provider === 'lever') {
        jobs = await fetchLever(firm.ats_company_slug)
      } else if (firm.ats_provider === 'ashby') {
        jobs = await fetchAshby(firm.ats_company_slug)
      } else if (firm.ats_provider === 'workday') {
        jobs = await fetchWorkday(firm.ats_company_slug)
      } else {
        continue
      }

      // Fetch existing active ATS-sourced opportunities for this firm (for deactivation detection)
      const { data: existingRaw } = await supabase
        .from('opportunities')
        .select('id, external_id')
        .eq('firm_id', firm.id)
        .eq('status', 'active')
        .not('external_id', 'is', null)

      const existingRows = (existingRaw ?? []) as ExistingRow[]
      const existingById = new Map(existingRows.map((r) => [r.external_id!, r.id]))
      const processedIds = new Set<string>()

      for (const job of jobs) {
        processedIds.add(job.externalId)
        const roleType = inferRoleType(job.title, job.description ?? '')

        if (existingById.has(job.externalId)) {
          await supabase
            .from('opportunities')
            .update({ last_seen_at: new Date().toISOString(), status: 'active' })
            .eq('id', existingById.get(job.externalId)!)
          updated++
        } else {
          await supabase.from('opportunities').insert({
            firm_id:           firm.id,
            firm_name:         firm.name,
            firm_tier:         firm.tier as FirmTier,
            role_title:        job.title,
            role_type:         roleType,
            target_grad_years: [] as number[],
            location:          job.location,
            application_url:   job.applicationUrl,
            status:            'active',
            source:            'tier2_ats',
            external_id:       job.externalId,
            last_seen_at:      new Date().toISOString(),
            description:       job.description,
          })
          added++
        }
      }

      // Deactivate jobs that are no longer listed
      for (const [extId, id] of existingById) {
        if (!processedIds.has(extId)) {
          await supabase.from('opportunities').update({ status: 'expired' }).eq('id', id)
          deactivated++
        }
      }
    } catch (err) {
      errors.push({ firm: firm.name, error: err instanceof Error ? err.message : String(err) })
    }
  }

  const finalStatus = errors.length === 0
    ? 'success'
    : errors.length < firms.length
      ? 'partial'
      : 'failed'

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
