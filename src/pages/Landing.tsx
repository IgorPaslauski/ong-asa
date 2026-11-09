import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarList, ColumnChart } from '../components/Charts'
import Reveal from '../components/Reveal'
import SiteHeader from '../components/SiteHeader'
import CampaignsSection from '../components/CampaignsSection'
import VolunteerSection from '../components/VolunteerSection'
import ActivitiesStory from '../components/story/ActivitiesStory'
import AboutStory from '../components/story/AboutStory'
import HelpStory from '../components/story/HelpStory'
import GallerySection from '../components/story/GallerySection'
import HeroScene from '../components/story/HeroScene'
import ImpactStage from '../components/story/ImpactStage'
import { useEnhancedMotion } from '../hooks/useMotion'
import { ACTIONS_TIMELINE } from '../data/impact'
import { ORG, PUBLIC_NOTES } from '../data/org'
import { formatCurrency, formatDate } from '../data/mock'
import logoUrl from '../assets/logo-asa.png'
import { whatsapp } from '../lib/contact'
import { buildLandingPublicModel } from '../lib/publicStats'
import { formatEventTime, getPublicEvents } from '../lib/publicEvents'

function compactMoney(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return formatCurrency(value)
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function dateParts(iso: string) {
  return {
    day: iso.slice(8, 10),
    month: MONTHS[Number(iso.slice(5, 7)) - 1] ?? '',
    year: iso.slice(0, 4),
  }
}

/** Cor discreta e estável por tipo de ação (só para ajudar a distinguir). */
function toneOf(type: string) {
  let sum = 0
  for (const char of type) sum += char.charCodeAt(0)
  return sum % 3
}


const FAQ = [
  {
    q: 'Quem pode participar?',
    a: `Crianças e adolescentes de ${PUBLIC_NOTES.ageRange}. A associação atende famílias de todo o município de Condor.`,
  },
  {
    q: 'As atividades são gratuitas?',
    a: 'Sim. As oficinas são gratuitas para as famílias.',
  },
  {
    q: 'Onde fica a associação?',
    a: `${ORG.address}, ${ORG.city}/${ORG.state} — CEP ${ORG.cep}.`,
  },
  {
    q: 'Como faço para inscrever meu filho?',
    a: 'Fale com a equipe pelo WhatsApp ou por telefone. Eles explicam como funciona a inscrição e informam horários e vagas disponíveis.',
  },
]

export default function Landing() {
  const enhanced = useEnhancedMotion()
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => buildLandingPublicModel(year), [year, revision])
  const { live } = model
  // Agenda: eventos publicados pela equipe no painel (só os de hoje em diante).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const upcoming = useMemo(() => getPublicEvents().slice(0, 6), [revision])

  const timeline = (
    model.actions.length > 0
      ? model.actions.map((action) => ({
          key: action.id,
          date: action.data,
          type: action.tipo,
          title: action.titulo,
          note: `${action.participantes} participantes`,
        }))
      : ACTIONS_TIMELINE.map((action) => ({
          key: `${action.date}-${action.title}`,
          date: action.date,
          type: action.type,
          title: action.title,
          note: action.result,
        }))
  ).slice(0, 6)

  return (
    <div className="landing" id="top">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <SiteHeader />

      <main id="conteudo">
        {/* 1. Hero cinematográfico + abertura */}
        <HeroScene enhanced={enhanced} />

        {/* 2. Quem somos */}
        <AboutStory />

        {/* 3. Atividades em camadas */}
        <ActivitiesStory enhanced={enhanced} />

        {/* 6. Impacto e transparência */}
        <section className="section impact" id="impacto" aria-labelledby="impacto-title">
          <div className="container">
            <Reveal className="section-head">
              <p className="eyebrow">Impacto e transparência</p>
              <h2 id="impacto-title">O que já fizemos, em números.</h2>
              <p className="lead">
                Cada número abaixo conta uma coisa diferente, e explicamos qual. Os valores vêm do sistema
                da associação, hoje em versão de demonstração — por isso são ilustrativos até a equipe
                cadastrar os dados reais.
              </p>
            </Reveal>

            <div className="year-switch" role="group" aria-label="Período dos dados">
              <button
                type="button"
                aria-pressed={year === 'all'}
                className={year === 'all' ? 'is-on' : ''}
                onClick={() => setYear('all')}
              >
                Todos os anos
              </button>
              {model.years.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={year === item}
                  className={year === item ? 'is-on' : ''}
                  onClick={() => setYear(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <ImpactStage
              enhanced={enhanced}
              lead={{
                prefix: 'cerca de',
                value: PUBLIC_NOTES.weeklyChildren.replace(/^cerca de\s*/, ''),
                title: 'crianças e adolescentes por semana',
                note: 'É a presença semanal nas oficinas, segundo relatos da própria associação. Não é o mesmo número que o de fichas cadastradas.',
              }}
              items={[
                {
                  label: 'No cadastro',
                  value: String(live.childrenTotal),
                  unit: 'crianças e adolescentes',
                  note: `${live.childrenActive} ativos · ${live.childrenFollowing} em acompanhamento. Inclui também quem já concluiu o ciclo.`,
                },
                {
                  label: 'Ações realizadas',
                  value: String(live.activitiesCount),
                  unit: 'registradas',
                  note: `${live.participations} participações somadas, contando cada pessoa em cada ação.`,
                },
                {
                  label: 'Doações recebidas',
                  value: compactMoney(live.donationsTotalValue),
                  unit: 'confirmadas',
                  note: `${live.donationsConfirmed} lançamentos, incluindo itens como alimentos e roupas, que entram com valor estimado.`,
                },
                {
                  label: 'Rede de apoio',
                  value: String(live.helpersActive),
                  unit: 'pessoas ativas',
                  note: 'Voluntários, doadores, padrinhos e parceiros cadastrados.',
                },
              ]}
            />

            <div className="transparency">
              <Reveal>
                <h3>Para onde foram as doações</h3>
                <p className="note">
                  Destino indicado em cada doação confirmada ({model.yearLabel}). Este quadro mostra
                  destinação, não o balanço de despesas.
                </p>
                <BarList
                  accent
                  items={model.byDestination
                    .filter((d) => d.value > 0)
                    .map((d) => ({ label: d.label, value: d.value }))}
                  formatValue={compactMoney}
                />
              </Reveal>
              <Reveal delay={100}>
                <h3>Doações por mês</h3>
                <p className="note">{year === 'all' ? 'Últimos seis meses.' : `Meses de ${year}.`}</p>
                {model.monthly.length ? (
                  <ColumnChart
                    items={model.monthly.map((m) => ({ label: m.label, value: m.value }))}
                    formatValue={(v) => compactMoney(v).replace('R$ ', '')}
                  />
                ) : (
                  <p className="note">Sem doações confirmadas neste período.</p>
                )}
              </Reveal>
            </div>

            <details className="more-data">
              <summary>Ver mais dados</summary>
              <div className="transparency">
                <div>
                  <h3>Doações por ano</h3>
                  <ColumnChart
                    items={model.evolution.map((point) => ({ label: point.year, value: point.donations }))}
                    formatValue={(value) => compactMoney(value).replace('R$ ', '')}
                  />
                </div>
                <div>
                  <h3>Tipos de doação</h3>
                  <BarList
                    items={model.byType.map((t) => ({ label: t.label, value: t.value, hint: t.hint }))}
                    formatValue={compactMoney}
                  />
                </div>
                <div>
                  <h3>Quem sustenta a A.S.A.</h3>
                  <BarList items={model.support.map((s) => ({ label: s.label, value: s.value }))} />
                </div>
                <div>
                  <h3>De onde vêm as crianças</h3>
                  <BarList
                    accent
                    items={model.byArea.map((n) => ({ label: n.label, value: n.value, hint: n.hint }))}
                  />
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* 5. Histórias e ações */}
        <section className="section actions-section on-dark" aria-labelledby="acoes-title">
          <div className="container">
            {upcoming.length > 0 ? (
              <div id="agenda" aria-labelledby="agenda-title" role="region" style={{ marginBottom: 'clamp(3rem, 7vw, 5rem)' }}>
                <Reveal className="section-head">
                  <p className="eyebrow">Agenda</p>
                  <h2 id="agenda-title">Próximos eventos.</h2>
                </Reveal>
                <ol className="actions-feed">
                  {upcoming.map((item, index) => {
                    const date = dateParts(item.data)
                    const when = formatEventTime(item)
                    return (
                      <Reveal as="li" key={item.id} className={`action${index === 0 ? ' action--lead' : ''}`} delay={(index % 2) * 80}>
                        <time dateTime={item.data} className="action-date">
                          <span className="visually-hidden">{formatDate(item.data)}</span>
                          <span className="action-day" aria-hidden="true">{date.day}</span>
                          <span className="action-month" aria-hidden="true">{date.month} {date.year}</span>
                        </time>
                        <div className="action-body">
                          {when || item.local ? <span className="tag tone-0">{[when, item.local].filter(Boolean).join(' · ')}</span> : null}
                          <h3>{item.titulo}</h3>
                          {item.descricao ? <p>{item.descricao}</p> : null}
                        </div>
                      </Reveal>
                    )
                  })}
                </ol>
              </div>
            ) : null}
            <Reveal className="section-head">
              <p className="eyebrow">Ações recentes</p>
              <h2 id="acoes-title">O que andamos fazendo.</h2>
            </Reveal>
            <ol className="actions-feed">
              {timeline.slice(0, 5).map((item, index) => {
                const date = dateParts(item.date)
                return (
                  <Reveal
                    as="li"
                    key={item.key}
                    className={`action${index === 0 ? ' action--lead' : ''}`}
                    delay={(index % 2) * 80}
                  >
                    <time dateTime={item.date} className="action-date">
                      <span className="visually-hidden">{formatDate(item.date)}</span>
                      <span className="action-day" aria-hidden="true">
                        {date.day}
                      </span>
                      <span className="action-month" aria-hidden="true">
                        {date.month} {date.year}
                      </span>
                    </time>
                    <div className="action-body">
                      <span className={`tag tone-${toneOf(item.type)}`}>{item.type}</span>
                      <h3>{item.title}</h3>
                      <p>{item.note}</p>
                    </div>
                  </Reveal>
                )
              })}
            </ol>
          </div>
        </section>

        <GallerySection />

        <CampaignsSection />

        {/* 4. Como participar */}
        <section className="section join" id="participar" aria-labelledby="participar-title">
          <div className="container join-grid">
            <Reveal>
              <p className="eyebrow">Para as famílias</p>
              <h2 id="participar-title">Como participar.</h2>
              <p className="lead">
                Tem uma criança ou adolescente em casa? Veja as dúvidas mais comuns e fale diretamente com a
                equipe.
              </p>
              <div className="join-contact">
                <a
                  className="btn btn-primary"
                  href={whatsapp('Olá! Gostaria de saber como inscrever meu filho nas atividades da A.S.A.')}
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar com a equipe no WhatsApp
                </a>
                <p>
                  Ou ligue: <a href="tel:+5555991349705">{ORG.phone}</a> ·{' '}
                  <a href="tel:+555533791685">{ORG.phoneAlt}</a>
                </p>
              </div>
            </Reveal>
            <Reveal className="faq" delay={100}>
              {FAQ.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* 7. Como ajudar */}
        <HelpStory />

        {/* 8. Candidatura de voluntário */}
        <VolunteerSection />
      </main>

      <footer className="site-footer on-dark">
        <div className="container footer-grid">
          <div>
            <img className="footer-logo" src={logoUrl} alt="Instituto A.S.A. — Semeando o Amanhã" width={96} height={96} loading="lazy" />
            <p>
              {ORG.name} — {ORG.legalName}
            </p>
            <p className="footer-muted">CNPJ {ORG.cnpj}</p>
          </div>
          <div>
            <h2>Contato</h2>
            <p>
              <a href="tel:+5555991349705">{ORG.phone}</a> · <a href="tel:+555533791685">{ORG.phoneAlt}</a>
            </p>
            <p>
              <a href={`mailto:${ORG.email}`}>{ORG.email}</a>
            </p>
            <p>
              {ORG.address}
              <br />
              {ORG.city}/{ORG.state} · CEP {ORG.cep}
            </p>
          </div>
          <div>
            <h2>Equipe</h2>
            <p>
              <Link to="/sistema">Entrar no sistema</Link>
            </p>
            <p className="footer-muted">Versão de demonstração com dados ilustrativos.</p>
          </div>
        </div>
        <div className="container footer-note">
          © {new Date().getFullYear()} {ORG.legalName}
        </div>
      </footer>
    </div>
  )
}
