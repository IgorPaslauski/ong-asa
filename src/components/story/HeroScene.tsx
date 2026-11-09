import { useRef } from 'react'
import { useScrollProgress } from '../../hooks/useMotion'
import { lerp, range, smooth, smoother } from '../../lib/motion'
import { ORG, PUBLIC_NOTES } from '../../data/org'

const stagger = (index: number) => ({ ['--i' as string]: index })

/**
 * Hero cinematográfico. Em telas largas, o banner fica fixo (sticky) enquanto o scroll:
 *  1. dissolve o texto principal;
 *  2. recorta a fotografia para a metade direita (onde estão os rostos);
 *  3. revela o fundo claro e a frase de abertura.
 * Em telas estreitas ou com movimento reduzido, é um banner estático e a frase de abertura vem logo abaixo.
 */
export default function HeroScene({ enhanced }: { enhanced: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const photo = useRef<HTMLImageElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const cue = useRef<HTMLAnchorElement>(null)
  const lede = useRef<HTMLDivElement>(null)

  useScrollProgress(
    track,
    enhanced,
    (p) => {
      // um único movimento contínuo e longo (smoother), com pouca variação de escala
      const e = smoother(range(p, 0.02, 0.92))
      if (frame.current) {
        frame.current.style.clipPath = `inset(${lerp(0, 12, e).toFixed(2)}vh ${lerp(0, 4.5, e).toFixed(2)}vw ${lerp(0, 12, e).toFixed(2)}vh ${lerp(0, 48, e).toFixed(2)}vw round ${lerp(0, 12, e).toFixed(1)}px)`
      }
      if (photo.current) photo.current.style.transform = `scale(${lerp(1, 1.06, e).toFixed(4)})`
      if (shade.current) shade.current.style.opacity = String(1 - smooth(range(p, 0, 0.55)))

      // o texto sai enquanto a frase de abertura já começa a entrar (breve sobreposição)
      const out = smooth(range(p, 0, 0.36))
      if (copy.current) {
        copy.current.style.opacity = String(1 - out)
        copy.current.style.transform = `translate3d(0, ${(-out * 32).toFixed(1)}px, 0)`
        copy.current.style.visibility = out >= 1 ? 'hidden' : 'visible'
      }
      if (cue.current) cue.current.style.opacity = String(1 - range(p, 0, 0.1))

      const into = smooth(range(p, 0.4, 0.82))
      if (lede.current) {
        lede.current.style.opacity = String(into)
        lede.current.style.transform = `translate3d(0, ${((1 - into) * 28).toFixed(1)}px, 0)`
        lede.current.style.visibility = into <= 0 ? 'hidden' : 'visible'
      }
    },
    'track',
    () => {
      for (const node of [frame, photo, shade, copy, cue, lede]) {
        const el = node.current
        if (el) {
          el.style.clipPath = ''
          el.style.transform = ''
          el.style.opacity = ''
          el.style.visibility = ''
        }
      }
    },
    0.14,
  )

  return (
    <>
      <div ref={track} className={`hero-track${enhanced ? ' is-enhanced' : ''}`}>
        <section className="hero on-dark" aria-labelledby="hero-title">
          <div className="hero-frame" ref={frame}>
            <img
              ref={photo}
              className="hero-photo"
              src="./images/hero-grupo.webp"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
            <div className="hero-shade" ref={shade} />
          </div>

          <div className="container hero-copy" ref={copy}>
            <p className="eyebrow hero-in" style={stagger(0)}>
              {ORG.name} · {ORG.city}/{ORG.state}
            </p>
            <h1 id="hero-title" className="hero-in" style={stagger(1)}>
              Um lugar para aprender, crescer e sonhar.
            </h1>
            <p className="hero-lead hero-in" style={stagger(2)}>
              A {ORG.legalName} oferece atividades gratuitas, acolhimento e novas oportunidades para
              crianças e adolescentes de {ORG.city}.
            </p>
            <div className="hero-actions hero-in" style={stagger(3)}>
              <a className="btn btn-primary" href="#atividades">
                Conhecer nossas atividades
              </a>
              <a className="btn btn-outline-light" href="#ajudar">
                Como ajudar
              </a>
            </div>
          </div>

          <a ref={cue} className="scroll-cue hero-in" style={stagger(4)} href="#quem-somos">
            <span className="visually-hidden">Continuar lendo</span>
          </a>

          {enhanced ? (
            <div className="hero-lede" ref={lede}>
              <div className="container">
                <div className="hero-lede-inner">
                  <p>
                    Reforço escolar, informática, música, dança e artesanato, de graça, para crianças e
                    adolescentes de {PUBLIC_NOTES.ageRange} — e apoio às famílias de {ORG.city}.
                  </p>
                  <a className="text-link" href="#quem-somos">
                    Conheça a associação
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {!enhanced ? (
        <section className="lede" id="abertura" aria-label="Resumo">
          <div className="lede-panel">
            <p>
              Reforço escolar, informática, música, dança e artesanato, de graça, para crianças e
              adolescentes de {PUBLIC_NOTES.ageRange} — e apoio às famílias de {ORG.city}.
            </p>
            <a className="text-link" href="#quem-somos">
              Conheça a associação
            </a>
          </div>
        </section>
      ) : null}
    </>
  )
}
