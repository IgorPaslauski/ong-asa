/**
 * Modelo público da LP derivado do sistema (cadastros + doações + ações).
 * Campos que ainda não existem no operacional usam fallback editorial.
 */
import {
  DONATION_TYPE_LABEL,
  ROLE_LABEL,
  type Activity,
  type Child,
  type Donation,
  type DonationType,
  type Helper,
  type HelperRole,
  formatCurrency,
} from '../data/mock'
import {
  CHILDREN_BY_NEIGHBORHOOD,
  PUBLIC_IMPACT,
} from '../data/impact'
import { PUBLIC_NOTES } from '../data/org'
import {
  getActivities,
  getChildren,
  getDonations,
  getHelpers,
} from './storage'

export type StatSource = 'system' | 'editorial'

export interface NamedValue {
  label: string
  value: number
  hint?: string
  source: StatSource
}

export interface LandingKpi {
  key: string
  label: string
  display: string
  foot: string
  source: StatSource
}

export interface YearPoint {
  year: string
  donations: number
  children: number
  actions: number
}

export interface LandingPublicModel {
  yearLabel: string
  years: string[]
  selectedYear: string
  evolution: YearPoint[]
  kpis: LandingKpi[]
  monthly: NamedValue[]
  byType: NamedValue[]
  byDestination: NamedValue[]
  support: NamedValue[]
  byArea: NamedValue[]
  actions: Array<Activity & { source: StatSource }>
  live: {
    childrenTotal: number
    childrenActive: number
    childrenFollowing: number
    participations: number
    helpersActive: number
    donationsConfirmed: number
    donationsTotalValue: number
    activitiesCount: number
  }
  sourcesNote: string
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function confirmed(donations: Donation[]) {
  return donations.filter((d) => d.status === 'confirmada')
}

function monthKey(iso: string) {
  const [y, m] = iso.split('-')
  return `${y}-${m}`
}

function monthShort(iso: string) {
  const month = Number(iso.slice(5, 7)) - 1
  return MONTH_LABELS[month] || iso.slice(5, 7)
}

function sumBy<T>(items: T[], keyFn: (item: T) => string, valueFn: (item: T) => number) {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item)
    map.set(key, (map.get(key) || 0) + valueFn(item))
  }
  return map
}

function compactMoney(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return formatCurrency(value)
}

function buildMonthly(donations: Donation[]): NamedValue[] {
  const rows = confirmed(donations)
  if (!rows.length) return []

  const totals = sumBy(
    rows,
    (d) => monthKey(d.data),
    (d) => d.valor,
  )

  const keys = [...totals.keys()].sort()
  const last = keys.slice(-6)
  return last.map((key) => ({
    label: monthShort(`${key}-01`),
    value: totals.get(key) || 0,
    source: 'system' as const,
  }))
}

function buildByType(donations: Donation[]): NamedValue[] {
  const rows = confirmed(donations)
  const types = Object.keys(DONATION_TYPE_LABEL) as DonationType[]
  return types
    .map((tipo) => {
      const list = rows.filter((d) => d.tipo === tipo)
      return {
        label: DONATION_TYPE_LABEL[tipo],
        value: list.reduce((s, d) => s + d.valor, 0),
        hint: `${list.length} lançamento${list.length === 1 ? '' : 's'}`,
        source: 'system' as const,
      }
    })
    .filter((row) => row.value > 0 || Boolean(row.hint && !row.hint.startsWith('0 ')))
    .sort((a, b) => b.value - a.value)
}

function buildByDestination(donations: Donation[]): NamedValue[] {
  const rows = confirmed(donations)
  const totals = sumBy(
    rows,
    (d) => d.destinacao || 'Geral',
    (d) => d.valor,
  )
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, source: 'system' as const }))
    .sort((a, b) => b.value - a.value)
}

function buildSupport(helpers: Helper[]): NamedValue[] {
  const roles = Object.keys(ROLE_LABEL) as HelperRole[]
  return roles
    .map((papel) => {
      const list = helpers.filter((h) => h.papel === papel && h.ativo)
      return {
        label: ROLE_LABEL[papel],
        value: list.length,
        source: 'system' as const,
      }
    })
    .filter((row) => row.value > 0)
}

