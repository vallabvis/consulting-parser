import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SubmitOpportunityForm from './SubmitOpportunityForm'

export default async function SubmitOpportunityPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: firms } = await supabase
    .from('firms')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Submit an Opportunity</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Found a great opportunity? Submit it here and our officers will review it within 24 hours.
      </p>
      <SubmitOpportunityForm
        firms={(firms ?? []).map((f) => ({ id: f.id as string, name: f.name as string }))}
        userEmail={user.email ?? ''}
      />
    </div>
  )
}
