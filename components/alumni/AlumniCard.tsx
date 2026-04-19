import { MessageSquare, Linkedin } from 'lucide-react'
import type { Alumni } from '@/lib/types'

interface Props {
  alumni: Alumni
}

export default function AlumniCard({ alumni: a }: Props) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
          {a.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{a.full_name}</p>
          <p className="text-xs text-muted-foreground">{a.current_role}</p>
          <p className="text-xs text-muted-foreground">{a.current_firm}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">'{String(a.grad_year).slice(2)}</span>
      </div>

      {/* Expertise tags */}
      {a.areas_of_expertise.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {a.areas_of_expertise.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {tag}
            </span>
          ))}
          {a.areas_of_expertise.length > 3 && (
            <span className="text-xs text-muted-foreground">+{a.areas_of_expertise.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {a.open_to_chat ? (
          <button className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-md py-1.5 hover:opacity-90 transition-opacity">
            <MessageSquare className="h-3 w-3" /> Request intro
          </button>
        ) : (
          <span className="flex-1 text-center text-xs text-muted-foreground py-1.5">
            Not accepting chats
          </span>
        )}
        {a.linkedin_url && (
          <a
            href={a.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
