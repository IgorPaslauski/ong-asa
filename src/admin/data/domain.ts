/**
 * Regras de cálculo do admin (puras e testáveis).
 *
 * CRITÉRIO CENTRAL: o campo `valor` de uma doação tem significado diferente
 * conforme o tipo.
 *  - `financeira`: dinheiro (recebido quando o status é "confirmada").
 *  - demais tipos (alimento, roupa, material, serviço): ESTIMATIVA monetária
 *    atribuída ao bem ou serviço. Não é dinheiro em caixa.
 * Por isso os dois totais nunca são somados sem rótulo.
 */
import type { Activity, Child, Donation, DonationType, Helper } from '@/data/mock'
import { todayISO } from '../lib/format'

export const FINANCIAL_TYPE: DonationType = 'financeira'

export function isFinancial(d: Pick<Donation, 'tipo'>): boolean {
  return d.tipo === FINANCIAL_TYPE
}

export interface DonationTotals {
  /** Dinheiro efetivamente recebido (financeira + confirmada). */
  cashReceived: number
  /** Estimativa monetária de bens/serviços confirmados. */
  inKindEstimate: number
  /** Dinheiro ainda pendente de confirmação. */
  cashPending: number
  inKindPending: number
  confirmedCount: number
  pendingCount: number
  canceledCount: number
  totalCount: number
}

export function summarizeDonations(list: Donation[]): DonationTotals {
  const t: DonationTotals = {
    cashReceived: 0,
    inKindEstimate: 0,
    cashPending: 0,
    inKindPending: 0,
    confirmedCount: 0,
    pendingCount: 0,
    canceledCount: 0,
    totalCount: list.length,
  }
  for (const d of list) {
    if (d.status === 'confirmada') {
      t.confirmedCount += 1
      if (isFinancial(d)) t.cashReceived += d.valor
      else t.inKindEstimate += d.valor
    } else if (d.status === 'pendente') {
      t.pendingCount += 1
      if (isFinancial(d)) t.cashPending += d.valor
      else t.inKindPending += d.valor
    } else {
      t.canceledCount += 1
    }
  }
  return t
}

/* --------------------------------- Períodos -------------------------------- */

export interface Period {
  id: string
  label: string
  /** ISO yyyy-mm-dd, inclusivo. `null` = sem limite. */
  from: string | null
  to: string | null
}

export function inPeriod(iso: string, p: Pick<Period, 'from' | 'to'>): boolean {
  if (p.from && iso < p.from) return false
  if (p.to && iso > p.to) return false
  return true
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1 + months, 1)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(Math.min(d, lastDay)).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function buildPeriodPresets(now = new Date()): Period[] {
  const today = todayISO(now)
  const year = now.getFullYear()
  return [
    { id: 'ano', label: `${year}`, from: `${year}-01-01`, to: `${year}-12-31` },
    { id: '12m', label: 'Últimos 12 meses', from: addMonths(today, -12), to: today },
    { id: '6m', label: 'Últimos 6 meses', from: addMonths(today, -6), to: today },
    { id: '3m', label: 'Últimos 3 meses', from: addMonths(today, -3), to: today },
    { id: 'ano-ant', label: `${year - 1}`, from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
    { id: 'tudo', label: 'Todo o histórico', from: null, to: null },
  ]
}

export function describePeriod(p: Pick<Period, 'from' | 'to' | 'label'>): string {
  const fmt = (iso: string) => iso.split('-').reverse().join('/')
  if (!p.from && !p.to) return 'Todo o histórico'
  if (p.from && p.to) return `${fmt(p.from)} a ${fmt(p.to)}`
  if (p.from) return `a partir de ${fmt(p.from)}`
  return `até ${fmt(p.to as string)}`
}

/* ------------------------------ Séries temporais --------------------------- */

export type Granularity = 'month' | 'year'

export interface SeriesPoint {
  key: string // yyyy-mm ou yyyy
  cash: number
  inKind: number
  count: number
}

/** Agrupa doações CONFIRMADAS por mês ou ano, separando dinheiro de estimativa. Preenche meses vazios. */
export function donationSeries(list: Donation[], granularity: Granularity, period: Period): SeriesPoint[] {
  const confirmed = list.filter((d) => d.status === 'confirmada' && inPeriod(d.data, period))
  if (!confirmed.length) return []
  const keyOf = (iso: string) => (granularity === 'month' ? iso.slice(0, 7) : iso.slice(0, 4))
  const map = new Map<string, SeriesPoint>()
  for (const d of confirmed) {
    const k = keyOf(d.data)
    const p = map.get(k) ?? { key: k, cash: 0, inKind: 0, count: 0 }
    if (isFinancial(d)) p.cash += d.valor
    else p.inKind += d.valor
    p.count += 1
    map.set(k, p)
  }
  const keys = [...map.keys()].sort()
  const first = keys[0]
  const last = keys[keys.length - 1]
  const out: SeriesPoint[] = []
  if (granularity === 'month') {
    let [y, m] = first.split('-').map(Number)
    const [ly, lm] = last.split('-').map(Number)
    while (y < ly || (y === ly && m <= lm)) {
      const k = `${y}-${String(m).padStart(2, '0')}`
      out.push(map.get(k) ?? { key: k, cash: 0, inKind: 0, count: 0 })
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
  } else {
    for (let y = Number(first); y <= Number(last); y++) {
      out.push(map.get(String(y)) ?? { key: String(y), cash: 0, inKind: 0, count: 0 })
    }
  }
  return out
}

export interface CategoryPoint {
  key: string
  label: string
  value: number
  count: number
}

export function groupDonations(
  list: Donation[],
  by: (d: Donation) => string,
  labelOf: (key: string) => string = (k) => k,
  valueOf: (d: Donation) => number = (d) => d.valor,
): CategoryPoint[] {
  const map = new Map<string, CategoryPoint>()
  for (const d of list) {
    const key = by(d)
    const p = map.get(key) ?? { key, label: labelOf(key), value: 0, count: 0 }
    p.value += valueOf(d)
    p.count += 1
    map.set(key, p)
  }
  return [...map.values()].sort((a, b) => b.value - a.value)
}

/* --------------------------- Crianças e rede de apoio ----------------------- */

export function countBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, number> {
  const out = {} as Record<K, number>
  for (const item of items) {
    const k = key(item)
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

export function donationsOfHelper(helper: Helper, donations: Donation[]): Donation[] {
  return donations.filter((d) => d.doadorId === helper.id).sort((a, b) => b.data.localeCompare(a.data))
}

export interface ActivityYear {
  year: string
  actions: number
  participants: number
}

export function activitiesByYear(list: Activity[]): ActivityYear[] {
  const map = new Map<string, ActivityYear>()
  for (const a of list) {
    const y = a.data.slice(0, 4)
    const p = map.get(y) ?? { year: y, actions: 0, participants: 0 }
    p.actions += 1
    p.participants += a.participantes
    map.set(y, p)
  }
  return [...map.values()].sort((a, b) => a.year.localeCompare(b.year))
}

export function childrenEnteredByYear(list: Child[]): { year: string; count: number }[] {
  const map = new Map<string, number>()
  for (const c of list) map.set(c.dataEntrada.slice(0, 4), (map.get(c.dataEntrada.slice(0, 4)) ?? 0) + 1)
  return [...map.entries()].map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year))
}
