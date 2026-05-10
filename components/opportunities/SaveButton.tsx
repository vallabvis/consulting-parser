'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  opportunityId: string
  variant?: 'icon' | 'full'
}

export default function SaveButton({ opportunityId, variant = 'full' }: Props) {
  const supabase  = createClient()
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('user_applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('opportunity_id', opportunityId)
        .maybeSingle()
      setSaved(!!data)
      setLoading(false)
    })
  }, [opportunityId])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    if (!userId) { window.location.href = '/login'; return }

    if (saved) {
      await supabase
        .from('user_applications')
        .delete()
        .eq('user_id', userId)
        .eq('opportunity_id', opportunityId)
      setSaved(false)
    } else {
      await supabase
        .from('user_applications')
        .insert({ user_id: userId, opportunity_id: opportunityId, status: 'interested' })
      setSaved(true)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title={saved ? 'Remove from tracker' : 'Save to tracker'}
        className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
          saved
            ? 'text-[#8B1A1A] bg-[#8B1A1A]/10'
            : 'text-muted-foreground hover:text-[#8B1A1A] hover:bg-[#8B1A1A]/8'
        }`}
      >
        {saved
          ? <BookmarkCheck className="h-4 w-4" />
          : <Bookmark className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
        saved
          ? 'bg-[#8B1A1A]/10 text-[#8B1A1A] border-[#8B1A1A]/30 hover:bg-[#8B1A1A]/15'
          : 'hover:bg-muted dark:hover:bg-white/5'
      }`}
    >
      {loading ? '…' : saved ? '✓ Saved to Tracker' : 'Save to My Tracker'}
    </button>
  )
}
