import { cn } from '@/lib/utils'

interface Props {
  deadline: string   // ISO date string
  size?: 'sm' | 'lg'
}

export default function DeadlineBadge({ deadline, size = 'sm' }: Props) {
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)

  if (daysLeft < 0) return null  // already passed — parent should hide the row

  let label: string
  if (daysLeft === 0)  label = 'Today'
  else if (daysLeft === 1) label = '1 day'
  else label = `${daysLeft}d`

  // Red when ≤7 days, amber when ≤14, gray otherwise
  const urgent  = daysLeft <= 7
  const warning = !urgent && daysLeft <= 14

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        size === 'sm'  ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        urgent  && 'bg-primary/10 text-primary',
        warning && 'bg-amber-50 text-amber-700 border border-amber-200',
        !urgent && !warning && 'bg-muted text-muted-foreground'
      )}
    >
      {label}
    </span>
  )
}
