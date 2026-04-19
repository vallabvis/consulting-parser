'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/alumni',        label: 'Alumni'        },
  { href: '/resources',     label: 'Resources'     },
  { href: '/dashboard',     label: 'My Tracker'    },
]

export default function Navbar() {
  const pathname = usePathname()
  const supabase = createClient()

  const [open,      setOpen]      = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="font-bold text-base tracking-tight">
          <span className="text-primary">Wisco</span> Consulting Hub
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname.startsWith(href)
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-2">
          {userEmail ? (
            <>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
              <button
                onClick={signOut}
                className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-muted"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 bg-background">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-md text-sm',
                pathname.startsWith(href)
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t mt-2">
            {userEmail ? (
              <button onClick={signOut} className="block w-full text-left px-3 py-2 text-sm text-muted-foreground">
                Sign out ({userEmail})
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm px-3 py-2 border rounded-md">
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm px-3 py-2 bg-primary text-primary-foreground rounded-md">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