function buildByArea(children: Child[]): NamedValue[] {
  if (!children.length) {
    return CHILDREN_BY_NEIGHBORHOOD.map((n) => ({
      ...n,
      hint: 'crianças',
      source: 'editorial' as const,
    }))
  }
  const totals = sumBy(
    children.filter((c) => c.status !== 'concluido'),
    (c) => c.bairro || 'Outros',
    () => 1,
  )
  return [...totals.entries()]
    .map(([label, value]) => ({
      label,
      value,
      hint: 'crianças',
      source: 'system' as const,
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildYearEvolution(
  children: Child[],
  donations: Donation[],
  activities: Activity[],
): YearPoint[] {
  const years = new Set<string>()
  for (const row of donations) years.add(row.data.slice(0, 4))
  for (const row of children) years.add(row.dataEntrada.slice(0, 4))
  for (const row of activities) years.add(row.data.slice(0, 4))

  return [...years]
    .filter((year) => /^\d{4}$/.test(year))
    .sort()
    .map((year) => ({
      year,
      donations: confirmed(donations)
        .filter((d) => d.data.startsWith(year))
        .reduce((sum, d) => sum + d.valor, 0),
      children: children.filter((c) => c.dataEntrada.startsWith(year)).length,
      actions: activities.filter((a) => a.data.startsWith(year)).length,
    }))
}

/** Agrega o que a LP precisa a partir do armazenamento do sistema. */
export function buildLandingPublicModel(year: string | 'all' = 'all'): LandingPublicModel {
  const children = getChildren()
  const helpers = getHelpers()
  const donations = getDonations()
  const activities = getActivities()
  const evolution = buildYearEvolution(children, donations, activities)
  const years = evolution.map((point) => point.year)
  const selectedYear = year !== 'all' && years.includes(year) ? year : 'all'

  const scopedDonations =
    selectedYear === 'all' ? donations : donations.filter((d) => d.data.startsWith(selectedYear))
  const scopedActivities =
    selectedYear === 'all' ? activities : activities.filter((a) => a.data.startsWith(selectedYear))
  const scopedChildren =
    selectedYear === 'all'
      ? children
      : children.filter((c) => c.dataEntrada.startsWith(selectedYear))

  const okDonations = confirmed(scopedDonations)
  const totalValue = okDonations.reduce((s, d) => s + d.valor, 0)
  const activeChildren = scopedChildren.filter((c) => c.status === 'ativo').length
  const followChildren = scopedChildren.filter((c) => c.status === 'acompanhamento').length
  const activeHelpers = helpers.filter((h) => h.ativo).length
  const latestMonth = [...okDonations].sort((a, b) => b.data.localeCompare(a.data))[0]?.data.slice(0, 7)
  const latestMonthValue = latestMonth
    ? okDonations.filter((d) => d.data.startsWith(latestMonth)).reduce((s, d) => s + d.valor, 0)
    : 0

  const monthly = buildMonthly(scopedDonations)
  const byType = buildByType(scopedDonations)
  const byDestination = buildByDestination(scopedDonations)
  const support = buildSupport(helpers)
  const byArea = buildByArea(selectedYear === 'all' ? children : scopedChildren)

  const kpis: LandingKpi[] = [
    {
      key: 'donations',
      label: selectedYear === 'all' ? 'Doações no período' : `Doações em ${selectedYear}`,
      display: compactMoney(totalValue || PUBLIC_IMPACT.donationsYear),
      foot:
        totalValue > 0
          ? `${okDonations.length} confirmadas · ${compactMoney(latestMonthValue)} no último mês`
          : `Referência editorial · ${compactMoney(PUBLIC_IMPACT.donationsMonth)}`,
      source: totalValue > 0 ? 'system' : 'editorial',
    },
    {
      key: 'children',
      label: selectedYear === 'all' ? 'Crianças cadastradas' : `Entradas em ${selectedYear}`,
      display: String(scopedChildren.length || PUBLIC_IMPACT.childrenAccompanied),
      foot:
        scopedChildren.length > 0
          ? `${activeChildren} ativas · ${followChildren} em acompanhamento`
          : `~${PUBLIC_IMPACT.weeklyAttendance}/semana nas oficinas`,
      source: scopedChildren.length > 0 ? 'system' : 'editorial',
    },
    {
      key: 'helpers',
      label: 'Rede de apoio ativa',
      display: String(activeHelpers || PUBLIC_NOTES.volunteersCore + PUBLIC_NOTES.volunteersSupport),
      foot:
        activeHelpers > 0
          ? `${helpers.length} no cadastro · voluntários, doadores e parceiros`
          : `${PUBLIC_NOTES.volunteersCore} efetivos · ${PUBLIC_NOTES.volunteersSupport} em eventos`,
      source: activeHelpers > 0 ? 'system' : 'editorial',
    },
    {
      key: 'actions',
      label: selectedYear === 'all' ? 'Ações registradas' : `Ações em ${selectedYear}`,
      display: String(scopedActivities.length || PUBLIC_IMPACT.actionsCompleted),
      foot:
        scopedActivities.length > 0
          ? `${scopedActivities.reduce((s, a) => s + a.participantes, 0)} participações somadas`
          : `${PUBLIC_IMPACT.familiesHelped} famílias acompanhadas`,
      source: scopedActivities.length > 0 ? 'system' : 'editorial',
    },
  ]

  const actionRows =
    scopedActivities.length > 0
      ? [...scopedActivities]
          .sort((a, b) => b.data.localeCompare(a.data))
          .slice(0, 6)
          .map((a) => ({ ...a, source: 'system' as const }))
      : []

  return {
    yearLabel: selectedYear === 'all' ? `${years[0] ?? ''}–${years.at(-1) ?? ''}` : selectedYear,
    years,
    selectedYear,
    evolution,
    kpis,
    monthly,
    byType,
    byDestination,
    support,
    byArea,
    actions: actionRows,
    live: {
      childrenTotal: scopedChildren.length,
      childrenActive: activeChildren,
      childrenFollowing: followChildren,
      participations: scopedActivities.reduce((sum, a) => sum + a.participantes, 0),
      helpersActive: activeHelpers,
      donationsConfirmed: okDonations.length,
      donationsTotalValue: totalValue,
      activitiesCount: scopedActivities.length,
    },
    sourcesNote:
      selectedYear === 'all'
        ? 'Evolução anual e totais saem do sistema. Escolha um ano para ver só aquele período.'
        : `Recorte de ${selectedYear}. A série anual continua com todos os anos cadastrados.`,
  }
}
