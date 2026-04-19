import { ExternalLink } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Resource, ResourceCategory } from '@/lib/types'

const CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: 'case_prep',     label: 'Case Prep'       },
  { value: 'resume',        label: 'Resume'          },
  { value: 'behavioral',    label: 'Behavioral'      },
  { value: 'networking',    label: 'Networking'      },
  { value: 'firm_research', label: 'Firm Research'   },
  { value: 'market_sizing', label: 'Market Sizing'   },
]

export const revalidate = 3600

export default async function ResourcesPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: true })

  const byCategory = (data ?? []).reduce<Partial<Record<ResourceCategory, Resource[]>>>(
    (acc, r) => {
      const cat = r.category as ResourceCategory
      acc[cat] = [...(acc[cat] ?? []), r]
      return acc
    },
    {}
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Prep Resources</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Curated by club officers and alumni. Start with Case Prep, then branch out.
      </p>

      <div className="space-y-10">
        {CATEGORIES.map(({ value, label }) => {
          const resources = byCategory[value] ?? []
          if (resources.length === 0) return null

          return (
            <section key={value}>
              <h2 className="font-semibold text-lg mb-4 pb-2 border-b">{label}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded-lg p-4 hover:border-primary/40 hover:bg-muted/20 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {r.title}
                      </p>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {r.description}
                      </p>
                    )}
                    {r.recommended_by && (
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        Recommended by {r.recommended_by}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {(data ?? []).length === 0 && (
        <p className="text-center py-20 text-muted-foreground">
          Resources coming soon. Check back!
        </p>
      )}
    </div>
  )
}
