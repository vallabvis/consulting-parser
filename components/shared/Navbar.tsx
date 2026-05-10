'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/opportunities',      label: 'Opportunities' },
  { href: '/submit-opportunity', label: 'Submit Opp'    },
  { href: '/alumni',             label: 'Alumni'        },
  { href: '/resources',          label: 'Resources'     },
  { href: '/dashboard',          label: 'My Tracker'    },
]

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-white/8 transition-colors"
      title="Toggle dark mode"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const supabase = createClient()

  const [open,      setOpen]      = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email ?? null))
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
    <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center">
          <Image
            src="/wcc-logo.png"
            alt="Wisconsin Consulting Club"
            width={280}
            height={75}
            className="h-16 w-auto object-contain dark:brightness-0 dark:invert"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3.5 py-1.5 rounded text-sm transition-colors font-medium border-b-2',
                pathname.startsWith(href)
                  ? 'text-[#8B1A1A] border-[#8B1A1A] bg-[#8B1A1A]/5'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth + theme toggle — desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {userEmail ? (
            <>
              <span className="text-xs text-muted-foreground max-w-[140px] truncate">{userEmail}</span>
              <button
                onClick={signOut}
                className="text-xs px-3 py-1.5 border rounded font-medium hover:bg-muted dark:hover:bg-white/5 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground font-medium">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm px-4 py-1.5 bg-[#8B1A1A] text-white rounded font-semibold hover:bg-[#701515] transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button className="p-1.5 rounded hover:bg-muted transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-0.5 bg-background">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-2.5 rounded text-sm font-medium',
                pathname.startsWith(href)
                  ? 'text-[#8B1A1A] bg-[#8B1A1A]/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border mt-2 flex gap-2">
            {userEmail ? (
              <button onClick={signOut} className="text-sm text-muted-foreground px-3 py-2">
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm px-3 py-2 border rounded font-medium">
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm px-3 py-2 bg-[#8B1A1A] text-white rounded font-semibold">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
