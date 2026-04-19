import Link from 'next/link'
import { ArrowRight, Briefcase, Clock, Users, ChevronRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const revalidate = 3600

async function getStats() {
  const supabase = await createServerSupabaseClient()
  const [{ count: oppsCount }, { count: alumniCount }] = await Promise.all([
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('verified', true),
  ])
  const now = new Date()
  const week = new Date(now.getTime() + 7 * 86_400_000)
  const { count: upcomingCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('deadline', now.toISOString())
    .lte('deadline', week.toISOString())
  return { opportunities: oppsCount ?? 0, alumni: alumniCount ?? 0, upcoming: upcomingCount ?? 0 }
}

async function getFeaturedDeadlines() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('opportunities')
    .select('id, firm_name, role_title, deadline, firm_tier, role_type')
    .eq('status', 'active')
    .not('deadline', 'is', null)
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(6)
  return data ?? []
}

const TIER_LABELS: Record<string, string> = {
  mbb: 'MBB', big4: 'Big 4', tier2: 'Tier 2', boutique: 'Boutique', other: 'Other',
}

// Firms with real recruiting presence — shown as logo placeholders in the placements row
const PLACEMENT_FIRMS = [
  'McKinsey', 'BCG', 'Bain', 'Deloitte', 'EY-Parthenon',
  'Strategy&', 'Oliver Wyman', 'L.E.K.', 'ZS Associates', 'Kearney',
]

export default async function LandingPage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedDeadlines()])

  return (
    <div className="flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#1a0000] text-white">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-red-300 mb-5">
            Wisconsin Consulting Club · UW–Madison
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 max-w-3xl">
            Your launchpad<br className="hidden md:block" /> to consulting.
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
            Live recruiting opportunities, alumni connections, and case prep
            resources — built for Badgers, updated daily.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center gap-2 bg-[#8B1A1A] text-white px-7 py-3 rounded font-semibold text-sm hover:bg-[#6e1515] transition-colors"
            >
              Browse Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3 rounded font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 divide-x">
          {[
            { value: stats.opportunities, label: 'Live opportunities' },
            { value: stats.upcoming,      label: 'Deadlines this week' },
            { value: stats.alumni,        label: 'Alumni in network' },
          ].map(({ value, label }) => (
            <div key={label} className="px-6 first:pl-0 last:pr-0 text-center">
              <p className="text-3xl font-bold text-[#8B1A1A]">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Placements row ────────────────────────────────────────────────── */}
      <section className="border-b bg-neutral-50 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground text-center mb-6">
            Recent Member Placements
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PLACEMENT_FIRMS.map((firm) => (
              <span key={firm} className="text-sm font-semibold text-neutral-400 hover:text-neutral-600 transition-colors">
                {firm}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming deadlines ────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Upcoming Deadlines</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Sorted by deadline — don't miss your window</p>
            </div>
            <Link href="/opportunities" className="text-sm text-[#8B1A1A] hover:underline font-medium flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No upcoming deadlines. Check back soon.</p>
          ) : (
            <div className="border rounded-lg divide-y overflow-hidden">
              {featured.map((opp) => {
                const daysLeft = opp.deadline
                  ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86_400_000)
                  : null
                const urgent = daysLeft !== null && daysLeft <= 7

                return (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors group"
                  >
                    {/* Tier badge */}
                    <span className="hidden sm:block text-xs font-medium text-muted-foreground w-14 shrink-0">
                      {TIER_LABELS[opp.firm_tier]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm group-hover:text-[#8B1A1A] transition-colors">
                        {opp.firm_name}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2 truncate">{opp.role_title}</span>
                    </div>
                    {daysLeft !== null && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded shrink-0 ${
                        urgent
                          ? 'bg-[#8B1A1A]/10 text-[#8B1A1A]'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────────────────── */}
      <section className="bg-neutral-50 border-t py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold tracking-tight mb-8">Everything you need to recruit</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Briefcase,
                title: 'Application Tracker',
                body: 'Personal kanban from "Interested" to offer. Set reminders for deadlines — never miss a window.',
                href: '/dashboard',
                cta: 'Open tracker',
              },
              {
                icon: Users,
                title: 'Alumni Network',
                body: 'Badger alums at McKinsey, BCG, Bain, and beyond — many open to coffee chats.',
                href: '/alumni',
                cta: 'Browse alumni',
              },
              {
                icon: Clock,
                title: 'Prep Resources',
                body: 'Case books, LOMS recordings, market sizing drills, firm guides — curated by officers.',
                href: '/resources',
                cta: 'Start prepping',
              },
            ].map(({ icon: Icon, title, body, href, cta }) => (
              <Link
                key={href}
                href={href}
                className="bg-white border rounded-lg p-6 hover:border-[#8B1A1A]/40 hover:shadow-sm transition-all flex flex-col gap-4 group"
              >
                <div className="w-9 h-9 rounded bg-[#8B1A1A]/10 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-[#8B1A1A]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
                </div>
                <span className="text-xs font-semibold text-[#8B1A1A] group-hover:underline mt-auto">
                  {cta} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="bg-[#1a0000] text-white py-14">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-lg">Ready to start recruiting?</p>
            <p className="text-white/60 text-sm mt-0.5">Create your free account with your @wisc.edu email.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 bg-[#8B1A1A] text-white px-6 py-2.5 rounded font-semibold text-sm hover:bg-[#6e1515] transition-colors"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
