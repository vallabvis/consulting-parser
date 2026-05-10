'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import DeadlineBadge from '@/components/shared/DeadlineBadge'
import type { UserApplication, ApplicationStatus } from '@/lib/types'
import { Plus, Briefcase, Clock, TrendingUp, ChevronRight, Trophy } from 'lucide-react'

const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'interested',   label: 'Interested'   },
  { status: 'applied',      label: 'Applied'      },
  { status: 'oa_received',  label: 'OA Received'  },
  { status: 'oa_completed', label: 'OA Completed' },
  { status: 'first_round',  label: 'First Round'  },
  { status: 'final_round',  label: 'Final Round'  },
  { status: 'offer',        label: 'Offer 🎉'     },
  { status: 'rejected',     label: 'Rejected'     },
  { status: 'withdrew',     label: 'Withdrew'     },
]

const DISPLAY_GROUPS = [
  { label: 'Interested',  statuses: ['interested'] as ApplicationStatus[] },
  { label: 'In Progress', statuses: ['applied','oa_received','oa_completed','first_round','final_round'] as ApplicationStatus[] },
  { label: 'Decided',     statuses: ['offer','rejected','withdrew'] as ApplicationStatus[] },
]

interface UpcomingOpp {
  id: string; firm_name: string; role_title: string; deadline: string; firm_tier: string
}

function greetingText() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function daysLeft(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
}

