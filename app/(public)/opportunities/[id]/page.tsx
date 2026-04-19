import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, MapPin, Calendar } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase'
import DeadlineBadge from '@/components/shared/DeadlineBadge'
import type { Opportunity } from '@/lib/types'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('opportunities')
    .select('firm_name, role_title')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Opportunity Not Found' }
  return { title: `${data.firm_name} – ${data.role_title} | Wisco Consulting Hub` }
}

export default async function OpportunityDetailPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data: opp } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'active')
    .single()

  if (!opp) notFound()

  const TIER_LABELS: Record<string, string> = {
    mbb: 'MBB', big4: 'Big 4', tier2: 'Tier 2', boutique: 'Boutique', other: 'Other',
  }

  const TYPE_LABELS: Record<string, string> = {
    full_time: 'Full-Time', summer_internship: 'Summer Internship',
    sophomore_program: 'Sophomore Program', freshman_program: 'Freshman Program',
    diversity_program: 'Diversity Program', case_competition: 'Case Competition',
    networking_event: 'Networking Event',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to opportunities
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{TIER_LABELS[opp.firm_tier]}</p>
            <h1 className="text-2xl font-bold">{opp.firm_name}</h1>
            <p className="text-lg text-muted-foreground">{opp.role_title}</p>
          </div>
          {opp.deadline && <DeadlineBadge deadline={opp.deadline} size="lg" />}
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="border text-xs px-2 py-0.5 rounded-full">
            {TYPE_LABELS[opp.role_type]}
          </span>
          {opp.location && (
            <span className="border text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {opp.location}
            </span>
          )}
          {opp.remote_eligible && (
            <span className="border text-xs px-2 py-0.5 rounded-full">Remote eligible</span>
          )}
          {opp.target_grad_years.map((y: number) => (
            <span key={y} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              '{String(y).slice(2)}
            </span>
          ))}
        </div>
      </div>

      {/* Eligibility notes */}
      {opp.eligibility_notes && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Eligibility</h2>
          <p className="text-sm text-muted-foreground">{opp.eligibility_notes}</p>
        </section>
      )}

      {/* Application steps */}
      {opp.application_steps?.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3">Application Steps</h2>
          <ol className="space-y-2">
            {opp.application_steps.map((step: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-muted-foreground pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Tips */}
      {opp.tips && (
        <section className="mb-8">
          <h2 className="font-semibold mb-2">Tips from Members</h2>
          <div className="border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground italic">
            {opp.tips}
          </div>
        </section>
      )}

      {/* Deadline */}
      {opp.deadline && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Calendar className="h-4 w-4" />
          Deadline:{' '}
          <span className="font-medium text-foreground">
            {new Date(opp.deadline).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        {opp.application_url && (
          <a
            href={opp.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Apply Now <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {/* "Save to tracker" — requires auth, handled client-side in the next iteration */}
        <button className="border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          Save to My Tracker
        </button>
      </div>
    </div>
  )
}
