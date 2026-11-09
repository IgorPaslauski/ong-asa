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
import { ORG, PUBLIC_NOTES } from '../data/org'
import { formatCurrency, formatDate } from '../data/mock'
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
          <div className="split-media">
            <img src="./images/about.jpg" alt="Crianças e educadores em atividade" />
          </div>
        </div>

        <div className="container" style={{ marginTop: '2.5rem' }}>
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

          <div className="pillars" style={{ marginTop: '1.5rem' }}>
            {ORG.pillars.map((p) => (
              <article className="pillar" key={p.title}>
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
              <p className="section-kicker">Transparência {PUBLIC_IMPACT.yearLabel}</p>
              <h2>O impacto da A.S.A. em números.</h2>
            </div>
            <p className="section-lead">
              Indicadores para apresentação do MVP — calibrados à escala da associação em Condor.
              No sistema, cadastros e doações alimentam a operação do dia a dia.
            </p>
          </div>

          <div className="kpi-grid">
            <article className="kpi-card">
              <span className="kpi-label">Doações no ano</span>
              <strong className="kpi-value">{compactMoney(PUBLIC_IMPACT.donationsYear)}</strong>
              <span className="kpi-foot">+ {formatCurrency(PUBLIC_IMPACT.donationsMonth)} em outubro</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-label">Crianças na rede</span>
              <strong className="kpi-value">{PUBLIC_IMPACT.childrenAccompanied}</strong>
              <span className="kpi-foot">~{PUBLIC_IMPACT.weeklyAttendance}/semana nas oficinas</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-label">Voluntariado</span>
              <strong className="kpi-value">{PUBLIC_NOTES.volunteersCore + PUBLIC_NOTES.volunteersSupport}</strong>
              <span className="kpi-foot">
                {PUBLIC_NOTES.volunteersCore} efetivos · {PUBLIC_NOTES.volunteersSupport} em eventos
              </span>
            </article>
            <article className="kpi-card">
              <span className="kpi-label">Ações no ano</span>
              <strong className="kpi-value">{PUBLIC_IMPACT.actionsCompleted}</strong>
              <span className="kpi-foot">{PUBLIC_IMPACT.familiesHelped} famílias acompanhadas</span>
            </article>
          </div>

          <div className="viz-grid">
            <article className="viz-card">
              <header className="viz-head">
                <div>
                  <h3>Doações mês a mês</h3>
                  <p>Arrecadação e estimativa em espécie (maio–outubro).</p>
                </div>
                <span className="viz-tag">R$ ilustrativo</span>
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
                  <p>Financeiro, alimentos, TI/material, roupas e serviços.</p>
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
                  <p>Oficinas, famílias, digital, cultura e empreendedorismo.</p>
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
                  <h3>Rede que sustenta a A.S.A.</h3>
                  <p>Voluntários, doadores e parceiros do município e região.</p>
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
                  <span>padrinhos</span>
                </div>
                <div>
                  <strong>{PUBLIC_IMPACT.partners}</strong>
                  <span>parceiros</span>
                </div>
              </div>
            </article>
          </div>
          <p className="source-note">{PUBLIC_NOTES.sourcesLabel}</p>
        </div>
      </section>

      <section className="section" id="acoes">
        <div className="container">
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
                <h3>Atendimento no município</h3>
                <p>A A.S.A. recebe crianças de todo Condor — centro, Olaria e interior.</p>
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
