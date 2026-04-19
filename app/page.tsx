import Link from 'next/link'
import { ArrowRight, Briefcase, Clock, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const revalidate = 3600 // re-fetch stats once per hour

async function getStats() {
  const supabase = await createServerSupabaseClient()

  const [{ count: oppsCount }, { count: alumniCount }] = await Promise.all([
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('verified', true),
  ])

  // Deadlines in next 7 days
  const now = new Date()
  const week = new Date(now.getTime() + 7 * 86_400_000)
  const { count: upcomingCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('deadline', now.toISOString())
    .lte('deadline', week.toISOString())

  return {
    opportunities: oppsCount ?? 0,
    alumni: alumniCount ?? 0,
    upcoming: upcomingCount ?? 0,
  }
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
    .limit(5)
  return data ?? []
}

export default async function LandingPage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedDeadlines()])

  return (
    <div className="flex flex-col">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-4">
          Wisconsin Consulting Club
        </p>
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your launchpad to consulting.
        </h1>
        <p className="text-xl text-muted-foreground mb-10">
          Live recruiting opportunities, alumni connections, and case prep
          resources — built for Badgers, updated daily.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Browse Opportunities <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/alumni"
            className="inline-flex items-center gap-2 border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Meet Alumni
          </Link>
        </div>
      </section>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-primary">{stats.opportunities}</p>
            <p className="text-sm text-muted-foreground mt-1">Live opportunities</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary">{stats.upcoming}</p>
            <p className="text-sm text-muted-foreground mt-1">Deadlines this week</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary">{stats.alumni}</p>
            <p className="text-sm text-muted-foreground mt-1">Alumni in network</p>
          </div>
        </div>
      </section>

      {/* ── Featured deadlines ────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Upcoming Deadlines
          </h2>
          <Link href="/opportunities" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y border rounded-lg overflow-hidden">
          {featured.length === 0 && (
            <p className="px-4 py-8 text-center text-muted-foreground text-sm">
              No upcoming deadlines right now. Check back soon!
            </p>
          )}
          {featured.map((opp) => {
            const daysLeft = opp.deadline
              ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86_400_000)
              : null
            const urgent = daysLeft !== null && daysLeft <= 7

            return (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <span className="font-medium">{opp.firm_name}</span>
                  <span className="text-muted-foreground ml-2 text-sm">{opp.role_title}</span>
                </div>
                {daysLeft !== null && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      urgent
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── CTA row ───────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-20 w-full grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Briefcase,
            title: 'Track Applications',
            body: 'Kanban board from "Interested" to offer. Never lose track.',
            href: '/dashboard',
            cta: 'Open tracker',
          },
          {
            icon: Users,
            title: 'Alumni Network',
            body: '60+ Badger alums open to coffee chats at MBB, Big 4, and beyond.',
            href: '/alumni',
            cta: 'Browse alumni',
          },
          {
            icon: Clock,
            title: 'Prep Resources',
            body: 'Case books, LOMS recordings, market sizing drills — curated by officers.',
            href: '/resources',
            cta: 'Start prepping',
          },
        ].map(({ icon: Icon, title, body, href, cta }) => (
          <Link
            key={href}
            href={href}
            className="border rounded-lg p-5 hover:border-primary/40 hover:bg-muted/20 transition-colors flex flex-col gap-3"
          >
            <Icon className="h-5 w-5 text-primary" />
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground flex-1">{body}</p>
            <span className="text-sm text-primary font-medium">{cta} →</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
