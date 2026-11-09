import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART } from './palette'

export interface Series {
  key: string
  label: string
  color: string
}

type Row = object

interface TooltipEntry {
  name?: string | number
  value?: string | number | ReadonlyArray<string | number>
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

/** Tooltip único para todos os gráficos. */
function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
  showTotal,
}: {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: string | number
  format: (v: number) => string
  labelFormat?: (v: string) => string
  showTotal?: boolean
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + Number(p.value ?? 0), 0)
  return (
    <div className="admin-root min-w-40 rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{labelFormat ? labelFormat(String(label ?? '')) : String(label ?? '')}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-medium tabular">{format(Number(p.value ?? 0))}</span>
          </li>
        ))}
      </ul>
      {showTotal && payload.length > 1 ? (
        <p className="mt-1 flex justify-between gap-4 border-t pt-1 font-semibold">
          <span>Total</span>
          <span className="tabular">{format(total)}</span>
        </p>
      ) : null}
    </div>
  )
}

const axisProps = {
  tick: { fontSize: 11, fill: CHART.axis },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
} as const

export type TimeSeriesKind = 'line' | 'area' | 'bar'

/** Evolução temporal: linhas, áreas ou barras verticais (empilhadas ou comparativas). */
export function TimeSeriesChart({
  data,
  xKey,
  series,
  kind,
  stacked = false,
  format,
  tickFormat,
  labelFormat,
  xTick,
  showTotal,
}: {
  data: Row[]
  xKey: string
  series: Series[]
  kind: TimeSeriesKind
  stacked?: boolean
  format: (v: number) => string
  tickFormat?: (v: number) => string
  labelFormat?: (v: string) => string
  /** Rótulo curto do eixo X (o tooltip usa labelFormat, mais longo). */
  xTick?: (v: string) => string
  showTotal?: boolean
}) {
  const margin = { top: 8, right: 12, bottom: 0, left: 0 }
  const common = (
    <>
      <CartesianGrid vertical={false} stroke={CHART.grid} />
      <XAxis dataKey={xKey} {...axisProps} tickFormatter={xTick ?? labelFormat} interval="preserveStartEnd" minTickGap={16} />
      <YAxis {...axisProps} axisLine={false} width={56} tickFormatter={tickFormat ?? format} />
      <Tooltip
        cursor={{ stroke: CHART.grid, fill: 'rgba(148,163,184,0.12)' }}
        content={(p) => (
          <ChartTooltip active={p.active} payload={p.payload as readonly TooltipEntry[]} label={p.label} format={format} labelFormat={labelFormat} showTotal={showTotal ?? stacked} />
        )}
      />
    </>
  )
  return (
    <ResponsiveContainer width="100%" height="100%">
      {kind === 'line' ? (
        <LineChart data={data} margin={margin} accessibilityLayer>
          {common}
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={data.length <= 14} activeDot={{ r: 4 }} isAnimationActive={false} />
          ))}
        </LineChart>
      ) : kind === 'area' ? (
        <AreaChart data={data} margin={margin} accessibilityLayer>
          {common}
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} fill={s.color} fillOpacity={0.14} strokeWidth={2} stackId={stacked ? 'a' : undefined} isAnimationActive={false} />
          ))}
        </AreaChart>
      ) : (
        <BarChart data={data} margin={margin} accessibilityLayer barCategoryGap="22%">
          {common}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? 'a' : undefined} radius={stacked ? 0 : [3, 3, 0, 0]} maxBarSize={44} isAnimationActive={false} />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

export interface BarDatum {
  label: string
  value: number
  color?: string
}

/** Comparação entre categorias: barras horizontais com rótulo de valor. */
export function HorizontalBarChart({
  data,
  format,
  color = CHART.cash,
  valueLabel = 'Valor',
  labelWidth = 130,
}: {
  data: BarDatum[]
  format: (v: number) => string
  color?: string
  valueLabel?: string
  labelWidth?: number
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 0, left: 0 }} accessibilityLayer barCategoryGap="28%">
        <CartesianGrid horizontal={false} stroke={CHART.grid} />
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis type="category" dataKey="label" width={labelWidth} {...axisProps} axisLine={false} tick={{ fontSize: 12, fill: '#18212b' }} interval={0} />
        <Tooltip
          cursor={{ fill: 'rgba(148,163,184,0.12)' }}
          content={(p) => <ChartTooltip active={p.active} payload={p.payload as readonly TooltipEntry[]} label={p.label} format={format} />}
        />
        <Bar
          dataKey="value"
          name={valueLabel}
          radius={[0, 3, 3, 0]}
          maxBarSize={22}
          isAnimationActive={false}
          label={{ position: 'right', fontSize: 11, fill: '#18212b', formatter: (v: unknown) => format(Number(v)) }}
        >
          {data.map((d) => (
            <Cell key={d.label} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Composição por poucas categorias: uma barra empilhada 100% (alternativa à pizza). */
export function CompositionBar({ data, format }: { data: BarDatum[]; format: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex h-8 w-full overflow-hidden rounded-md" role="presentation">
        {data
          .filter((d) => d.value > 0)
          .map((d) => (
            <div
              key={d.label}
              title={`${d.label}: ${format(d.value)} (${((d.value / total) * 100).toFixed(0)}%)`}
              style={{ width: `${(d.value / total) * 100}%`, background: d.color ?? CHART.cash }}
              className="h-full border-r border-card last:border-r-0"
            />
          ))}
      </div>
      <ul className="grid gap-1.5 text-[13px] sm:grid-cols-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: d.color ?? CHART.cash }} />
              {d.label}
            </span>
            <span className="tabular text-muted-foreground">
              {format(d.value)} · {((d.value / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
