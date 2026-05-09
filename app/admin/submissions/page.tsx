'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { RoleType, FirmTier } from '@/lib/types'

interface Submission {
  id: string
  submitted_by_email: string
  firm_name: string
  raw_payload: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  reviewer_notes: string | null
  created_at: string
}

interface FirmLookup {
  id: string
  tier: string
}

export default function AdminSubmissionsPage() {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading,     setLoading]     = useState(true)
  const [authorized,  setAuthorized]  = useState(false)

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
        .from('opportunity_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setSubmissions((data ?? []) as Submission[])
      setLoading(false)
    })
  }, [])

  async function approve(sub: Submission) {
    const p = sub.raw_payload

    // Look up firm_id and tier from the firms table (optional enrichment)
    const { data: firmData } = await supabase
      .from('firms')
      .select('id, tier')
      .eq('name', sub.firm_name)
      .maybeSingle()
    const firm = firmData as FirmLookup | null

    const { error } = await supabase.from('opportunities').insert({
      firm_id:           firm?.id ?? null,
      firm_name:         sub.firm_name,
      firm_tier:         (firm?.tier ?? 'other') as FirmTier,
      role_title:        p.title as string,
      role_type:         (p.role_type as RoleType) ?? 'full_time',
      target_grad_years: (p.grad_years as number[]) ?? [],
      location:          (p.location as string | null) ?? null,
      application_url:   p.application_url as string,
      deadline:          p.application_deadline
        ? new Date(p.application_deadline as string).toISOString()
        : null,
      description:       (p.description as string | null) ?? null,
      how_to_apply:      (p.how_to_apply as string | null) ?? null,
      status:            'active',
      source:            'tier3_manual',
    })

    if (error) {
      alert(`Failed to approve: ${error.message}`)
      return
    }

    await supabase
      .from('opportunity_submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', sub.id)

    setSubmissions((prev) => prev.filter((s) => s.id !== sub.id))
  }

  async function reject(id: string, notes: string) {
    await supabase
      .from('opportunity_submissions')
      .update({ status: 'rejected', reviewer_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Checking permissions…</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Submission Review</h1>
        <a href="/admin" className="text-sm text-primary hover:underline">← Admin home</a>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!loading && submissions.length === 0 && (
        <p className="text-center py-16 text-muted-foreground">No pending submissions. 🎉</p>
      )}

      <div className="space-y-4">
        {submissions.map((sub) => (
          <SubmissionCard key={sub.id} sub={sub} onApprove={approve} onReject={reject} />
        ))}
      </div>
    </div>
  )
}

function SubmissionCard({
  sub,
  onApprove,
  onReject,
}: {
  sub: Submission
  onApprove: (s: Submission) => Promise<void>
  onReject: (id: string, notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState('')
  const [busy,  setBusy]  = useState(false)
  const p = sub.raw_payload as {
    title?: string
    role_type?: string
    location?: string
    application_url?: string
    application_deadline?: string
    grad_years?: number[]
    description?: string
    how_to_apply?: string
  }

  return (
    <div className="border rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{sub.firm_name}</p>
          <p className="text-sm text-muted-foreground">{p.title as string}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {sub.submitted_by_email} · {new Date(sub.created_at).toLocaleDateString()}
          </p>
        </div>
        {typeof p.application_url === 'string' && p.application_url && (
          <a
            href={p.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
          >
            View posting <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Payload preview */}
      <div className="text-xs bg-muted/40 rounded-md p-3 space-y-1">
        {p.role_type          && <p><span className="font-medium">Type:</span> {p.role_type as string}</p>}
        {p.location           && <p><span className="font-medium">Location:</span> {p.location as string}</p>}
        {p.application_deadline && <p><span className="font-medium">Deadline:</span> {p.application_deadline as string}</p>}
        {Array.isArray(p.grad_years) && p.grad_years.length > 0 && (
          <p><span className="font-medium">Grad years:</span> {(p.grad_years as number[]).join(', ')}</p>
        )}
        {p.description && <p className="mt-1 text-muted-foreground">{p.description as string}</p>}
      </div>

      {/* Action row */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Reviewer notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 border rounded px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          disabled={busy}
          onClick={async () => { setBusy(true); await onApprove(sub); setBusy(false) }}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-medium hover:opacity-90 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={async () => { setBusy(true); await onReject(sub.id, notes); setBusy(false) }}
          className="text-xs border px-3 py-1.5 rounded font-medium hover:bg-muted disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
