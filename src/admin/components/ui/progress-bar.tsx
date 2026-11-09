import { cn } from '@/admin/lib/utils'

/** Barra de progresso acessível (0–100). */
export function ProgressBar({ value, label, className, tone = 'default' }: { value: number; label: string; className?: string; tone?: 'default' | 'success' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full transition-[width]', tone === 'success' ? 'bg-[#0b5441]' : 'bg-primary')} style={{ width: `${pct}%` }} />
    </div>
  )
}
