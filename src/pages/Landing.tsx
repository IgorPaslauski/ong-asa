import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarList, ColumnChart } from '../components/Charts'
import { ACTIONS_TIMELINE, CHILDREN_BY_NEIGHBORHOOD } from '../data/impact'
import { ORG, PUBLIC_NOTES } from '../data/org'
import { formatCurrency, formatDate } from '../data/mock'
import { buildLandingPublicModel } from '../lib/publicStats'
import '../styles/landing.css'

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function compactMoney(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return formatCurrency(value)
}

export default function Landing() {
  const [year, setYear] = useState<'all' | string>('all')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener('asa:data-changed', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('asa:data-changed', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const model = useMemo(() => buildLandingPublicModel(year), [year, revision])

  const actionCards =
    model.actions.length > 0
      ? model.actions.map((action) => ({
          key: action.id,
          date: action.data,
          type: action.tipo,
          title: action.titulo,
          result: `${action.participantes} participantes`,
          detail: 'Registrado no sistema da associação.',
        }))
      : ACTIONS_TIMELINE.map((action) => ({
          key: `${action.date}-${action.title}`,
          date: action.date,
          type: action.type,
          title: action.title,
          result: action.result,
          detail: action.detail,
        }))

  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <img src="./images/hero.jpg" alt="" />
        </div>

        <div className="container site-nav">
          <div className="brand">
            <span className="brand-mark">{ORG.shortName}</span>
            <span className="brand-sub">{ORG.legalName}</span>
          </div>
          <nav className="nav-links" aria-label="Principal">
            <a href="#sobre">Sobre</a>
            <a href="#dados">Dados</a>
            <a href="#acoes">Ações</a>
            <Link className="btn btn-ghost btn-sm" to="/sistema">
              Acessar sistema
            </Link>
          </nav>
        </div>

        <div className="hero-content">
          <p className="hero-kicker anim-in">Instituto A.S.A. · Condor/RS</p>
          <h1 className="hero-brand anim-in">{ORG.shortName}</h1>
          <p className="hero-copy anim-in-delay">{ORG.tagline}</p>
          <div className="hero-actions anim-in-delay-2">
            <a className="btn btn-primary" href="#ajudar">
              Quero ajudar
            </a>
            <a className="btn btn-ghost" href="#sobre">
              Conhecer a associação
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="sobre">
        <div className="container split">
          <Reveal>
          <div>
            <p className="section-kicker">Quem somos</p>
            <h2>{ORG.name} — {ORG.legalName}</h2>
            <p className="section-lead">{ORG.about[0]}</p>
            <p className="section-lead" style={{ marginTop: '0.85rem' }}>
              {ORG.about[1]}
            </p>
            <p className="section-lead" style={{ marginTop: '0.85rem' }}>
              {ORG.cityContext}
            </p>
            <dl className="org-facts">
              <div>
                <dt>Fundação</dt>
                <dd>{ORG.foundedLabel}</dd>
              </div>
              <div>
                <dt>CNPJ</dt>
                <dd>{ORG.cnpj}</dd>
              </div>
              <div>
                <dt>Atendimento</dt>
                <dd>
                  {PUBLIC_NOTES.weeklyChildren} crianças/adolescentes por semana · {PUBLIC_NOTES.ageRange}
                </dd>
              </div>
            </dl>
          </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="split-media">
              <img src="./images/about.jpg" alt="Crianças e educadores em atividade" />
            </div>
          </Reveal>
        </div>

        <div className="container" style={{ marginTop: '2.5rem' }}>
          <Reveal>
          <div className="mission-grid">
            <article className="mission-card">
              <h3>Missão</h3>
              <p>{ORG.mission}</p>
            </article>
            <article className="mission-card">
              <h3>Visão</h3>
              <p>{ORG.vision}</p>
            </article>
            <article className="mission-card">
              <h3>Princípio</h3>
              <p>{ORG.principle}</p>
            </article>
          </div>
          </Reveal>

          <div className="pillars" style={{ marginTop: '1.5rem' }}>
            {ORG.pillars.map((p, index) => (
              <Reveal key={p.title} delay={index * 70}>
                <article className="pillar">
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section data-strip" id="dados">
        <div className="container">
          <Reveal>
          <div className="section-head">
            <div>
              <p className="section-kicker">Transparência {model.yearLabel}</p>
              <h2>O impacto da A.S.A. em números.</h2>
            </div>
            <p className="section-lead">
              Estes números saem dos cadastros e das doações do sistema. Quando a equipe atualiza o painel, a página acompanha.
            </p>
          </div>
          </Reveal>

          <div className="year-switch" role="tablist" aria-label="Ano">
            <button type="button" className={year === 'all' ? 'is-on' : ''} onClick={() => setYear('all')}>
              Todos os anos
            </button>
            {model.years.map((item) => (
              <button
                key={item}
                type="button"
                className={year === item ? 'is-on' : ''}
                onClick={() => setYear(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <Reveal>
            <article className="viz-card evolution-card">
              <header className="viz-head">
                <div>
                  <h3>Evolução por ano</h3>
                  <p>Doações confirmadas de {model.years[0]} a {model.years.at(-1)}.</p>
                </div>
              </header>
              <ColumnChart
                items={model.evolution.map((point) => ({ label: point.year, value: point.donations }))}
                formatValue={(value) => compactMoney(value).replace('R$ ', '')}
              />
              <div className="year-legend">
                {model.evolution.map((point) => (
                  <span key={point.year}>
                    <strong>{point.year}</strong>
                    {point.children} entradas · {point.actions} ações
                  </span>
                ))}
              </div>
            </article>
          </Reveal>

          <div className="kpi-grid">
            {model.kpis.map((kpi, index) => (
              <Reveal key={kpi.key} delay={index * 80}>
                <article className="kpi-card">
                  <span className="kpi-label">{kpi.label}</span>
                  <strong className="kpi-value">{kpi.display}</strong>
                  <span className="kpi-foot">{kpi.foot}</span>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="viz-grid">
            <Reveal>
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>{year === 'all' ? 'Últimos meses' : `Meses de ${year}`}</h3>
                  <p>
                    {year === 'all'
                      ? 'Os seis meses mais recentes, somando todos os anos.'
                      : `Doações confirmadas dentro de ${year}.`}
                  </p>
                </div>
              </header>
              {model.monthly.length ? (
                <ColumnChart
                  items={model.monthly.map((m) => ({ label: m.label, value: m.value }))}
                  formatValue={(v) => compactMoney(v).replace('R$ ', '')}
                />
              ) : (
                <p className="section-lead">Sem doações confirmadas.</p>
              )}
            </article>
            </Reveal>

            <Reveal delay={90}>
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Por tipo de doação</h3>
                  <p>Financeiro, alimentos, material, roupas e serviços.</p>
                </div>
              </header>
              <BarList
                items={model.byType.map((t) => ({
                  label: t.label,
                  value: t.value,
                  hint: t.hint,
                }))}
                formatValue={compactMoney}
              />
            </article>
            </Reveal>

            <Reveal delay={40}>
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Para onde vai o recurso</h3>
                  <p>Destinações registradas pela equipe.</p>
                </div>
              </header>
              <BarList
                accent
                items={model.byDestination.map((d) => ({
                  label: d.label,
                  value: d.value,
                }))}
                formatValue={compactMoney}
              />
            </article>
            </Reveal>

            <Reveal delay={120}>
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Rede que sustenta a A.S.A.</h3>
                  <p>Pessoas ativas no cadastro de quem ajuda.</p>
                </div>
              </header>
              <BarList items={model.support.map((s) => ({ label: s.label, value: s.value }))} />
            </article>
            </Reveal>
          </div>
          <p className="source-note">{model.sourcesNote}</p>
        </div>
      </section>

      <section className="section" id="acoes">
        <div className="container">
          <Reveal>
          <div className="section-head">
            <div>
              <p className="section-kicker">O que fazemos</p>
              <h2>Oficinas e ações que semeiam o amanhã.</h2>
            </div>
            <p className="section-lead">
              Inclusão digital, reforço, música, dança, artesanato, assistência às famílias
              e o Projeto Jovens Empreendedores — tudo com voluntários e parceiros.
            </p>
          </div>
          </Reveal>

          <div className="action-board">
            {actionCards.map((action, index) => (
              <Reveal key={action.key} delay={(index % 3) * 80}>
                <article className="action-card">
                  <div className="action-top">
                    <span className="action-type">{action.type}</span>
                    <time dateTime={action.date}>{formatDate(action.date)}</time>
                  </div>
                  <h3>{action.title}</h3>
                  <p className="action-result">{action.result}</p>
                  <p className="action-detail">{action.detail}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="viz-card map-card">
            <header className="viz-head">
              <div>
                <h3>Atendimento no município</h3>
                <p>A A.S.A. recebe crianças de todo Condor — centro, Olaria e interior.</p>
              </div>
            </header>
            <BarList
              accent
              items={(model.byArea.length ? model.byArea : CHILDREN_BY_NEIGHBORHOOD.map((n) => ({
                label: n.label,
                value: n.value,
                hint: 'crianças',
                source: 'editorial' as const,
              }))).map((n) => ({
                label: n.label,
                value: n.value,
                hint: n.hint,
              }))}
            />
          </div>
        </div>
      </section>

      <section className="section cta-section" id="ajudar">
        <div className="container cta-panel">
          <div>
            <p className="section-kicker">Participe</p>
            <h2>Doe, seja voluntário ou parceiro da A.S.A.</h2>
            <p className="section-lead">
              A associação se mantém com doadores recorrentes, parcerias e voluntariado.
              Cada contribuição ajuda a sustentar oficinas e o acolhimento em Condor.
            </p>
          </div>
          <div className="hero-actions">
            <a className="btn btn-primary" href={`tel:+5555991349705`}>
              Ligar para a A.S.A.
            </a>
            <Link className="btn btn-ghost-dark" to="/sistema">
              Abrir painel demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">{ORG.shortName}</div>
              <p>{ORG.name}</p>
              <p>{ORG.legalName}</p>
              <p style={{ marginTop: '0.75rem' }}>{ORG.tagline}</p>
              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                CNPJ {ORG.cnpj}
              </p>
            </div>
            <div>
              <h4>Contato</h4>
              <p>{ORG.phone}</p>
              <p>{ORG.phoneAlt}</p>
              <p>
                {ORG.address}
                <br />
                {ORG.city}/{ORG.state} · CEP {ORG.cep}
              </p>
            </div>
            <div>
              <h4>Sistema</h4>
              <p>
                <Link to="/sistema">Painel administrativo</Link>
              </p>
              <p>MVP com dados mockados para apresentação à associação.</p>
            </div>
          </div>
          <div className="footer-note">
            <span>
              © {new Date().getFullYear()} {ORG.legalName} — Instituto A.S.A.
            </span>
            <span>Condor · Rio Grande do Sul</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
