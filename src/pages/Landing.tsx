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
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="wordmark" to="/">
            {ORG.shortName}
            <span>{ORG.city}/{ORG.state}</span>
          </Link>
          <nav aria-label="Principal">
            <a href="#sobre">Sobre</a>
            <a href="#dados">Números</a>
            <a href="#acoes">Ações</a>
            <a href="#contato">Contato</a>
            <Link to="/sistema">Sistema</Link>
          </nav>
        </div>
      </header>

      <section className="intro">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">{ORG.legalName}</p>
            <h1>Apoio a crianças e adolescentes em Condor.</h1>
            <p className="lede">{ORG.mission}</p>
            <div className="intro-actions">
              <a className="btn btn-dark" href="#contato">
                Entrar em contato
              </a>
              <a className="text-link" href="#dados">
                Ver números
              </a>
            </div>
          </div>
          <figure className="intro-figure">
            <img src="./images/about.jpg" alt="Atividade com crianças na Associação Semeando o Amanhã" />
            <figcaption>
              Condor, RS · desde {ORG.founded}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="facts" aria-label="Indicadores do sistema">
        <div className="container facts-row">
          {model.kpis.map((kpi) => (
            <div className="fact" key={kpi.key}>
              <strong>{kpi.display}</strong>
              <span>{kpi.label}</span>
              <em>{kpi.foot}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="block" id="sobre">
        <div className="container split">
          <div>
            <h2>A associação</h2>
            <p>{ORG.about[0]}</p>
            <p>{ORG.about[2]}</p>
            <p className="quiet">{ORG.principle}</p>
          </div>
          <dl className="meta">
            <div>
              <dt>Fundação</dt>
              <dd>{ORG.foundedLabel}</dd>
            </div>
            <div>
              <dt>CNPJ</dt>
              <dd>{ORG.cnpj}</dd>
            </div>
            <div>
              <dt>Sede</dt>
              <dd>
                {ORG.address}
                <br />
                {ORG.city}/{ORG.state}
              </dd>
            </div>
            <div>
              <dt>Visão</dt>
              <dd>{ORG.vision}</dd>
            </div>
          </dl>
        </div>

        <div className="container">
          <ul className="work-list">
            {ORG.pillars.map((p) => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="block" id="dados">
        <div className="container">
          <div className="block-head">
            <h2>Números de {model.yearLabel}</h2>
            <p>Calculados a partir dos cadastros e das doações do sistema.</p>
          </div>

          <div className="charts">
            <article>
              <h3>Doações por mês</h3>
              {model.monthly.length ? (
                <ColumnChart
                  items={model.monthly.map((m) => ({ label: m.label, value: m.value }))}
                  formatValue={(v) => compactMoney(v).replace('R$ ', '')}
                />
              ) : (
                <p className="quiet">Sem doações confirmadas.</p>
              )}
            </article>
            <article>
              <h3>Por tipo</h3>
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
                <p className="quiet">Sem lançamentos.</p>
              )}
            </article>
            <article>
              <h3>Destinação</h3>
              {model.byDestination.length ? (
                <BarList
                  items={model.byDestination.map((d) => ({ label: d.label, value: d.value }))}
                  formatValue={compactMoney}
                />
              ) : (
                <p className="quiet">Sem destinações.</p>
              )}
            </article>
            <article>
              <h3>Quem ajuda</h3>
              {model.support.length ? (
                <BarList items={model.support.map((s) => ({ label: s.label, value: s.value }))} />
              ) : (
                <p className="quiet">Sem cadastros ativos.</p>
              )}
            </article>
          </div>
          <p className="footnote">{model.sourcesNote}</p>
        </div>
      </section>

      <section className="block" id="acoes">
        <div className="container split">
          <div>
            <h2>Ações recentes</h2>
            <ul className="action-list">
              {model.actions.map((action) => (
                <li key={action.id}>
                  <time dateTime={action.data}>{formatDate(action.data)}</time>
                  <div>
                    <strong>{action.titulo}</strong>
                    <span>
                      {action.tipo} · {action.participantes} participantes
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Por bairro</h2>
            <BarList
              items={model.byArea.map((n) => ({
                label: n.label,
                value: n.value,
                hint: n.hint,
              }))}
            />
          </div>
        </div>
      </section>

      <section className="block contact" id="contato">
        <div className="container contact-row">
          <div>
            <h2>Contato</h2>
            <p>Doações, voluntariado e parcerias.</p>
          </div>
          <div>
            <p>
              <a href={`tel:+5555991349705`}>{ORG.phone}</a>
            </p>
            <p>{ORG.phoneAlt}</p>
            <p>
              {ORG.address}
              <br />
              {ORG.city}/{ORG.state} · {ORG.cep}
            </p>
          </div>
          <div>
            <Link className="btn btn-dark" to="/sistema">
              Abrir sistema
            </Link>
          </div>
        </div>
      </section>

      <footer className="colophon">
        <div className="container colophon-row">
          <span>
            {ORG.legalName} · CNPJ {ORG.cnpj}
          </span>
          <span>
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  )
}
