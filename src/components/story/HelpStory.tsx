import { useRef } from 'react'
import { useMotionAllowed, useScrollProgress } from '../../hooks/useMotion'
import { lerp, range, smooth } from '../../lib/motion'
import { whatsapp } from '../../lib/contact'

const PATHS = [
  {
    title: 'Fazer uma doação',
    text: 'Dinheiro, alimentos, roupas ou material escolar. Fale com a equipe para receber os dados da doação.',
    cta: 'Quero doar',
    message: 'Olá! Quero fazer uma doação para a A.S.A.',
  },
  {
    title: 'Ser voluntário',
    text: 'Reforço, música, dança, artesanato ou ajuda na organização. Algumas horas por semana já fazem diferença.',
    cta: 'Quero ser voluntário',
    message: 'Olá! Quero ser voluntário(a) na A.S.A.',
  },
  {
    title: 'Tornar-se parceiro',
    text: 'Empresas e comércios podem apoiar uma oficina, doar materiais ou abrir portas para os jovens.',
    cta: 'Quero ser parceiro',
    message: 'Olá! Quero conversar sobre uma parceria com a A.S.A.',
  },
]

/**
 * Os três caminhos ganham destaque em sequência conforme a rolagem; o título fica fixo
 * ao lado (em telas largas). O texto completo está sempre no DOM e legível.
 */
export default function HelpStory() {
  const list = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLElement | null)[]>([])
  const allowed = useMotionAllowed()

  useScrollProgress(
    list,
    allowed,
    (p) => {
      items.current.forEach((node, index) => {
        if (!node) return
        const start = index * 0.24
        const on = smooth(range(p, start, start + 0.34))
        node.style.opacity = lerp(0.4, 1, on).toFixed(3)
        node.style.transform = `translate3d(${((1 - on) * 12).toFixed(1)}px, 0, 0)`
      })
    },
    'view',
    () => {
      for (const node of items.current) {
        if (node) {
          node.style.opacity = ''
          node.style.transform = ''
        }
      }
    },
    0.12,
  )

  return (
    <section className="section help on-dark" id="ajudar" aria-labelledby="ajudar-title">
      <div className="container help-grid">
        <div className="help-intro">
          <p className="eyebrow">Como ajudar</p>
          <h2 id="ajudar-title">Cada ajuda chega às crianças.</h2>
          <p className="lead">
            Doação, tempo ou parceria: escolha o caminho que combina com você e fale direto com a equipe.
          </p>
        </div>
        <div className="help-paths" ref={list}>
          {PATHS.map((path, index) => (
            <article
              key={path.title}
              ref={(node) => {
                items.current[index] = node
              }}
            >
              <h3>{path.title}</h3>
              <p>{path.text}</p>
              <a href={whatsapp(path.message)} target="_blank" rel="noreferrer">
                {path.cta}
                <span className="visually-hidden"> — abre o WhatsApp</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
