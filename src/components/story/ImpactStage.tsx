import { useRef } from 'react'
import { useScrollProgress } from '../../hooks/useMotion'
import { lerp, range, smooth, smoother } from '../../lib/motion'

export interface ImpactMetric {
  label: string
  value: string
  unit: string
  note: string
}

/**
 * Indicadores que se organizam: o principal aparece centralizado e, conforme o scroll,
 * vai para o lugar definitivo enquanto os demais surgem um a um. Os dados vêm do sistema
 * (nenhum número é criado aqui) e cada um explica o que mede.
 */
export default function ImpactStage({
  enhanced,
  lead,
  items,
}: {
  enhanced: boolean
  lead: { prefix: string; value: string; title: string; note: string }
  items: ImpactMetric[]
}) {
  const track = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const leadRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useScrollProgress(
    track,
    enhanced,
    (p) => {
      const move = smoother(range(p, 0.1, 0.44))
      if (leadRef.current && grid.current) {
        const shift = (grid.current.clientWidth - leadRef.current.clientWidth) / 2
        const scale = lerp(1.08, 1, move)
        leadRef.current.style.transform = `translate3d(${(shift * (1 - move)).toFixed(1)}px, 0, 0) scale(${scale.toFixed(4)})`
      }
      itemRefs.current.forEach((node, index) => {
        if (!node) return
        // entradas longas e sobrepostas: cada indicador começa antes de o anterior terminar
        const start = 0.26 + index * 0.12
        const shown = smooth(range(p, start, start + 0.24))
        node.style.opacity = shown.toFixed(3)
        node.style.transform = `translate3d(0, ${((1 - shown) * 22).toFixed(1)}px, 0)`
      })
    },
    'track',
    () => {
      for (const node of [leadRef.current, ...itemRefs.current]) {
        if (node) {
          node.style.transform = ''
          node.style.opacity = ''
        }
      }
    },
    0.15,
  )

  return (
    <div ref={track} className={`impact-track${enhanced ? ' is-enhanced' : ''}`}>
      <div className="impact-sticky">
        <div className="container">
          <div className="impact-composition" ref={grid}>
            <div className="metric-lead" ref={leadRef}>
              <p className="big-prefix">{lead.prefix}</p>
              <p className="big-number">{lead.value}</p>
              <h3>{lead.title}</h3>
              <p>{lead.note}</p>
            </div>
            <dl className="metric-list">
              {items.map((item, index) => (
                <div
                  key={item.label}
                  className="metric"
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                >
                  <dt>{item.label}</dt>
                  <dd>
                    <strong>{item.value}</strong> {item.unit}
                  </dd>
                  <p>{item.note}</p>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
