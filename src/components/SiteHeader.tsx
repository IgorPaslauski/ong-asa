import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ORG } from '../data/org'

const SECTIONS = [
  { id: 'quem-somos', label: 'Quem somos' },
  { id: 'atividades', label: 'Atividades' },
  { id: 'impacto', label: 'Impacto' },
  { id: 'participar', label: 'Participar' },
]

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      if (window.scrollY < 120) setActive('')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const { id } of [...SECTIONS, { id: 'ajudar' }]) {
      const node = document.getElementById(id)
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const solid = scrolled || open

  return (
    <header className={`site-header${solid ? ' is-solid' : ' on-dark'}`}>
      <div className="container header-row">
        <a className="logo" href="#top" aria-label={`${ORG.shortName} — ${ORG.legalName}, início`}>
          <span className="logo-mark">{ORG.shortName}</span>
          <span className="logo-name">{ORG.legalName}</span>
        </a>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="menu-toggle-bars" aria-hidden="true" />
          <span className="visually-hidden">{open ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>

        <nav id="menu-principal" className={`main-nav${open ? ' is-open' : ''}`} aria-label="Principal">
          <ul>
            {SECTIONS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                className="nav-cta"
                href="#ajudar"
                aria-current={active === 'ajudar' ? 'true' : undefined}
                onClick={() => setOpen(false)}
              >
                Como ajudar
              </a>
            </li>
            <li className="nav-team">
              <Link to="/sistema" onClick={() => setOpen(false)}>
                Área da equipe
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
