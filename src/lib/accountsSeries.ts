import type { Donation } from '../data/mock'
import { isFinancial } from '../admin/data/domain'
import type { Expense } from '../admin/data/modules'

export type Metric = 'recebido' | 'despesas'
export type YearSeries = { year: string; monthly: (number | null)[]; cumulative: (number | null)[] }

/**
 * Valores por mês, um conjunto por ano. Recebido = doações em dinheiro confirmadas; despesas = só as pagas.
 * Meses depois de `today` ficam `null` (a linha para no mês atual em vez de despencar para zero).
 */
export function buildYearSeries(donations: Donation[], expenses: Expense[], metric: Metric, today: string, maxYears = 5): YearSeries[] {
  const rows: { data: string; valor: number }[] =
    metric === 'recebido'
      ? donations.filter((d) => isFinancial(d) && d.status === 'confirmada')
      : expenses.filter((e) => e.status === 'paga')
  const byYear = new Map<string, number[]>()
  for (const r of rows) {
    if (!/^\d{4}-\d{2}/.test(r.data)) continue
    const year = r.data.slice(0, 4)
    const month = Number(r.data.slice(5, 7)) - 1
    if (month < 0 || month > 11) continue
    const arr = byYear.get(year) ?? Array<number>(12).fill(0)
    arr[month] += r.valor
    byYear.set(year, arr)
  }
  const nowYear = today.slice(0, 4)
  const nowMonth = Number(today.slice(5, 7)) - 1
  return [...byYear.keys()]
    .sort()
    .slice(-maxYears)
    .map((year) => {
      const raw = byYear.get(year) as number[]
      const last = year > nowYear ? -1 : year === nowYear ? nowMonth : 11
      let acc = 0
      const monthly = raw.map((v, i) => (i <= last ? v : null))
      const cumulative = raw.map((v, i) => (i <= last ? (acc += v) : null))
      return { year, monthly, cumulative }
    })
}
