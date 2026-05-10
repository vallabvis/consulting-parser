import { createServerSupabaseClient } from '@/lib/supabase-server'
import OpportunitiesList from '@/components/opportunities/OpportunitiesList'
import type { Opportunity } from '@/lib/types'

// Server Component: fetches opportunities at request time, passes to client list.
// This eliminates the "stuck on Loading..." bug caused by client-side Supabase
// initialization failures — data is always fetched server-side before the page renders.

export default async function OpportunitiesPage() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('opportunities')
    .select('*, firms(careers_url)')
    .eq('status', 'active')
    .order('deadline', { ascending: true, nullsFirst: false })

  const opportunities = (data ?? []).map((row: any) => ({
    ...row,
    firm_careers_url: row.firms?.careers_url ?? null,
  })) as Opportunity[]

  return <OpportunitiesList initialOpportunities={opportunities} />
}
