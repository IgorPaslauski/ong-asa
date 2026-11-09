import { Card } from '@/admin/components/ui/card'
import { formatNumber } from '@/admin/lib/format'

/** Faixa compacta de totais no topo das listagens. */
export function StatStrip({ label, items }: { label: string; items: [string, number | string][] }) {
  return (
    <ul aria-label={label} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([name, value]) => (
        <li key={name}>
          <Card className="flex-row items-baseline justify-between gap-2 px-4 py-2.5">
            <span className="text-[13px] text-muted-foreground">{name}</span>
            <strong className="text-lg font-semibold tabular">{typeof value === 'number' ? formatNumber(value) : value}</strong>
          </Card>
        </li>
      ))}
    </ul>
  )
}
