'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { PendingOpportunity } from '@/lib/types'

type Tab = 'pending' | 'add' | 'alumni'

export default function AdminPage() {
  const supabase = createClient()
  const [tab, setTab]         = useState<Tab>('pending')
  const [pending, setPending] = useState<PendingOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [isOfficer, setIsOfficer] = useState(false)

  // URL to AI-extract
  const [extractUrl, setExtractUrl]   = useState('')
  const [extracting, setExtracting]   = useState(false)
  const [extracted, setExtracted]     = useState<any>(null)
  const [extractError, setExtractError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['officer', 'admin'].includes(profile.role)) {
        window.location.href = '/'
        return
      }
      setIsOfficer(true)

      supabase
        .from('pending_opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => { setPending((data ?? []) as PendingOpportunity[]); setLoading(false) })
    })
  }, [])

  async function approve(id: string) {
    const opp = pending.find((p) => p.id === id)
    if (!opp) return

    const { submitted_by, submission_source, reviewed_by, reviewed_at, ...rest } = opp as any
    await supabase.from('opportunities').insert({ ...rest, status: 'active' })
    await supabase.from('pending_opportunities').delete().eq('id', id)
    setPending((prev) => prev.filter((p) => p.id !== id))
  }

  async function reject(id: string) {
    await supabase.from('pending_opportunities').delete().eq('id', id)
    setPending((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleExtract() {
    setExtracting(true)
    setExtractError('')
    setExtracted(null)

    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: extractUrl }),
    })
    const json = await res.json()
    if (!res.ok) { setExtractError(json.error); setExtracting(false); return }

    setExtracted(json.data)
    setExtracting(false)
  }

  async function saveExtracted() {
    if (!extracted) return
    await supabase.from('pending_opportunities').insert({
      ...extracted,
      source_url: extractUrl,
      submission_source: 'ai_extraction',
    })
    setExtracted(null)
    setExtractUrl('')
    setTab('pending')
  }

  if (!isOfficer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Checking permissions…</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {([['pending', 'Pending Approval'], ['add', 'Add via URL'], ['alumni', 'Manage Alumni']] as const).map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {value === 'pending' && pending.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* ── Pending Approval ─────────────────────────────────────────────── */}
      {tab === 'pending' && (
        <div>
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && pending.length === 0 && (
            <p className="text-center py-16 text-muted-foreground">Queue is empty. Nice!</p>
          )}
          <div className="space-y-3">
            {pending.map((opp) => (
              <div key={opp.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{opp.firm_name}</p>
                    <p className="text-sm text-muted-foreground">{opp.role_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {(opp as any).submission_source} ·{' '}
                      {opp.deadline
                        ? `Deadline: ${new Date(opp.deadline).toLocaleDateString()}`
                        : 'No deadline'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approve(opp.id)}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-medium hover:opacity-90"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(opp.id)}
                      className="text-xs border px-3 py-1.5 rounded font-medium hover:bg-muted"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add via URL ──────────────────────────────────────────────────── */}
      {tab === 'add' && (
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground mb-4">
            Paste a job posting URL. Claude will extract the details for you to review before saving.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://careers.mckinsey.com/..."
              value={extractUrl}
              onChange={(e) => setExtractUrl(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleExtract}
              disabled={!extractUrl || extracting}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {extracting ? 'Extracting…' : 'Extract'}
            </button>
          </div>

          {extractError && (
            <p className="text-sm text-destructive mt-3">{extractError}</p>
          )}

          {extracted && (
            <div className="mt-6 border rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold">Review extracted data</p>
              <pre className="text-xs bg-muted/40 rounded p-3 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(extracted, null, 2)}
              </pre>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveExtracted}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Save to Pending Queue
                </button>
                <button
                  onClick={() => setExtracted(null)}
                  className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Manage Alumni ─────────────────────────────────────────────────── */}
      {tab === 'alumni' && (
        <p className="text-muted-foreground text-sm">
          Alumni management UI coming in the next iteration. For now, edit directly in the Supabase dashboard.
        </p>
      )}
    </div>
  )
}
