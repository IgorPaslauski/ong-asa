import { useMemo, useState } from 'react'
import { expenses, summarizeAccounts } from '../admin/data/modules'
import { useDonations } from '../admin/data/store'
import { BarList } from './Charts'
import YearLines from './YearLines'
import { buildYearSeries, type Metric } from '../lib/accountsSeries'
import { formatCurrency } from '../data/mock'

/**
 * Prestação de contas pública: só totais do ano (dinheiro recebido, despesas pagas e saldo) e despesas por categoria.
 * Nada de nomes de doadores, fornecedores ou crianças. Só aparece quando existe algum lançamento.
 */
export default function TransparencySection() {
  const donations = useDonations()
  const list = expenses.useAll()
  const years = useMemo(() => {
    const set = new Set<string>()
    for (const d of donations) if (d.status === 'confirmada' && /^\d{4}/.test(d.data)) set.add(d.data.slice(0, 4))
    for (const e of list) if (e.status === 'paga' && /^\d{4}/.test(e.data)) set.add(e.data.slice(0, 4))
    return [...set].sort().reverse()
  }, [donations, list])
  const [picked, setPicked] = useState('')
  const [metric, setMetric] = useState<Metric>('recebido')
  const [mode, setMode] = useState<'monthly' | 'cumulative'>('cumulative')
  const year = years.includes(picked) ? picked : years[0]

  const accounts = useMemo(
    () => (year ? summarizeAccounts(donations, list, { from: `${year}-01-01`, to: `${year}-12-31` }) : null),
    [donations, list, year],
  )
  const hasExpenses = list.some((e) => e.status === 'paga')
  const activeMetric: Metric = hasExpenses ? metric : 'recebido'
  const series = useMemo(() => buildYearSeries(donations, list, activeMetric, new Date().toISOString().slice(0, 10)), [donations, list, activeMetric])
  if (!year || !accounts || (accounts.receitas === 0 && accounts.despesas === 0)) return null

  return (
    <section className="section accounts" id="prestacao-de-contas" aria-labelledby="contas-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Transparência</p>
          <h2 id="contas-title">Prestação de contas.</h2>
          <p className="lead">
            Para onde vai o dinheiro que recebemos. Mostramos só os totais: dinheiro recebido por doações confirmadas e despesas já pagas.
            Bens e serviços doados não entram aqui, porque não são caixa.
          </p>
        </div>

        {years.length > 1 ? (
          <label className="accounts-year">
            Ano{' '}
            <select value={year} onChange={(e) => setPicked(e.target.value)}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <dl className="accounts-totals">
          <div>
            <dt>Dinheiro recebido em {year}</dt>
            <dd>{formatCurrency(accounts.receitas)}</dd>
          </div>
          {accounts.despesas > 0 ? (
            <>
              <div>
                <dt>Despesas pagas</dt>
                <dd>{formatCurrency(accounts.despesas)}</dd>
              </div>
              <div>
                <dt>Saldo do ano</dt>
                <dd>{formatCurrency(accounts.saldo)}</dd>
              </div>
            </>
          ) : null}
        </dl>

        {series.length > 0 ? (
          <div className="accounts-evolution">
            <h3>Evolução e comparação entre os anos</h3>
            <div className="accounts-controls">
              {hasExpenses ? (
                <div className="seg" role="group" aria-label="O que comparar">
                  <button type="button" aria-pressed={activeMetric === 'recebido'} onClick={() => setMetric('recebido')}>
                    Recebido
                  </button>
                  <button type="button" aria-pressed={activeMetric === 'despesas'} onClick={() => setMetric('despesas')}>
                    Despesas
                  </button>
                </div>
              ) : null}
              <div className="seg" role="group" aria-label="Forma de exibir">
                <button type="button" aria-pressed={mode === 'cumulative'} onClick={() => setMode('cumulative')}>
                  Acumulado no ano
                </button>
                <button type="button" aria-pressed={mode === 'monthly'} onClick={() => setMode('monthly')}>
                  Mês a mês
                </button>
              </div>
            </div>
            <YearLines series={series} field={mode} label={activeMetric === 'recebido' ? 'Dinheiro recebido' : 'Despesas pagas'} />
          </div>
        ) : null}

        {accounts.porCategoria.length > 0 ? (
          <div className="accounts-cats">
            <h3>Despesas por categoria</h3>
            <BarList
              items={accounts.porCategoria.map((c) => ({ label: c.categoria, value: c.valor }))}
              formatValue={formatCurrency}
            />
          </div>
        ) : null}
        <p className="accounts-note">Valores informados pela própria associação, sujeitos à conferência da diretoria.</p>
      </div>
    </section>
  )
}
