'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AlumniCard from '@/components/alumni/AlumniCard'
import type { Alumni } from '@/lib/types'

export default function AlumniPage() {
  const supabase = createClient()
  const [all, setAll]         = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [firmFilter, setFirmFilter] = useState('')
  const [chatOnly, setChatOnly]     = useState(false)

  useEffect(() => {
    supabase
      .from('alumni')
      .select('*')
      .eq('verified', true)
      .order('grad_year', { ascending: false })
      .then(({ data }) => { setAll(data ?? []); setLoading(false) })
  }, [])

  const firms = [...new Set(all.map((a) => a.current_firm))].sort()

  const filtered = all.filter((a) => {
    if (search && !`${a.full_name} ${a.current_firm} ${a.current_title}`.toLowerCase().includes(search.toLowerCase()))
      return false
    if (firmFilter && a.current_firm !== firmFilter) return false
    if (chatOnly && !a.open_to_chat) return false
    return true
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Alumni Network</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Badgers in consulting. Reach out — most are happy to chat.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, firm, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={firmFilter}
          onChange={(e) => setFirmFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All firms</option>
          {firms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-lg px-3 py-2">
          <input
            type="checkbox"
            checked={chatOnly}
            onChange={(e) => setChatOnly(e.target.checked)}
            className="accent-primary"
          />
          Open to chat only
        </label>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {loading ? 'Loading...' : `${filtered.length} alumni`}
      </p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 h-36 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-20 text-muted-foreground">No alumni match your filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => <AlumniCard key={a.id} alumni={a} />)}
        </div>
      )}
    </div>
  )
}
