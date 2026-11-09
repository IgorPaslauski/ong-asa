import { useId, type ReactNode } from 'react'
import { BarChart3Icon, DatabaseIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { cn } from '@/admin/lib/utils'

export interface ChartDataRow {
  label: string
  values: { header: string; value: string }[]
}

/**
 * Moldura padrão de todo gráfico: título, explicação, unidade, período,
 * controles (período/granularidade), estado sem dados, origem dos dados e
 * alternativa textual (tabela) para leitores de tela.
 */
export function ChartCard({
  title,
  description,
  unit,
  period,
  source,
  controls,
  legend,
  empty,
  emptyMessage = 'Sem dados para o período selecionado.',
  altText,
  tableRows,
  children,
  className,
  height = 260,
}: {
  title: string
  description: string
  unit: string
  period: string
  source: string
  controls?: ReactNode
  legend?: ReactNode
  empty?: boolean
  emptyMessage?: string
  /** Resumo textual do gráfico (lido por tecnologias assistivas). */
  altText: string
  tableRows?: ChartDataRow[]
  children: ReactNode
  className?: string
  height?: number
}) {
  const id = useId()
  return (
    <Card className={cn('print-break-avoid', className)} aria-labelledby={`${id}-t`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle id={`${id}-t`}>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {controls ? <div className="no-print flex shrink-0 items-center gap-2">{controls}</div> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Unidade:</span> {unit} <span aria-hidden="true">·</span>{' '}
          <span className="font-medium text-foreground/80">Período:</span> {period}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        {legend ? <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">{legend}</div> : null}
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center text-[13px] text-muted-foreground" style={{ height }}>
            <BarChart3Icon className="size-6 opacity-60" aria-hidden="true" />
            {emptyMessage}
          </div>
        ) : (
          <>
            <figure role="img" aria-label={altText} style={{ height }} className="w-full">
              {children}
            </figure>
            {tableRows?.length ? (
              <details className="no-print mt-2 text-xs">
                <summary className="w-fit cursor-pointer text-muted-foreground hover:text-foreground">Ver dados em tabela</summary>
                <div className="mt-2 max-h-48 overflow-auto rounded-md border">
                  <table className="w-full text-xs">
                    <caption className="sr-only">{title}</caption>
                    <thead className="bg-muted/60">
                      <tr>
                        <th scope="col" className="px-2 py-1 text-left font-semibold">Categoria</th>
                        {tableRows[0].values.map((v) => (
                          <th key={v.header} scope="col" className="px-2 py-1 text-right font-semibold">{v.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((r) => (
                        <tr key={r.label} className="border-t">
                          <th scope="row" className="px-2 py-1 text-left font-normal">{r.label}</th>
                          {r.values.map((v) => (
                            <td key={v.header} className="px-2 py-1 text-right tabular">{v.value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
          </>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-1.5">
        <DatabaseIcon className="size-3" aria-hidden="true" />
        <span>Origem: {source}</span>
      </CardFooter>
    </Card>
  )
}

export function LegendItem({ color, label, hint }: { color: string; label: string; hint?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground" title={hint}>
      <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  )
}
