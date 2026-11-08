import { useMemo, useState } from 'react'
import {
  DONATION_TYPE_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  type DonationType,
  formatCurrency,
  formatDate,
} from '../../data/mock'
import { getChildren, getDonations, getHelpers, resetAllData } from '../../lib/storage'

export default function ReportsPage() {
  const [from, setFrom] = useState('2026-08-01')
  const [to, setTo] = useState('2026-10-31')
  const [printedAt, setPrintedAt] = useState<string | null>(null)

  const children = getChildren()
  const helpers = getHelpers()
  const donations = getDonations()

  const report = useMemo(() => {
    const inRange = donations.filter((d) => d.data >= from && d.data <= to)
    const confirmed = inRange.filter((d) => d.status === 'confirmada')
    const byType = (Object.keys(DONATION_TYPE_LABEL) as DonationType[]).map((tipo) => {
      const list = confirmed.filter((d) => d.tipo === tipo)
      const total = list.reduce((s, d) => s + d.valor, 0)
      return { tipo, count: list.length, total }
    })
    const financial = confirmed
      .filter((d) => d.tipo === 'financeira')
      .reduce((s, d) => s + d.valor, 0)
    const inKind = confirmed
      .filter((d) => d.tipo !== 'financeira' && d.tipo !== 'servico')
      .reduce((s, d) => s + d.valor, 0)
    const maxType = Math.max(...byType.map((t) => t.total), 1)

    const byDest = Object.entries(
      confirmed.reduce<Record<string, number>>((acc, d) => {
        acc[d.destinacao] = (acc[d.destinacao] || 0) + d.valor
        return acc
      }, {}),
    )
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)

    return {
      inRange,
      confirmed,
      byType,
      financial,
      inKind,
      maxType,
      byDest,
      pending: inRange.filter((d) => d.status === 'pendente').length,
      activeChildren: children.filter((c) => c.status === 'ativo').length,
      activeHelpers: helpers.filter((h) => h.ativo).length,
    }
  }, [donations, children, helpers, from, to])

  function exportCsv() {
    const rows = [
      ['Data', 'Doador', 'Tipo', 'Valor', 'Destinação', 'Status', 'Descrição'],
      ...report.inRange.map((d) => [
        d.data,
        d.doadorNome,
        DONATION_TYPE_LABEL[d.tipo],
        String(d.valor),
        d.destinacao,
        d.status,
        d.descricao,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asa-relatorio-doacoes-${from}-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printReport() {
    setPrintedAt(new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
    setTimeout(() => window.print(), 50)
  }

  function handleReset() {
    if (!confirm('Restaurar todos os dados mockados originais?')) return
    resetAllData()
    window.location.reload()
  }

  return (
    <div>
      <header className="dash-header">
        <div>
          <h1>Relatórios</h1>
          <p>Resumo de doações e controles gerais para apresentação.</p>
        </div>
        <div className="row-actions">
          <button className="btn btn-ghost-dark btn-sm" type="button" onClick={exportCsv}>
            Exportar CSV
          </button>
          <button className="btn btn-dark btn-sm" type="button" onClick={printReport}>
            Imprimir / PDF
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="from">De</label>
          <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="to">Até</label>
          <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="stat">
          <div className="label">Doações no período</div>
          <div className="value">{report.confirmed.length}</div>
        </div>
        <div className="stat">
          <div className="label">Financeiro confirmado</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatCurrency(report.financial)}
          </div>
        </div>
        <div className="stat">
          <div className="label">Em espécie (est.)</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatCurrency(report.inKind)}
          </div>
        </div>
        <div className="stat">
          <div className="label">Pendentes</div>
          <div className="value">{report.pending}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <section className="panel">
          <div className="panel-title">
            <h2>Por tipo de doação</h2>
          </div>
          <div className="chart-bars">
            {report.byType.map((t) => (
              <div className="chart-row" key={t.tipo}>
                <div>{DONATION_TYPE_LABEL[t.tipo]}</div>
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${Math.max(6, (t.total / report.maxType) * 100)}%` }}
                  />
                </div>
                <div>{formatCurrency(t.total)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Por destinação</h2>
          </div>
          <div className="chart-bars">
            {report.byDest.map((d) => (
              <div className="chart-row" key={d.name}>
                <div>{d.name}</div>
                <div className="chart-track">
                  <div
                    className="chart-fill accent"
                    style={{
                      width: `${Math.max(
                        6,
                        (d.total / Math.max(...report.byDest.map((x) => x.total), 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <div>{formatCurrency(d.total)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <section className="panel">
          <div className="panel-title">
            <h2>Cadastro de crianças</h2>
          </div>
          <div className="chart-bars">
            {(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((s) => {
              const count = children.filter((c) => c.status === s).length
              const max = Math.max(...Object.keys(STATUS_LABEL).map(
                (k) => children.filter((c) => c.status === k).length,
              ), 1)
              return (
                <div className="chart-row" key={s}>
                  <div>{STATUS_LABEL[s]}</div>
                  <div className="chart-track">
                    <div className="chart-fill" style={{ width: `${Math.max(6, (count / max) * 100)}%` }} />
                  </div>
                  <div>{count}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Rede de apoio</h2>
          </div>
          <div className="chart-bars">
            {(Object.keys(ROLE_LABEL) as Array<keyof typeof ROLE_LABEL>).map((r) => {
              const count = helpers.filter((h) => h.papel === r).length
              const max = Math.max(...Object.keys(ROLE_LABEL).map(
                (k) => helpers.filter((h) => h.papel === k).length,
              ), 1)
              return (
                <div className="chart-row" key={r}>
                  <div>{ROLE_LABEL[r]}</div>
                  <div className="chart-track">
                    <div
                      className="chart-fill accent"
                      style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
                    />
                  </div>
                  <div>{count}</div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title">
          <h2>Detalhamento do período</h2>
          <span className="muted">
            {formatDate(from)} — {formatDate(to)}
            {printedAt ? ` · gerado em ${printedAt} (America/Sao_Paulo)` : ''}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Doador</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Destinação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.inRange.map((d) => (
                <tr key={d.id}>
                  <td>{formatDate(d.data)}</td>
                  <td>{d.doadorNome}</td>
                  <td>{DONATION_TYPE_LABEL[d.tipo]}</td>
                  <td>{d.valor ? formatCurrency(d.valor) : '—'}</td>
                  <td>{d.destinacao}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!report.inRange.length ? <div className="empty">Sem lançamentos no período.</div> : null}
        </div>
      </section>

      <div style={{ marginTop: '1.25rem' }}>
        <button className="btn btn-ghost-dark btn-sm" type="button" onClick={handleReset}>
          Restaurar dados mockados
        </button>
      </div>
    </div>
  )
}
