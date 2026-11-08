export function BarList({
  items,
  accent = false,
  formatValue,
  max,
}: {
  items: { label: string; value: number; hint?: string }[]
  accent?: boolean
  formatValue?: (v: number) => string
  max?: number
}) {
  const peak = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-list-row" key={item.label}>
          <div className="bar-list-meta">
            <span className="bar-list-label">{item.label}</span>
            {item.hint ? <span className="bar-list-hint">{item.hint}</span> : null}
          </div>
          <div className="bar-list-track">
            <div
              className={`bar-list-fill${accent ? ' is-accent' : ''}`}
              style={{ width: `${Math.max(4, (item.value / peak) * 100)}%` }}
            />
          </div>
          <div className="bar-list-value">
            {formatValue ? formatValue(item.value) : item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ColumnChart({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[]
  formatValue?: (v: number) => string
}) {
  const peak = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="col-chart" role="img" aria-label="Gráfico de colunas">
      {items.map((item) => (
        <div className="col-chart-item" key={item.label}>
          <div className="col-chart-value">
            {formatValue ? formatValue(item.value) : item.value}
          </div>
          <div className="col-chart-bar-wrap">
            <div
              className="col-chart-bar"
              style={{ height: `${Math.max(8, (item.value / peak) * 100)}%` }}
            />
          </div>
          <div className="col-chart-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({ values }: { values: number[] }) {
  const peak = Math.max(...values, 1)
  return (
    <div className="sparkline" aria-hidden="true">
      {values.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(12, (v / peak) * 100)}%` }} />
      ))}
    </div>
  )
}
