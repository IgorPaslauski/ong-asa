import { Link } from 'react-router-dom'
import { BarList, ColumnChart } from '../components/Charts'
import {
  ACTIONS_TIMELINE,
  CHILDREN_BY_NEIGHBORHOOD,
  DONATIONS_BY_DESTINATION,
  DONATIONS_BY_TYPE,
  MONTHLY_DONATIONS,
  PUBLIC_IMPACT,
  SUPPORT_NETWORK,
} from '../data/impact'
import { ORG, formatCurrency, formatDate } from '../data/mock'
import '../styles/landing.css'

function compactMoney(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return formatCurrency(value)
}

export default function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <img src="./images/hero.jpg" alt="" />
        </div>

        <div className="container site-nav">
          <div className="brand">
            <span className="brand-mark">ASA</span>
            <span className="brand-sub">{ORG.fullName}</span>
          </div>
          <nav className="nav-links" aria-label="Principal">
            <a href="#dados">Dados</a>
            <a href="#acoes">Ações</a>
            <a href="#sobre">Sobre</a>
            <Link className="btn btn-ghost btn-sm" to="/sistema">
              Acessar sistema
            </Link>
          </nav>
        </div>

        <div className="hero-content">
          <h1 className="hero-brand anim-in">ASA</h1>
          <p className="hero-copy anim-in-delay">{ORG.tagline}</p>
          <div className="hero-actions anim-in-delay-2">
            <a className="btn btn-primary" href="#ajudar">
              Quero ajudar
            </a>
            <a className="btn btn-ghost" href="#dados">
              Ver impacto em números
            </a>
          </div>
        </div>
      </header>

      <section className="section data-strip" id="dados">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Transparência {PUBLIC_IMPACT.yearLabel}</p>
              <h2>O impacto da ASA em números.</h2>
            </div>
            <p className="section-lead">
              Doações, acolhimento e ações em um só lugar — no espírito de gráficos
              claros e leitura rápida, para qualquer pessoa acompanhar.
            </p>
          </div>

          <div className="kpi-grid">
            <article className="kpi-card">
              <span className="kpi-label">Doações no ano</span>
              <strong className="kpi-value">{compactMoney(PUBLIC_IMPACT.donationsYear)}</strong>
              <span className="kpi-foot">+ {formatCurrency(PUBLIC_IMPACT.donationsMonth)} só em outubro</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-label">Crianças acompanhadas</span>
              <strong className="kpi-value">{PUBLIC_IMPACT.childrenAccompanied}</strong>
              <span className="kpi-foot">{PUBLIC_IMPACT.familiesHelped} famílias na rede</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-label">Ações realizadas</span>
              <strong className="kpi-value">{PUBLIC_IMPACT.actionsCompleted}</strong>
              <span className="kpi-foot">{PUBLIC_IMPACT.hoursVolunteered.toLocaleString('pt-BR')} h de voluntariado</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-label">Cestas entregues</span>
              <strong className="kpi-value">{PUBLIC_IMPACT.basketsDelivered}</strong>
              <span className="kpi-foot">{PUBLIC_IMPACT.schoolKits} kits escolares</span>
            </article>
          </div>

          <div className="viz-grid">
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Doações mês a mês</h3>
                  <p>Valor arrecadado e estimado em espécie (maio–outubro).</p>
                </div>
                <span className="viz-tag">R$ atual</span>
              </header>
              <ColumnChart
                items={MONTHLY_DONATIONS.map((m) => ({ label: m.month, value: m.value }))}
                formatValue={(v) => compactMoney(v).replace('R$ ', '')}
              />
            </article>

            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Por tipo de doação</h3>
                  <p>Quanto entrou e quantos lançamentos em cada categoria.</p>
                </div>
              </header>
              <BarList
                items={DONATIONS_BY_TYPE.map((t) => ({
                  label: t.label,
                  value: t.value,
                  hint: `${t.count} lançamentos`,
                }))}
                formatValue={compactMoney}
              />
            </article>

            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Para onde vai o recurso</h3>
                  <p>Destinação das doações confirmadas em {PUBLIC_IMPACT.yearLabel}.</p>
                </div>
              </header>
              <BarList
                accent
                items={DONATIONS_BY_DESTINATION.map((d) => ({
                  label: d.label,
                  value: d.value,
                }))}
                formatValue={compactMoney}
              />
            </article>

            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Rede de apoio</h3>
                  <p>Quem sustenta a operação no dia a dia.</p>
                </div>
              </header>
              <BarList
                items={SUPPORT_NETWORK.map((s) => ({ label: s.label, value: s.value }))}
              />
              <div className="mini-stats">
                <div>
                  <strong>{PUBLIC_IMPACT.recurringDonors}</strong>
                  <span>doadores recorrentes</span>
                </div>
                <div>
                  <strong>{PUBLIC_IMPACT.godparents}</strong>
                  <span>padrinhos ativos</span>
                </div>
                <div>
                  <strong>{PUBLIC_IMPACT.partners}</strong>
                  <span>parceiros locais</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="acoes">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Ações recentes</p>
              <h2>O que a ASA fez nos últimos meses.</h2>
            </div>
            <p className="section-lead">
              Cada ação vira registro no sistema — com participantes, resultado e
              rastreio de doações vinculadas.
            </p>
          </div>

          <div className="action-board">
            {ACTIONS_TIMELINE.map((action) => (
              <article className="action-card" key={`${action.date}-${action.title}`}>
                <div className="action-top">
                  <span className="action-type">{action.type}</span>
                  <time dateTime={action.date}>{formatDate(action.date)}</time>
                </div>
                <h3>{action.title}</h3>
                <p className="action-result">{action.result}</p>
                <p className="action-detail">{action.detail}</p>
              </article>
            ))}
          </div>

          <div className="viz-card map-card">
            <header className="viz-head">
              <div>
                <h3>Crianças por território</h3>
                <p>Distribuição aproximada do cadastro ativo e em acompanhamento.</p>
              </div>
            </header>
            <BarList
              accent
              items={CHILDREN_BY_NEIGHBORHOOD.map((n) => ({
                label: n.label,
                value: n.value,
                hint: 'crianças',
              }))}
            />
          </div>
        </div>
      </section>

      <section className="section" id="sobre">
        <div className="container split">
          <div>
            <p className="section-kicker">Quem somos</p>
            <h2>Uma asa que acolhe quem mais precisa.</h2>
            <p className="section-lead">
              A ONG ASA — {ORG.fullName} — nasceu em {ORG.founded} para oferecer apoio
              concreto a crianças e famílias: reforço escolar, alimentação, escuta e
              presença comunitária.
            </p>
            <div className="pillars tight">
              <article className="pillar">
                <h3>Educação</h3>
                <p>Reforço, oficinas e acompanhamento escolar contínuo.</p>
              </article>
              <article className="pillar">
                <h3>Acolhimento</h3>
                <p>Escuta familiar e rede de proteção no território.</p>
              </article>
              <article className="pillar">
                <h3>Assistência</h3>
                <p>Cestas, kits e apoio material com rastreabilidade.</p>
              </article>
            </div>
          </div>
          <div className="split-media">
            <img src="./images/about.jpg" alt="Crianças e educadores em atividade" />
          </div>
        </div>
      </section>

      <section className="section cta-section" id="ajudar">
        <div className="container cta-panel">
          <div>
            <p className="section-kicker">Participe</p>
            <h2>Doe, apadrinhe ou seja voluntário.</h2>
            <p className="section-lead">
              Toda contribuição entra no painel da equipe — com relatórios claros
              para prestar contas à comunidade.
            </p>
          </div>
          <div className="hero-actions">
            <a className="btn btn-primary" href={`mailto:${ORG.email}`}>
              Falar com a ASA
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
              <div className="footer-brand">ASA</div>
              <p>{ORG.fullName}</p>
              <p style={{ marginTop: '0.75rem' }}>{ORG.tagline}</p>
            </div>
            <div>
              <h4>Contato</h4>
              <p>{ORG.email}</p>
              <p>{ORG.phone}</p>
              <p>{ORG.address}</p>
            </div>
            <div>
              <h4>Sistema</h4>
              <p>
                <Link to="/sistema">Painel administrativo</Link>
              </p>
              <p>Dados de demonstração para apresentação.</p>
            </div>
          </div>
          <div className="footer-note">
            <span>© {new Date().getFullYear()} ONG ASA — MVP de demonstração</span>
            <span>Layout inspirado em leitura clara de dados públicos</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
