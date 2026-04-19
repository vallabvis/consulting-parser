import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import DeadlineBadge from '@/components/shared/DeadlineBadge'
import { cn } from '@/lib/utils'
import type { Opportunity } from '@/lib/types'

const TIER_COLORS: Record<string, string> = {
  mbb:     'bg-purple-50 text-purple-700 border-purple-200',
  big4:    'bg-blue-50 text-blue-700 border-blue-200',
  tier2:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  boutique:'bg-amber-50 text-amber-700 border-amber-200',
  other:   'bg-muted text-muted-foreground border-border',
}

const TIER_LABELS: Record<string, string> = {
  mbb: 'MBB', big4: 'Big 4', tier2: 'Tier 2', boutique: 'Boutique', other: 'Other',
}

interface Props {
  opportunity: Opportunity
}

export default function OpportunityCard({ opportunity: opp }: Props) {
  const passed = opp.deadline && new Date(opp.deadline) < new Date()

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* Firm logo placeholder — 32×32 colored circle with initials */}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mb-2">
            {opp.firm_name.slice(0, 2).toUpperCase()}
          </div>
          <p className="font-semibold text-sm leading-tight">{opp.firm_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opp.role_title}</p>
        </div>
        {opp.deadline && !passed && <DeadlineBadge deadline={opp.deadline} />}
      </div>

      {/* Grad year badges */}
      {opp.target_grad_years.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {opp.target_grad_years.map((y) => (
            <span
              key={y}
              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
            >
              '{String(y).slice(2)}
            </span>
          ))}
        </div>
      )}

      {/* Tier badge */}
      <span
        className={cn(
          'self-start text-xs px-2 py-0.5 rounded-full border',
          TIER_COLORS[opp.firm_tier]
        )}
      >
        {TIER_LABELS[opp.firm_tier]}
      </span>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          href={`/opportunities/${opp.id}`}
          className="flex-1 text-center text-xs border rounded-md py-1.5 hover:bg-muted transition-colors"
        >
          View
        </Link>
        {opp.application_url && (
          <a
            href={opp.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 text-xs bg-primary text-primary-foreground rounded-md py-1.5 hover:opacity-90 transition-opacity"
          >
            Quick Apply <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
