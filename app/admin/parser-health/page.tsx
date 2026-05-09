'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface ParserRun {
  id: string
  tier: 'tier1' | 'tier2' | 'tier3'
  started_at: string
  completed_at: string | null
  firms_processed: number
  opportunities_added: number
  opportunities_updated: number
  opportunities_deactivated: number
  errors: Array<{ firm: string; error: string }>
  status: 'running' | 'success' | 'failed' | 'partial'
}

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  failed:  'bg-red-50 text-red-700 border-red-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
}

const TIER_LABELS: Record<string, string> = {
  tier1: 'Tier 1 — Scraper',
  tier2: 'Tier 2 — ATS',
  tier3: 'Tier 3 — Manual',
}

export default function ParserHealthPage() {
  const supabase = createClient()
  const [runs,       setRuns]       = useState<ParserRun[]>([])
  const [loading,    setLoading]    = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['officer', 'admin'].includes(profile.role as string)) {
        window.location.href = '/'
        return
      }
      setAuthorized(true)

      const { data } = await supabase
        .from('parser_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(30)

      setRuns((data ?? []) as ParserRun[])
      setLoading(false)
    })
  }, [])

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Checking permissions…</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Parser Health</h1>
        <a href="/admin" className="text-sm text-primary hover:underline">← Admin home</a>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 h-14 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No parser runs yet.</p>
          <p className="text-sm mt-1">
            Trigger a run by calling <code className="bg-muted px-1 rounded">/api/cron/tier1-scraper</code> or{' '}
            <code className="bg-muted px-1 rounded">/api/cron/tier2-ats</code> with the correct Bearer token.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  )
}

function RunRow({ run }: { run: ParserRun }) {
  const [expanded, setExpanded] = useState(false)

  const durationSec = run.completed_at
    ? Math.round(
        (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
      )
    : null

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium border shrink-0',
              STATUS_STYLES[run.status]
            )}
          >
            {run.status}
          </span>
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {TIER_LABELS[run.tier] ?? run.tier}
          </span>
          <span className="text-sm truncate">
            {new Date(run.started_at).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span className="text-emerald-700">+{run.opportunities_added}</span>
          <span>~{run.opportunities_updated} updated</span>
          <span className="text-amber-700">{run.opportunities_deactivated} expired</span>
          {durationSec !== null && <span>{durationSec}s</span>}
          {run.errors.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-destructive hover:underline"
            >
              {run.errors.length} error{run.errors.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {expanded && run.errors.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-1">
          {run.errors.map((e, i) => (
            <p key={i} className="text-xs text-destructive">
              <span className="font-medium">{e.firm}:</span> {e.error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
