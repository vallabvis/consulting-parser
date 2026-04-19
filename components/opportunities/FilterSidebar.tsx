import type { FirmTier, RoleType } from '@/lib/types'

const GRAD_YEARS = [2026, 2027, 2028, 2029]

const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: 'summer_internship',  label: 'Summer Internship'  },
  { value: 'sophomore_program',  label: 'Sophomore Program'  },
  { value: 'freshman_program',   label: 'Freshman Program'   },
  { value: 'diversity_program',  label: 'Diversity Program'  },
  { value: 'full_time',          label: 'Full-Time'          },
  { value: 'case_competition',   label: 'Case Competition'   },
  { value: 'networking_event',   label: 'Networking Event'   },
]

const TIERS: { value: FirmTier; label: string }[] = [
  { value: 'mbb',     label: 'MBB'      },
  { value: 'big4',    label: 'Big 4'    },
  { value: 'tier2',   label: 'Tier 2'   },
  { value: 'boutique',label: 'Boutique' },
  { value: 'other',   label: 'Other'    },
]

interface Props {
  gradYears:          number[]
  onGradYearsChange:  (v: number[]) => void
  roleTypes:          RoleType[]
  onRoleTypesChange:  (v: RoleType[]) => void
  tiers:              FirmTier[]
  onTiersChange:      (v: FirmTier[]) => void
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

export default function FilterSidebar(props: Props) {
  const { gradYears, onGradYearsChange, roleTypes, onRoleTypesChange, tiers, onTiersChange } = props

  const hasFilters = gradYears.length > 0 || roleTypes.length > 0 || tiers.length > 0

  return (
    <div className="space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Filters</p>
        {hasFilters && (
          <button
            onClick={() => {
              onGradYearsChange([])
              onRoleTypesChange([])
              onTiersChange([])
            }}
            className="text-xs text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Grad Year */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Grad Year
        </p>
        <div className="space-y-1.5">
          {GRAD_YEARS.map((y) => (
            <label key={y} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gradYears.includes(y)}
                onChange={() => onGradYearsChange(toggle(gradYears, y))}
                className="accent-primary"
              />
              <span>'{String(y).slice(2)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Role Type */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Role Type
        </p>
        <div className="space-y-1.5">
          {ROLE_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={roleTypes.includes(value)}
                onChange={() => onRoleTypesChange(toggle(roleTypes, value))}
                className="accent-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Firm Tier */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Firm Tier
        </p>
        <div className="space-y-1.5">
          {TIERS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tiers.includes(value)}
                onChange={() => onTiersChange(toggle(tiers, value))}
                className="accent-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
