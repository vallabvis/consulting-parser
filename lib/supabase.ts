import { createBrowserClient } from '@supabase/ssr'

// Browser client — safe to import in Client Components.
// Calling this each render is fine; @supabase/ssr memoizes by URL+key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
