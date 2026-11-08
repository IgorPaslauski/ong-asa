import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../data/mock'
import { getActivities, getChildren, getDonations, getHelpers } from '../../lib/storage'

export default function Overview() {
  const children = getChildren()
  const helpers = getHelpers()
  const donations = getDonations()
  const activities = getActivities()

  const stats = useMemo(() => {
    const activeChildren = children.filter((c) => c.status === 'ativo').length
    const activeHelpers = helpers.filter((h) => h.ativo).length
    const confirmed = donations.filter((d) => d.status === 'confirmada')
    const totalMoney = confirmed
      .filter((d) => d.tipo === 'financeira')
      .reduce((s, d) => s + d.valor, 0)
    const pending = donations.filter((d) => d.status === 'pendente').length
    return { activeChildren, activeHelpers, totalMoney, pending, totalDonations: confirmed.length }
  }, [children, helpers, donations])

  const recent = [...donations]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5)

  return (
    <div>
      <header className="dash-header">
        <div>
          <h1>Visão geral</h1>
          <p>Controles rápidos do acolhimento, da rede de apoio e das doações.</p>
        </div>
        <Link className="btn btn-dark btn-sm" to="/painel/relatorios">
          Gerar relatório
        </Link>
      </header>

      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="stat">
          <div className="label">Crianças ativas</div>
          <div className="value">{stats.activeChildren}</div>
        </div>
        <div className="stat">
          <div className="label">Pessoas ativas</div>
          <div className="value">{stats.activeHelpers}</div>
        </div>
        <div className="stat">
          <div className="label">Doações financeiras</div>
          <div className="value" style={{ fontSize: '1.35rem' }}>
            {formatCurrency(stats.totalMoney)}
          </div>
        </div>
        <div className="stat">
          <div className="label">Pendências</div>
          <div className="value">{stats.pending}</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-title">
            <h2>Doações recentes</h2>
            <Link to="/painel/doacoes">Ver todas</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Doador</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((d) => (
                  <tr key={d.id}>
                    <td>{formatDate(d.data)}</td>
                    <td>{d.doadorNome}</td>
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

        <section className="panel">
          <div className="panel-title">
            <h2>Atividades</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Atividade</th>
                  <th>Pessoas</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.data)}</td>
                    <td>
                      <div>{a.titulo}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {a.tipo}
                      </div>
                    </td>
                    <td>{a.participantes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
