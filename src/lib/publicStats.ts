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

export interface LandingPublicModel {
  yearLabel: string
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

/** Agrega o que a LP precisa a partir do armazenamento do sistema. */
export function buildLandingPublicModel(
  children = getChildren(),
  helpers = getHelpers(),
  donations = getDonations(),
  activities = getActivities(),
): LandingPublicModel {
  const okDonations = confirmed(donations)
  const totalValue = okDonations.reduce((s, d) => s + d.valor, 0)
  const activeChildren = children.filter((c) => c.status === 'ativo').length
  const followChildren = children.filter((c) => c.status === 'acompanhamento').length
  const activeHelpers = helpers.filter((h) => h.ativo).length
  const thisMonthKey = '2026-10'
  const thisMonthValue = okDonations
    .filter((d) => d.data.startsWith(thisMonthKey))
    .reduce((s, d) => s + d.valor, 0)

  const monthly = buildMonthly(donations)
  const byType = buildByType(donations)
  const byDestination = buildByDestination(donations)
  const support = buildSupport(helpers)
  const byArea = buildByArea(children)

  const kpis: LandingKpi[] = [
    {
      key: 'donations',
      label: 'Doações no sistema',
      display: compactMoney(totalValue || PUBLIC_IMPACT.donationsYear),
      foot:
        totalValue > 0
          ? `${okDonations.length} confirmadas · ${compactMoney(thisMonthValue)} em out`
          : `Referência editorial · ${compactMoney(PUBLIC_IMPACT.donationsMonth)} em out`,
      source: totalValue > 0 ? 'system' : 'editorial',
    },
    {
      key: 'children',
      label: 'Crianças cadastradas',
      display: String(children.length || PUBLIC_IMPACT.childrenAccompanied),
      foot:
        children.length > 0
          ? `${activeChildren} ativas · ${followChildren} em acompanhamento`
          : `~${PUBLIC_IMPACT.weeklyAttendance}/semana nas oficinas`,
      source: children.length > 0 ? 'system' : 'editorial',
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
      label: 'Ações registradas',
      display: String(activities.length || PUBLIC_IMPACT.actionsCompleted),
      foot:
        activities.length > 0
          ? `${activities.reduce((s, a) => s + a.participantes, 0)} participações somadas`
          : `${PUBLIC_IMPACT.familiesHelped} famílias acompanhadas`,
      source: activities.length > 0 ? 'system' : 'editorial',
    },
  ]

  const actionRows =
    activities.length > 0
      ? [...activities]
          .sort((a, b) => b.data.localeCompare(a.data))
          .slice(0, 6)
          .map((a) => ({ ...a, source: 'system' as const }))
      : []

  return {
    yearLabel: PUBLIC_IMPACT.yearLabel,
    kpis,
    monthly,
    byType,
    byDestination,
    support,
    byArea,
    actions: actionRows,
    live: {
      childrenTotal: children.length,
      childrenActive: activeChildren,
      helpersActive: activeHelpers,
      donationsConfirmed: okDonations.length,
      donationsTotalValue: totalValue,
      activitiesCount: activities.length,
    },
    sourcesNote:
      'Parte dos números vem ao vivo do sistema (cadastros e doações). O restante é contexto institucional da A.S.A.',
  }
}
