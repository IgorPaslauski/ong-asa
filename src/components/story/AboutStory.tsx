import { useMemo, useRef } from 'react'
import { useMotionAllowed, useScrollProgress } from '../../hooks/useMotion'
import { lerp, range, smooth } from '../../lib/motion'
import { ORG, PUBLIC_NOTES } from '../../data/org'

/** Agrupa o texto em trechos de leitura (até a pontuação, de 4 a 9 palavras). */
function chunk(text: string): string[] {
  const words = text.split(' ')
  const out: string[] = []
  let current: string[] = []
  words.forEach((word, index) => {
    current.push(word)
    const boundary = /[,.;:]$/.test(word) || word === '—' || word === '–'
    if ((boundary && current.length >= 4) || current.length >= 9 || index === words.length - 1) {
      out.push(current.join(' '))
      current = []
    }
  })
  return out
}

/**
 * Texto que ganha opacidade por trechos (frases curtas) conforme a rolagem.
 * Nunca fica quase invisível (mínimo de 30% de opacidade) e termina de revelar antes de o
 * parágrafo sair da leitura. O texto completo está sempre no DOM; com movimento reduzido,
 * tudo fica visível.
 */
function ScrubText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const allowed = useMotionAllowed()
  const parts = useMemo(() => chunk(text), [text])

  useScrollProgress(
    ref,
    allowed,
    (p) => {
      const spans = ref.current?.querySelectorAll<HTMLElement>('.w')
      spans?.forEach((span, index) => {
        const start = (index / parts.length) * 0.6
        span.style.opacity = lerp(0.3, 1, smooth(range(p, start, start + 0.4))).toFixed(3)
      })
    },
    'read',
    () => {
      ref.current?.querySelectorAll<HTMLElement>('.w').forEach((span) => {
        span.style.opacity = ''
      })
    },
    0.1,
  )

  return (
    <p ref={ref} className={className}>
      {parts.map((part, index) => (
        <span className="w" key={index}>
          {part}
          {index < parts.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  )
}

export default function AboutStory() {
  const section = useRef<HTMLDivElement>(null)
  const photo = useRef<HTMLImageElement>(null)
  const allowed = useMotionAllowed()

  useScrollProgress(
    section,
    allowed,
    (p) => {
      if (photo.current) {
        const t = smooth(range(p, 0, 1))
        photo.current.style.transform = `translate3d(0, ${lerp(14, -14, t).toFixed(1)}px, 0) scale(${lerp(1.06, 1, t).toFixed(4)})`
      }
    },
    'view',
    () => {
      if (photo.current) photo.current.style.transform = ''
    },
    0.12,
  )

  return (
    <section className="story-about" id="quem-somos" aria-labelledby="quem-title">
      <div className="container story-about-grid" ref={section}>
        <figure className="story-about-photo">
          <div className="photo-crop">
            <img
              ref={photo}
              src="./images/about.webp"
              alt="Grupo de crianças sorrindo para a câmera"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption>{ORG.principle}</figcaption>
        </figure>

        <div className="story-about-text">
          <p className="eyebrow">Quem somos</p>
          <h2 id="quem-title">Mais que atividades, uma rede de apoio para crescer.</h2>
          <ScrubText text={ORG.about[0]} className="story-lead" />
          <ScrubText text={ORG.about[1]} className="story-body" />
          <dl className="facts">
            <div>
              <dt>Por que existimos</dt>
              <dd>{ORG.mission}</dd>
            </div>
            <div>
              <dt>Quem ajudamos</dt>
              <dd>
                Crianças e adolescentes de {PUBLIC_NOTES.ageRange} e suas famílias, em situação de
                vulnerabilidade social e econômica.
              </dd>
            </div>
            <div>
              <dt>Onde atuamos</dt>
              <dd>Em {ORG.city}, no noroeste gaúcho, a “Terra da Boa Semente”. Sede no bairro Olaria.</dd>
            </div>
            <div>
              <dt>Desde quando</dt>
              <dd>{ORG.foundedLabel}. Sem fins lucrativos e sem vínculo político-partidário.</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