export default function DashboardPage() {
  const supabase = createClient()
  const [profile,   setProfile]   = useState<{ full_name: string } | null>(null)
  const [apps,      setApps]      = useState<UserApplication[]>([])
  const [liveOpps,  setLiveOpps]  = useState<UpcomingOpp[]>([])
  const [totalLive, setTotalLive] = useState(0)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      const [{ data: prof }, { data: appsData }, { data: oppsData }, { count }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('user_applications').select('*, opportunity:opportunities(*)').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('opportunities').select('id, firm_name, role_title, deadline, firm_tier').eq('status', 'active').not('deadline', 'is', null).gte('deadline', new Date().toISOString()).order('deadline', { ascending: true }).limit(8),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setProfile(prof)
      setApps((appsData ?? []) as unknown as UserApplication[])
      setLiveOpps((oppsData ?? []) as UpcomingOpp[])
      setTotalLive(count ?? 0)
      setLoading(false)
    })
  }, [])

  async function updateStatus(appId: string, status: ApplicationStatus) {
    await supabase.from('user_applications').update({ status }).eq('id', appId)
    setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)))
  }

  const firstName      = profile?.full_name?.split(' ')[0] ?? ''
  const urgentTracked  = apps.filter((a) => {
    if (!['interested','applied'].includes(a.status) || !a.opportunity?.deadline) return false
    const d = daysLeft(a.opportunity.deadline)
    return d >= 0 && d <= 14
  }).sort((a, b) => new Date(a.opportunity!.deadline!).getTime() - new Date(b.opportunity!.deadline!).getTime())

  const interestedCount = apps.filter((a) => a.status === 'interested').length
  const inProgressCount = apps.filter((a) => ['applied','oa_received','oa_completed','first_round','final_round'].includes(a.status)).length
  const offerCount      = apps.filter((a) => a.status === 'offer').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-7">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#8B1A1A] tracking-wide">{todayLabel()}</p>
          <h1 className="text-3xl font-serif font-semibold mt-0.5 text-foreground">
            {greetingText()}{firstName ? `, ${firstName}` : ''}.
          </h1>
        </div>
        <Link
          href="/opportunities"
          className="hidden sm:inline-flex items-center gap-1.5 bg-[#8B1A1A] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#701515] transition-colors"
        >
          <Plus className="h-4 w-4" /> Browse Opportunities
        </Link>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border rounded-xl p-4 h-20 animate-pulse bg-muted/40" />
        )) : [
          { label: 'Live Opportunities', value: totalLive,            icon: Briefcase,  color: 'text-[#8B1A1A]',   bg: 'bg-[#8B1A1A]/10 dark:bg-[#8B1A1A]/20' },
          { label: 'Tracked',            value: apps.length,          icon: TrendingUp, color: 'text-blue-500',     bg: 'bg-blue-500/10 dark:bg-blue-500/20'     },
          { label: 'Urgent Deadlines',   value: urgentTracked.length, icon: Clock,      color: 'text-amber-500',    bg: 'bg-amber-500/10 dark:bg-amber-500/20'   },
          { label: 'Offers',             value: offerCount,           icon: Trophy,     color: 'text-emerald-500',  bg: 'bg-emerald-500/10 dark:bg-emerald-500/20'},
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground leading-tight uppercase tracking-wide">{label}</p>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column content ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Left — upcoming deadlines */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-[#8B1A1A] tracking-wide uppercase text-xs">All Upcoming Deadlines</h2>
            <Link href="/opportunities" className="text-xs text-[#8B1A1A] hover:underline font-semibold flex items-center gap-0.5">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-11 bg-muted/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : liveOpps.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No upcoming deadlines right now.</div>
          ) : (
            <div className="divide-y divide-border">
              {liveOpps.map((opp) => {
                const d = daysLeft(opp.deadline)
                return (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-[#8B1A1A] transition-colors truncate">
                        {opp.firm_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{opp.role_title}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      d === 0 ? 'bg-red-500/15 text-red-500' :
                      d <= 7  ? 'bg-amber-500/15 text-amber-500' :
                                'bg-muted text-muted-foreground'
                    }`}>
                      {d === 0 ? 'Today' : d === 1 ? '1 day' : `${d}d`}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — pipeline + urgent deadlines + quick nav */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pipeline */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-bold text-[#8B1A1A] tracking-wide uppercase text-xs">Your Pipeline</h2>
            </div>
            <div className="p-5 space-y-3.5">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 bg-muted/40 rounded animate-pulse" />
              )) : apps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No applications yet.{' '}
                  <Link href="/opportunities" className="text-[#8B1A1A] hover:underline font-semibold">Browse opps →</Link>
                </p>
              ) : (
                [
                  { label: 'Interested',  count: interestedCount,                                   barColor: 'bg-blue-500'    },
                  { label: 'In Progress', count: inProgressCount,                                   barColor: 'bg-amber-500'   },
                  { label: 'Decided',     count: apps.length - interestedCount - inProgressCount,   barColor: 'bg-[#8B1A1A]'   },
                ].map(({ label, count, barColor }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                      <span className="text-sm font-bold text-[#8B1A1A]">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: apps.length > 0 ? `${(count / apps.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 pb-4">
              <a href="#tracker" className="text-xs font-semibold text-[#8B1A1A] hover:underline">Open full tracker →</a>
            </div>
          </div>

          {/* Urgent tracked deadlines */}
          {urgentTracked.length > 0 && (
            <div className="bg-[#8B1A1A]/8 dark:bg-[#8B1A1A]/15 border border-[#8B1A1A]/25 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#8B1A1A]/20">
                <h2 className="font-bold text-[#8B1A1A] tracking-wide uppercase text-xs">Your Deadlines — 14 Days</h2>
              </div>
              <div className="divide-y divide-[#8B1A1A]/10">
                {urgentTracked.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    href={`/opportunities/${a.opportunity_id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#8B1A1A]/8 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-sm font-semibold text-foreground truncate">{a.opportunity?.firm_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.opportunity?.role_title}</p>
                    </div>
                    {a.opportunity?.deadline && <DeadlineBadge deadline={a.opportunity.deadline} />}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/alumni',             label: 'Alumni Network', emoji: '🤝' },
              { href: '/resources',          label: 'Case Prep',      emoji: '📚' },
              { href: '/submit-opportunity', label: 'Submit Opp',     emoji: '📥' },
              { href: '/opportunities',      label: 'All Opps',       emoji: '🔍' },
            ].map(({ href, label, emoji }) => (
              <Link
                key={href}
                href={href}
                className="bg-card border border-border rounded-xl px-4 py-3.5 hover:border-[#8B1A1A]/50 hover:bg-[#8B1A1A]/5 transition-all group"
              >
                <span className="text-lg">{emoji}</span>
                <p className="text-xs font-bold mt-1.5 text-foreground group-hover:text-[#8B1A1A] transition-colors">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full tracker ───────────────────────────────────────────────── */}
      <div id="tracker" className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#8B1A1A] tracking-wide uppercase text-xs">Application Tracker</h2>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {apps.length} opportunit{apps.length === 1 ? 'y' : 'ies'} tracked
            </p>
          </div>
          <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B1A1A] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add
          </Link>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map((i) => <div key={i} className="border border-border rounded-lg p-4 h-40 animate-pulse bg-muted/30" />)}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <p className="font-semibold text-foreground">Nothing tracked yet.</p>
              <p className="text-sm mt-1">
                Browse{' '}
                <Link href="/opportunities" className="text-[#8B1A1A] hover:underline font-semibold">opportunities</Link>{' '}
                and save ones you&apos;re interested in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DISPLAY_GROUPS.map(({ label, statuses }) => {
                const groupApps = apps.filter((a) => statuses.includes(a.status))
                return (
                  <div key={label} className="border border-border rounded-xl p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-xs uppercase tracking-wide text-[#8B1A1A]">{label}</h3>
                      <span className="text-xs bg-card border border-border px-1.5 py-0.5 rounded-full font-bold text-foreground tabular-nums">
                        {groupApps.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupApps.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-5">Empty</p>
                      )}
                      {groupApps.map((a) => (
                        <div key={a.id} className="bg-card border border-border rounded-lg p-3 text-sm">
                          <Link
                            href={`/opportunities/${a.opportunity_id}`}
                            className="font-semibold text-foreground hover:text-[#8B1A1A] transition-colors block truncate"
                          >
                            {a.opportunity?.firm_name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{a.opportunity?.role_title}</p>
                          {a.opportunity?.deadline && (
                            <div className="mt-2"><DeadlineBadge deadline={a.opportunity.deadline} /></div>
                          )}
                          <select
                            value={a.status}
                            onChange={(e) => updateStatus(a.id, e.target.value as ApplicationStatus)}
                            className="mt-2.5 w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]/40"
                          >
                            {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
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
      </div>
    </div>
  )
}
