import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarList, ColumnChart } from '../components/Charts'
import { ORG } from '../data/org'
import { formatCurrency, formatDate } from '../data/mock'
import { buildLandingPublicModel, type LandingPublicModel } from '../lib/publicStats'
import '../styles/landing.css'

function compactMoney(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return formatCurrency(value)
}

export default function Landing() {
  const [model, setModel] = useState<LandingPublicModel>(() => buildLandingPublicModel())

  useEffect(() => {
    const refresh = () => setModel(buildLandingPublicModel())
    window.addEventListener('asa:data-changed', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('asa:data-changed', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <img src="./images/hero.jpg" alt="" />
        </div>
        <div className="hero-glow" aria-hidden="true" />

        <div className="container site-nav">
          <div className="brand">
            <span className="brand-mark">{ORG.shortName}</span>
            <span className="brand-sub">{ORG.legalName}</span>
          </div>
          <nav className="nav-links" aria-label="Principal">
            <a href="#sobre">Sobre</a>
            <a href="#dados">Impacto</a>
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
              Quero fazer parte
            </a>
            <a className="btn btn-ghost" href="#dados">
              Ver impacto ao vivo
            </a>
          </div>
        </div>
      </header>

      <div className="live-ticker" aria-label="Números do sistema">
        <div className="container ticker-track">
          <span>
            <strong>{model.live.childrenTotal}</strong> crianças no cadastro
          </span>
          <span>
            <strong>{model.live.helpersActive}</strong> pessoas ativas na rede
          </span>
          <span>
            <strong>{compactMoney(model.live.donationsTotalValue)}</strong> em doações confirmadas
          </span>
          <span>
            <strong>{model.live.activitiesCount}</strong> ações registradas
          </span>
          <span className="ticker-tag">atualizado pelo sistema</span>
        </div>
      </div>

      <section className="section story-section" id="sobre">
        <div className="container story-layout">
          <div className="story-copy">
            <p className="section-kicker">Quem somos</p>
            <h2>
              {ORG.shortName}
              <span className="story-sub">{ORG.legalName}</span>
            </h2>
            <p className="section-lead">{ORG.about[0]}</p>
            <p className="section-lead">{ORG.about[1]}</p>
            <p className="section-lead soft">{ORG.cityContext}</p>

            <div className="mission-grid">
              <article className="mission-card">
                <h3>Missão</h3>
                <p>{ORG.mission}</p>
              </article>
              <article className="mission-card">
                <h3>Visão</h3>
                <p>{ORG.vision}</p>
              </article>
            </div>
          </div>

          <div className="story-visual">
            <div className="photo-stack">
              <img className="photo main" src="./images/about.jpg" alt="Oficinas e acolhimento na A.S.A." />
              <img className="photo secondary" src="./images/impact.jpg" alt="Comunidade em atividade" />
              <div className="photo-badge">
                <strong>Desde {ORG.founded}</strong>
                <span>semeando o amanhã em Condor</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="pillars visual-pillars">
            {ORG.pillars.map((p, i) => (
              <article className="pillar-card" key={p.title} style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="pillar-index">0{i + 1}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section data-strip" id="dados">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Impacto {model.yearLabel}</p>
              <h2>Números que nascem do cuidado diário.</h2>
            </div>
            <p className="section-lead">
              Doações, crianças, rede de apoio e ações vêm do mesmo sistema da equipe.
              Quando o painel muda, a vitrine pública acompanha.
            </p>
          </div>

          <div className="kpi-grid">
            {model.kpis.map((kpi) => (
              <article className={`kpi-card${kpi.source === 'system' ? ' is-live' : ''}`} key={kpi.key}>
                <div className="kpi-top">
                  <span className="kpi-label">{kpi.label}</span>
                  <span className={`source-pill ${kpi.source}`}>
                    {kpi.source === 'system' ? 'sistema' : 'contexto'}
                  </span>
                </div>
                <strong className="kpi-value">{kpi.display}</strong>
                <span className="kpi-foot">{kpi.foot}</span>
              </article>
            ))}
          </div>

          <div className="viz-grid">
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Doações mês a mês</h3>
                  <p>Série montada a partir das doações confirmadas no sistema.</p>
                </div>
                <span className="viz-tag">sistema</span>
              </header>
              {model.monthly.length ? (
                <ColumnChart
                  items={model.monthly.map((m) => ({ label: m.label, value: m.value }))}
                  formatValue={(v) => compactMoney(v).replace('R$ ', '')}
                />
              ) : (
                <p className="empty-soft">Cadastre doações no painel para ver este gráfico.</p>
              )}
            </article>

            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Por tipo de doação</h3>
                  <p>Financeiro, alimentos, material, roupas e serviços.</p>
                </div>
                <span className="viz-tag">sistema</span>
              </header>
              {model.byType.length ? (
                <BarList
                  items={model.byType.map((t) => ({
                    label: t.label,
                    value: t.value,
                    hint: t.hint,
                  }))}
                  formatValue={compactMoney}
                />
              ) : (
                <p className="empty-soft">Sem doações confirmadas ainda.</p>
              )}
            </article>

            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Para onde vai o recurso</h3>
                  <p>Destinações usadas nos lançamentos do sistema.</p>
                </div>
                <span className="viz-tag">sistema</span>
              </header>
              {model.byDestination.length ? (
                <BarList
                  accent
                  items={model.byDestination.map((d) => ({
                    label: d.label,
                    value: d.value,
                  }))}
                  formatValue={compactMoney}
                />
              ) : (
                <p className="empty-soft">Sem destinações para exibir.</p>
              )}
            </article>

            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Rede de apoio</h3>
                  <p>Papéis ativos no cadastro de quem ajuda.</p>
                </div>
                <span className="viz-tag">sistema</span>
              </header>
              {model.support.length ? (
                <BarList items={model.support.map((s) => ({ label: s.label, value: s.value }))} />
              ) : (
                <p className="empty-soft">Cadastre voluntários e doadores no painel.</p>
              )}
            </article>
          </div>
          <p className="source-note">{model.sourcesNote}</p>
        </div>
      </section>

      <section className="section gallery-section" id="acoes">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Ações recentes</p>
              <h2>O que a A.S.A. registrou por último.</h2>
            </div>
            <p className="section-lead">
              Lista puxada das atividades do sistema — oficinas, entregas e encontros.
            </p>
          </div>

          <div className="action-board visual-actions">
            {model.actions.map((action) => (
              <article className="action-card rich" key={action.id}>
                <div className="action-top">
                  <span className="action-type">{action.tipo}</span>
                  <time dateTime={action.data}>{formatDate(action.data)}</time>
                </div>
                <h3>{action.titulo}</h3>
                <p className="action-result">{action.participantes} participantes</p>
                <p className="action-detail">Registrado no painel da equipe · fonte sistema</p>
              </article>
            ))}
          </div>

          <div className="territory-band">
            <div>
              <p className="section-kicker">Território</p>
              <h3>Onde estão as crianças cadastradas</h3>
              <p>Distribuição pelos bairros informados no sistema.</p>
            </div>
            <div className="territory-chart">
              <BarList
                accent
                items={model.byArea.map((n) => ({
                  label: n.label,
                  value: n.value,
                  hint: n.hint,
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-section" id="ajudar">
        <div className="container cta-panel visual-cta">
          <div className="cta-copy">
            <p className="section-kicker">Participe</p>
            <h2>Uma semente hoje. Um amanhã inteiro.</h2>
            <p className="section-lead">
              Doe, voluntarie-se ou firme parceria. Cada gesto sustenta oficinas,
              inclusão digital e o acolhimento de famílias em Condor.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={`tel:+5555991349705`}>
                Falar com a A.S.A.
              </a>
              <Link className="btn btn-ghost-dark" to="/sistema">
                Ver painel demo
              </Link>
            </div>
          </div>
          <div className="cta-photo" aria-hidden="true">
            <img src="./images/impact.jpg" alt="" />
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
              <p>LP e painel compartilham o mesmo modelo de dados.</p>
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
