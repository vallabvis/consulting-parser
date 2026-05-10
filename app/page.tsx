import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const PLACEMENT_FIRMS = [
  'McKinsey', 'BCG', 'Bain', 'Deloitte',
  'EY-Parthenon', 'Oliver Wyman', 'Kearney', 'ZS Associates',
]

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#060606]">

      {/* Ambient maroon glow at bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 140% 60% at 50% 115%, rgba(139,26,26,0.22) 0%, transparent 65%)' }}
      />
      {/* Secondary subtle glow top-left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 15% 25%, rgba(139,26,26,0.05) 0%, transparent 60%)' }}
      />
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">

        {/* Logo — white via CSS filter */}
        <Image
          src="/wcc-logo.png"
          alt="Wisconsin Consulting Club"
          width={260}
          height={70}
          className="h-[52px] w-auto mb-12"
          style={{ filter: 'brightness(0) invert(1)' }}
          priority
        />

        <h1 className="text-[44px] font-serif font-medium text-white leading-[1.08] tracking-tight mb-4">
          Your launchpad<br />to consulting.
        </h1>
        <p className="text-white/40 text-[15px] leading-relaxed mb-10">
          Live recruiting opportunities, alumni connections,<br className="hidden sm:block" />
          and case prep resources — built for Badgers.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/login"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8B1A1A] text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-[#701515] transition-colors"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="flex-1 inline-flex items-center justify-center border border-white/12 text-white/65 px-6 py-3 rounded-md font-semibold text-sm hover:bg-white/5 hover:border-white/25 hover:text-white/90 transition-all"
          >
            Create account
          </Link>
        </div>

        {/* Firm placement row */}
        <div className="mt-16 pt-8 w-full border-t border-white/[0.07]">
          <p className="text-[10px] text-white/18 uppercase tracking-[0.22em] font-medium mb-5">
            Member placements at
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {PLACEMENT_FIRMS.map((f) => (
              <span key={f} className="text-[11px] text-white/22 font-medium tracking-wide">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom UW tag */}
      <p className="absolute bottom-6 text-[11px] text-white/15 tracking-wide">
        Wisconsin Consulting Club · UW–Madison
      </p>
    </div>
  )
}
