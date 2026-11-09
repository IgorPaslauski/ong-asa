import { useRef } from 'react'
import { useScrollProgress } from '../../hooks/useMotion'
import { range, sample, smooth } from '../../lib/motion'
import { PUBLIC_NOTES } from '../../data/org'

/**
 * Fotos reais da associação (uma por cena). Para trocar, edite `photo`, `alt` e, se precisar, `position`.
 */
const SCENES = [
  {
    kicker: 'Educação e inclusão digital',
    title: 'Aprender',
    photo: './images/galeria/inclusao.webp',
    alt: 'Menina sorrindo em uma cadeira de rodas, com pintura no rosto',
    position: '50% 55%',
    items: [
      {
        name: 'Reforço escolar',
        text: 'Apoio nas tarefas e no aprendizado para crianças e adolescentes da rede pública de Condor.',
      },
      {
        name: 'Inclusão digital',
        text: 'Informática, aplicativos escolares, design e cidadania online. Turmas semanais para crianças de 6 a 14 anos.',
      },
    ],
  },
  {
    kicker: 'Cultura e expressão',
    title: 'Criar',
    photo: './images/galeria/bandinha.webp',
    alt: 'Grupo de jovens e um violonista posando no palco após uma apresentação',
    position: '42% 50%',
    items: [
      {
        name: 'Música',
        text: 'Aulas de violão, com apoio de parceiros locais, para quem nunca teve contato com um instrumento.',
      },
      {
        name: 'Dança e artesanato',
        text: 'Oficinas recreativas com voluntários: dança coreográfica e trabalhos manuais para se expressar.',
      },
    ],
  },
  {
    kicker: 'Trabalho e acolhimento',
    title: 'Crescer',
    photo: './images/camiseta-equipe.webp',
    alt: 'Costas de uma voluntária com a camiseta azul “Transformando vidas e construindo futuros”',
    position: '50% 62%',
    items: [
      {
        name: 'Jovens Empreendedores',
        text: 'Para adolescentes: criatividade, autoconhecimento e os primeiros passos rumo ao trabalho e à geração de renda.',
      },
      {
        name: 'Apoio às famílias',
        text: 'Alimentação, vestuário e acompanhamento social para as famílias atendidas.',
      },
    ],
  },
]

/**
 * Keyframes por foto: [progresso, x%, y%, escala, opacidade, rotação°].
 * Entradas curtas e sobrepostas; a foto anterior fica sempre visível por baixo da próxima.
 * Os marcos (0,25 / 0,5 / 0,75) coincidem com a troca dos textos.
 */
const LAYER_KEYS: number[][][] = [
  [
    [0, 0, 0, 1, 1, 0],
    [0.18, 0, 0, 1, 1, 0],
    [0.3, -5, -2, 0.95, 1, -0.6],
    [0.5, -10, -5, 0.9, 1, -1],
    [0.7, -14, -8, 0.86, 1, -1.5],
    [0.9, -22, -17, 0.66, 1, -2.2],
    [1, -22, -17, 0.66, 1, -2.2],
  ],
  [
    [0, 16, 28, 0.96, 0, 0],
    [0.16, 16, 28, 0.96, 0, 0],
    [0.26, 12, 16, 0.97, 0.6, 0],
    [0.36, 6, 3, 1, 1, 0],
    [0.5, 6, 3, 1, 1, 0],
    [0.62, 8, 0, 0.94, 1, 0.8],
    [0.82, 22, -6, 0.68, 1, 1.8],
    [1, 22, -6, 0.68, 1, 1.8],
  ],
  [
    [0, 18, 34, 0.96, 0, 0],
    [0.41, 18, 34, 0.96, 0, 0],
    [0.5, 14, 20, 0.97, 0.6, 0],
    [0.6, 0, 0, 1, 1, 0],
    [0.72, 0, 0, 1, 1, 0],
    [0.88, -3, 26, 0.68, 1, -0.8],
    [1, -3, 26, 0.68, 1, -0.8],
  ],
]

const TEXT_STATES = SCENES.length + 1

export default function ActivitiesStory({ enhanced }: { enhanced: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const layers = useRef<(HTMLElement | null)[]>([])
  const texts = useRef<(HTMLElement | null)[]>([])
  const bar = useRef<HTMLSpanElement>(null)

  useScrollProgress(
    track,
    enhanced,
    (p) => {
      layers.current.forEach((layer, index) => {
        if (!layer) return
        const [x, y, scale, opacity, rotate] = sample(LAYER_KEYS[index], p)
        layer.style.transform = `translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, 0) scale(${scale.toFixed(4)}) rotate(${rotate.toFixed(2)}deg)`
        layer.style.opacity = opacity.toFixed(3)
      })

      // textos em fade cruzado sincronizado com as fotos (janela de ±0,05 em torno de cada marco)
      const width = 1 / TEXT_STATES
      texts.current.forEach((node, index) => {
        if (!node) return
        const enter = index === 0 ? 1 : smooth(range(range(p, index * width - 0.05, index * width + 0.05), 0.4, 1))
        const leave =
          index === TEXT_STATES - 1
            ? 0
            : smooth(range(range(p, (index + 1) * width - 0.05, (index + 1) * width + 0.05), 0, 0.6))
        const opacity = enter * (1 - leave)
        node.style.opacity = opacity.toFixed(3)
        node.style.transform = `translate3d(0, ${((1 - enter) * 16 - leave * 16).toFixed(1)}px, 0)`
        node.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible'
      })

      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`
    },
    'track',
    () => {
      for (const node of [...layers.current, ...texts.current, bar.current]) {
        if (node) {
          node.style.transform = ''
          node.style.opacity = ''
          node.style.visibility = ''
        }
      }
    },
    0.18,
  )

  return (
    <section className="story-activities" id="atividades" aria-labelledby="atividades-title">
      <div ref={track} className={`activities-track${enhanced ? ' is-enhanced' : ''}`}>
        <div className="activities-sticky">
          <div className="container activities-stage">
            <div className="stage-photos">
              {SCENES.map((scene, index) => (
                <figure
                  key={scene.title}
                  className="layer"
                  ref={(node) => {
                    layers.current[index] = node
                  }}
                >
                  <img
                    src={scene.photo}
                    alt={scene.alt}
                    style={'position' in scene ? { objectPosition: scene.position } : undefined}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>

            <div className="stage-copy">
              <p className="eyebrow">Nossas atividades</p>
              <h2 id="atividades-title">O que as crianças fazem por aqui.</h2>

              <div className="scenes">
                {SCENES.map((scene, index) => (
                  <article
                    key={scene.title}
                    className="scene"
                    ref={(node) => {
                      texts.current[index] = node
                    }}
                  >
                    <p className="scene-kicker">{scene.kicker}</p>
                    <h3>{scene.title}</h3>
                    <ul>
                      {scene.items.map((item) => (
                        <li key={item.name}>
                          <strong>{item.name}</strong>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
                <article
                  className="scene scene-summary"
                  ref={(node) => {
                    texts.current[SCENES.length] = node
                  }}
                >
                  <p className="scene-kicker">Para todas as famílias</p>
                  <h3>Tudo isso, de graça.</h3>
                  <p className="scene-note">
                    Oficinas gratuitas, abertas a crianças e adolescentes de {PUBLIC_NOTES.ageRange}.
                  </p>
                </article>
              </div>

              <div className="stage-progress" aria-hidden="true">
                <span ref={bar} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
