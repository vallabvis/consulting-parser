'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('database login not supported') || m.includes('unexpected_failure'))
    return 'The database is starting up or temporarily unavailable. Wait 30 seconds and try again. If this keeps happening, your Supabase project may be paused — resume it at supabase.com/dashboard.'
  if (m.includes('email not confirmed'))
    return 'Please confirm your email first. Check your inbox for a message from Supabase and click the confirmation link.'
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials'))
    return 'Wrong email or password. Double-check and try again.'
  if (m.includes('user not found'))
    return 'No account found with that email. Sign up first.'
  if (m.includes('too many requests') || m.includes('over_email_send_rate_limit'))
    return 'Too many attempts. Wait a few minutes and try again.'
  return msg
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(friendlyError(error.message))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50">
      <div className="w-full max-w-sm bg-white border rounded-lg p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-semibold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your Wisco Consulting Hub account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              placeholder="you@wisc.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8B1A1A] text-white py-2.5 rounded-md font-semibold text-sm hover:bg-[#6e1515] transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#8B1A1A] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
