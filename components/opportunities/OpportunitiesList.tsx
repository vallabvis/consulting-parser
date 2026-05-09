'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import FilterSidebar from '@/components/opportunities/FilterSidebar'
import type { Opportunity, FirmTier, RoleType } from '@/lib/types'

interface Props {
  initialOpportunities: Opportunity[]
}

export default function OpportunitiesList({ initialOpportunities }: Props) {
  const [search,    setSearch]    = useState('')
  const [gradYears, setGradYears] = useState<number[]>([])
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([])
  const [tiers,     setTiers]     = useState<FirmTier[]>([])

  const filtered = initialOpportunities.filter((opp) => {
    if (search && !`${opp.firm_name} ${opp.role_title}`.toLowerCase().includes(search.toLowerCase()))
      return false
    if (gradYears.length && !opp.target_grad_years.some((y) => gradYears.includes(y)))
      return false
    if (roleTypes.length && !roleTypes.includes(opp.role_type))
      return false
    if (tiers.length && !tiers.includes(opp.firm_tier))
      return false
    return true
  })

  const hasData = initialOpportunities.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      {/* Sticky filter sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-6">
          <FilterSidebar
            gradYears={gradYears} onGradYearsChange={setGradYears}
            roleTypes={roleTypes} onRoleTypesChange={setRoleTypes}
            tiers={tiers}         onTiersChange={setTiers}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search firm or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Result count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} opportunit{filtered.length === 1 ? 'y' : 'ies'}
        </p>

        {/* Card grid / empty states */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {hasData ? (
              <>
                <p className="text-lg font-medium">No opportunities match your filters.</p>
                <p className="text-sm mt-1">Try broadening your search or clearing filters.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No opportunities yet.</p>
                <p className="text-sm mt-1">
                  Check back soon, or{' '}
                  <a href="/submit-opportunity" className="text-primary hover:underline">
                    submit one
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
