import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarList, ColumnChart, Sparkline } from '../../components/Charts'
import {
  DONATIONS_BY_DESTINATION,
  DONATIONS_BY_TYPE,
  MONTHLY_DONATIONS,
  PUBLIC_IMPACT,
} from '../../data/impact'
import {
  DONATION_TYPE_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  formatCurrency,
  formatDate,
} from '../../data/mock'
import { getActivities, getChildren, getDonations, getHelpers } from '../../lib/storage'

function compact(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace('.', ',')} mil`
  return formatCurrency(value)
}

export default function Overview() {
  const children = getChildren()
  const helpers = getHelpers()
  const donations = getDonations()
  const activities = getActivities()

  const stats = useMemo(() => {
    const activeChildren = children.filter((c) => c.status === 'ativo').length
    const followUp = children.filter((c) => c.status === 'acompanhamento').length
    const activeHelpers = helpers.filter((h) => h.ativo).length
    const confirmed = donations.filter((d) => d.status === 'confirmada')
    const pending = donations.filter((d) => d.status === 'pendente')
    const totalMoney = confirmed.reduce((s, d) => s + d.valor, 0)
    const financial = confirmed
      .filter((d) => d.tipo === 'financeira')
      .reduce((s, d) => s + d.valor, 0)
    const thisMonth = confirmed
      .filter((d) => d.data.startsWith('2026-10'))
      .reduce((s, d) => s + d.valor, 0)
    return {
      activeChildren,
      followUp,
      activeHelpers,
      totalMoney,
      financial,
      pending: pending.length,
      confirmedCount: confirmed.length,
      thisMonth,
      totalChildren: children.length,
      totalHelpers: helpers.length,
    }
  }, [children, helpers, donations])

  const recent = [...donations].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6)
  const childStatus = (Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((s) => ({
    label: STATUS_LABEL[s],
    value: children.filter((c) => c.status === s).length,
  }))
  const helperRoles = (Object.keys(ROLE_LABEL) as Array<keyof typeof ROLE_LABEL>).map((r) => ({
    label: ROLE_LABEL[r],
    value: helpers.filter((h) => h.papel === r).length,
  }))

  return (
    <div className="dash-page">
      <header className="dash-header">
        <div>
          <p className="eyebrow">Instituto A.S.A. · Condor/RS · out/2026</p>
          <h1>Dashboard A.S.A.</h1>
          <p>Associação Semeando o Amanhã — doações, cadastros e oficinas.</p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-ghost-dark btn-sm" to="/painel/doacoes">
            Nova doação
          </Link>
          <Link className="btn btn-dark btn-sm" to="/painel/relatorios">
            Relatório completo
          </Link>
        </div>
      </header>

      <div className="metric-grid">
        <article className="metric-card">
          <div className="metric-top">
            <span>Arrecadação no ano</span>
            <Sparkline values={MONTHLY_DONATIONS.map((m) => m.value)} />
          </div>
          <strong>{compact(PUBLIC_IMPACT.donationsYear)}</strong>
          <em>
            {compact(PUBLIC_IMPACT.donationsMonth)} em out · {stats.confirmedCount} no cadastro local
          </em>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>Ações realizadas</span>
          </div>
          <strong>{PUBLIC_IMPACT.actionsCompleted}</strong>
          <em>
            {PUBLIC_IMPACT.hoursVolunteered.toLocaleString('pt-BR')} h · {stats.pending} pendência(s)
          </em>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>Crianças na rede</span>
          </div>
          <strong>{PUBLIC_IMPACT.childrenAccompanied}</strong>
          <em>
            Cadastro demo: {stats.activeChildren} ativas · {stats.followUp} acompanhamento
          </em>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>Rede de apoio</span>
          </div>
          <strong>{PUBLIC_IMPACT.activeVolunteers}</strong>
          <em>
            {PUBLIC_IMPACT.godparents} padrinhos · {stats.activeHelpers} ativos no sistema
          </em>
        </article>
      </div>

      <div className="dash-grid-main">
        <section className="panel elev">
          <div className="panel-title">
            <div>
              <h2>Doações nos últimos meses</h2>
              <p className="panel-sub">Série mensal (valores confirmados + estimativa em espécie)</p>
            </div>
          </div>
          <ColumnChart
            items={MONTHLY_DONATIONS.map((m) => ({ label: m.month, value: m.value }))}
            formatValue={(v) => (v / 1000).toFixed(1).replace('.', ',')}
          />
        </section>

        <section className="panel elev">
          <div className="panel-title">
            <div>
              <h2>Composição por tipo</h2>
              <p className="panel-sub">Participação no volume do ano</p>
            </div>
          </div>
          <BarList
            items={DONATIONS_BY_TYPE.map((t) => ({
              label: t.label,
              value: t.value,
              hint: `${t.count} lançamentos`,
            }))}
            formatValue={compact}
          />
        </section>
      </div>

      <div className="dash-grid-3">
        <section className="panel elev">
          <div className="panel-title">
            <h2>Destinação</h2>
          </div>
          <BarList
            accent
            items={DONATIONS_BY_DESTINATION.slice(0, 5).map((d) => ({
              label: d.label,
              value: d.value,
            }))}
            formatValue={compact}
          />
        </section>

        <section className="panel elev">
          <div className="panel-title">
            <h2>Cadastro infantil</h2>
          </div>
          <BarList items={childStatus} />
          <Link className="panel-link" to="/painel/criancas">
            Gerenciar crianças →
          </Link>
        </section>

        <section className="panel elev">
          <div className="panel-title">
            <h2>Quem ajuda</h2>
          </div>
          <BarList accent items={helperRoles} />
          <Link className="panel-link" to="/painel/pessoas">
            Gerenciar rede →
          </Link>
        </section>
      </div>

      <div className="dash-grid-main">
        <section className="panel elev">
          <div className="panel-title">
            <h2>Últimos lançamentos</h2>
            <Link to="/painel/doacoes">Ver todas</Link>
          </div>
          <div className="table-wrap compact">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Doador</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((d) => (
                  <tr key={d.id}>
                    <td>{formatDate(d.data)}</td>
                    <td>
                      <strong>{d.doadorNome}</strong>
                      <div className="muted tiny">{d.destinacao}</div>
                    </td>
                    <td>{DONATION_TYPE_LABEL[d.tipo]}</td>
                    <td>{d.valor ? formatCurrency(d.valor) : '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          d.status === 'confirmada'
                            ? 'badge-ok'
                            : d.status === 'pendente'
                              ? 'badge-warn'
                              : 'badge-danger'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel elev">
          <div className="panel-title">
            <h2>Agenda de ações</h2>
          </div>
          <div className="timeline">
            {activities.map((a) => (
              <div className="timeline-item" key={a.id}>
                <div className="timeline-dot" />
                <div>
                  <div className="timeline-date">{formatDate(a.data)}</div>
                  <strong>{a.titulo}</strong>
                  <div className="muted tiny">
                    {a.tipo} · {a.participantes} participantes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
