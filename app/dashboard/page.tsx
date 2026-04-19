'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DeadlineBadge from '@/components/shared/DeadlineBadge'
import type { UserApplication, ApplicationStatus } from '@/lib/types'

// Kanban columns in order
const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'interested',    label: 'Interested'    },
  { status: 'applied',       label: 'Applied'       },
  { status: 'oa_received',   label: 'OA Received'   },
  { status: 'oa_completed',  label: 'OA Completed'  },
  { status: 'first_round',   label: 'First Round'   },
  { status: 'final_round',   label: 'Final Round'   },
  { status: 'offer',         label: 'Offer 🎉'      },
  { status: 'rejected',      label: 'Rejected'      },
  { status: 'withdrew',      label: 'Withdrew'      },
]

// Simplified view: group into Interested / Active / Decided
const DISPLAY_GROUPS = [
  { label: 'Interested',   statuses: ['interested'] as ApplicationStatus[]                   },
  { label: 'Applied',      statuses: ['applied', 'oa_received', 'oa_completed',
                                      'first_round', 'final_round'] as ApplicationStatus[]   },
  { label: 'Decided',      statuses: ['offer', 'rejected', 'withdrew'] as ApplicationStatus[] },
]

export default function DashboardPage() {
  const supabase = createClient()
  const [apps, setApps]       = useState<UserApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      supabase
        .from('user_applications')
        .select('*, opportunity:opportunities(*)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          setApps((data ?? []) as unknown as UserApplication[])
          setLoading(false)
        })
    })
  }, [])

  async function updateStatus(appId: string, status: ApplicationStatus) {
    await supabase.from('user_applications').update({ status }).eq('id', appId)
    setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a))
  }

  // Upcoming deadlines for saved opportunities (interested or applied, deadline within 14 days)
  const upcoming = apps
    .filter((a) => {
      if (!['interested', 'applied'].includes(a.status)) return false
      if (!a.opportunity?.deadline) return false
      const days = (new Date(a.opportunity.deadline).getTime() - Date.now()) / 86_400_000
      return days >= 0 && days <= 14
    })
    .sort((a, b) =>
      new Date(a.opportunity!.deadline!).getTime() - new Date(b.opportunity!.deadline!).getTime()
    )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {apps.length} saved opportunit{apps.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Opportunity
        </Link>
      </div>

      {/* Upcoming deadlines widget */}
      {upcoming.length > 0 && (
        <div className="mb-8 border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Upcoming Deadlines (next 14 days)</h2>
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <Link href={`/opportunities/${a.opportunity_id}`} className="hover:text-primary">
                  <span className="font-medium">{a.opportunity?.firm_name}</span>
                  <span className="text-muted-foreground ml-2">{a.opportunity?.role_title}</span>
                </Link>
                {a.opportunity?.deadline && (
                  <DeadlineBadge deadline={a.opportunity.deadline} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 h-64 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Nothing tracked yet.</p>
          <p className="text-sm mt-1">
            Browse <Link href="/opportunities" className="text-primary hover:underline">opportunities</Link> and
            save ones you&apos;re interested in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DISPLAY_GROUPS.map(({ label, statuses }) => {
            const groupApps = apps.filter((a) => statuses.includes(a.status))
            return (
              <div key={label} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{label}</h2>
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {groupApps.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupApps.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Empty</p>
                  )}
                  {groupApps.map((a) => (
                    <div key={a.id} className="border rounded-md p-3 text-sm">
                      <Link href={`/opportunities/${a.opportunity_id}`} className="font-medium hover:text-primary">
                        {a.opportunity?.firm_name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{a.opportunity?.role_title}</p>
                      {a.opportunity?.deadline && (
                        <div className="mt-2">
                          <DeadlineBadge deadline={a.opportunity.deadline} />
                        </div>
                      )}
                      {/* Move to next status */}
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as ApplicationStatus)}
                        className="mt-2 w-full text-xs border rounded px-1.5 py-1 bg-background"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
