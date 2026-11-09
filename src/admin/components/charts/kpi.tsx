import type { ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'
import { Card } from '@/admin/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/admin/components/ui/tooltip'
import { cn } from '@/admin/lib/utils'

/** Indicador numérico padrão: rótulo, valor, escopo/período e explicação do cálculo. */
export function Kpi({
  label,
  value,
  scope,
  explanation,
  tone = 'default',
  className,
  children,
}: {
  label: string
  value: ReactNode
  /** Recorte ao qual o número se refere (ex.: "no período", "histórico total"). */
  scope: string
  explanation?: string
  tone?: 'default' | 'warning'
  className?: string
  children?: ReactNode
}) {
  return (
    <Card className={cn('gap-1 px-4 py-3.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-medium text-muted-foreground">{label}</h3>
        {explanation ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`Como é calculado: ${label}`} className="rounded-full text-muted-foreground hover:text-foreground">
                <InfoIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{explanation}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className={cn('text-[26px] leading-tight font-semibold tracking-tight tabular', tone === 'warning' && 'text-[#8a5a10]')}>{value}</p>
      <p className="text-xs text-muted-foreground">{scope}</p>
      {children}
    </Card>
  )
}
