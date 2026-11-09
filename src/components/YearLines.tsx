import { useId } from 'react'
import { formatCurrency } from '../data/mock'
import type { YearSeries } from '../lib/accountsSeries'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
/** O ano mais recente usa a cor forte; os anteriores ficam em tons distintos e mais finos. */
const COLORS = ['#0B3A94', '#2A98A9', '#D99626', '#7A8BA8', '#C04D4D']

const W = 720
const H = 320
const PAD = { l: 64, r: 16, t: 16, b: 36 }

function niceMax(v: number) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}
const compact = (v: number) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${v}`)

/** Uma linha por ano, meses no eixo X. Inclui legenda, resumo para leitores de tela e tabela alternativa. */
export default function YearLines({ series, field, label }: { series: YearSeries[]; field: 'monthly' | 'cumulative'; label: string }) {
  const id = useId()
  const values = series.flatMap((s) => s[field]).filter((v): v is number => v != null)
  const max = niceMax(Math.max(0, ...values))
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / 11
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  const ordered = [...series].reverse() // mais recente primeiro: cor 0
  const colorOf = (year: string) => COLORS[ordered.findIndex((s) => s.year === year) % COLORS.length]

  const summary = series
    .map((s) => {
      const last = [...s[field]].reverse().find((v) => v != null) ?? 0
      return `${s.year}: ${formatCurrency(field === 'cumulative' ? last : s.monthly.reduce<number>((a, v) => a + (v ?? 0), 0))} no total`
    })
    .join('; ')

  return (
    <figure className="year-lines">
      <ul className="year-legend" aria-label="Legenda dos anos">
        {ordered.map((s) => (
          <li key={s.year}>
            <span className="year-swatch" style={{ background: colorOf(s.year) }} aria-hidden="true" />
            {s.year}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} className="year-svg">
        <title id={`${id}-t`}>{`${label} por mês, comparando os anos. ${summary}.`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.14} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity={0.75}>
              {compact(t)}
            </text>
          </g>
        ))}
        {MONTHS.map((m, i) => (
          <text key={m} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity={0.75}>
            {m}
          </text>
        ))}
        {[...ordered].reverse().map((s) => {
          const color = colorOf(s.year)
          const first = s.year === ordered[0].year
          const pts = s[field].map((v, i) => (v == null ? null : ([x(i), y(v)] as const)))
          const d = pts.map((p, i) => (p ? `${i === 0 || !pts[i - 1] ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}` : '')).join(' ')
          const end = [...pts].reverse().find(Boolean)
          return (
            <g key={s.year}>
              <path d={d} fill="none" stroke={color} strokeWidth={first ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
              {end ? <circle cx={end[0]} cy={end[1]} r={first ? 4.5 : 3.5} fill={color} /> : null}
            </g>
          )
        })}
      </svg>
      <details className="year-table">
        <summary>Ver dados em tabela</summary>
        <div className="year-table-scroll">
          <table>
            <caption>{label} por mês</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                {ordered.map((s) => (
                  <th scope="col" key={s.year}>
                    {s.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((m, i) => (
                <tr key={m}>
                  <th scope="row">{m}</th>
                  {ordered.map((s) => (
                    <td key={s.year}>{s[field][i] == null ? '—' : formatCurrency(s[field][i] as number)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
