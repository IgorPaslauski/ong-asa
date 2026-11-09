/** Tipos, coleções e regras de cálculo dos módulos: despesas, famílias, escala, estoque, metas e campanhas. */
import type { Activity, Child, Donation, Helper } from '@/data/mock'
import { createCollection, num, oneOf, str, strList, type Rec } from './collections'
import { inPeriod, isFinancial } from './domain'

/* --------------------------------- Despesas -------------------------------- */

export const EXPENSE_CATEGORIES = ['Alimentação', 'Material pedagógico', 'Pessoal e encargos', 'Aluguel e contas', 'Transporte', 'Eventos', 'Manutenção', 'Outros'] as const
export type ExpenseStatus = 'paga' | 'pendente'
export interface Expense {
  id: string
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  status: ExpenseStatus
  /** Destinação/projeto financiado (opcional), no mesmo vocabulário das doações. */
  destinacao: string
}
export const expenses = createCollection<Expense>({
  name: 'Despesas',
  key: 'asa_expenses_v1',
  prefix: 'x',
  normalize: (r: Rec) => ({
    id: str(r.id), data: str(r.data), categoria: str(r.categoria) || 'Outros', descricao: str(r.descricao), fornecedor: str(r.fornecedor),
    valor: num(r.valor), status: oneOf(r.status, ['paga', 'pendente'], 'paga'), destinacao: str(r.destinacao),
  }),
})

export interface Accounts {
  /** Dinheiro recebido: doações financeiras confirmadas. */
  receitas: number
  /** Despesas pagas. */
  despesas: number
  saldo: number
  despesasPendentes: number
  porCategoria: { categoria: string; valor: number }[]
}

/** Prestação de contas simples sobre um período. Bens e serviços (estimativas) ficam de fora: não são caixa. */
export function summarizeAccounts(donations: Donation[], list: Expense[], period: { from: string | null; to: string | null }): Accounts {
  const receitas = donations.filter((d) => isFinancial(d) && d.status === 'confirmada' && inPeriod(d.data, period)).reduce((s, d) => s + d.valor, 0)
  const inRange = list.filter((e) => inPeriod(e.data, period))
  const paid = inRange.filter((e) => e.status === 'paga')
  const despesas = paid.reduce((s, e) => s + e.valor, 0)
  const map = new Map<string, number>()
  for (const e of paid) map.set(e.categoria, (map.get(e.categoria) ?? 0) + e.valor)
  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    despesasPendentes: inRange.filter((e) => e.status === 'pendente').reduce((s, e) => s + e.valor, 0),
    porCategoria: [...map].map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor),
  }
}

/* --------------------------------- Famílias -------------------------------- */

export const BENEFITS = ['Bolsa Família', 'CadÚnico', 'BPC', 'Auxílio municipal', 'Outro'] as const
export const INCOME_BANDS = ['Até 1/2 salário mínimo por pessoa', 'Até 1 salário mínimo por pessoa', 'Acima de 1 salário mínimo por pessoa', 'Não informado'] as const
export interface Family {
  id: string
  responsavel: string
  parentesco: string
  telefone: string
  pessoasNaCasa: number
  renda: string
  beneficios: string[]
  criancas: string[]
  observacoes: string
}
export const families = createCollection<Family>({
  name: 'Famílias',
  key: 'asa_families_v1',
  prefix: 'f',
  normalize: (r: Rec) => ({
    id: str(r.id), responsavel: str(r.responsavel), parentesco: str(r.parentesco), telefone: str(r.telefone), pessoasNaCasa: num(r.pessoasNaCasa),
    renda: str(r.renda) || 'Não informado', beneficios: strList(r.beneficios), criancas: strList(r.criancas), observacoes: str(r.observacoes),
  }),
})

/** Crianças cadastradas que ainda não estão ligadas a nenhuma família. */
export function childrenWithoutFamily(children: Child[], list: Family[]): Child[] {
  const linked = new Set(list.flatMap((f) => f.criancas))
  return children.filter((c) => c.status !== 'concluido' && !linked.has(c.id))
}

/* ---------------------------------- Escala --------------------------------- */

export interface Shift {
  id: string
  titulo: string
  data: string
  horaInicio: string
  horaFim: string
  local: string
  voluntarios: string[]
}
export const shifts = createCollection<Shift>({
  name: 'Escala',
  key: 'asa_shifts_v1',
  prefix: 's',
  normalize: (r: Rec) => ({
    id: str(r.id), titulo: str(r.titulo), data: str(r.data), horaInicio: str(r.horaInicio), horaFim: str(r.horaFim), local: str(r.local), voluntarios: strList(r.voluntarios),
  }),
})

/** Duração do turno em horas (0 se faltar horário ou se o fim não for depois do início). */
export function shiftHours(s: Pick<Shift, 'horaInicio' | 'horaFim'>): number {
  const toMin = (t: string) => {
    const m = /^(\d{2}):(\d{2})$/.exec(t)
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN
  }
  const a = toMin(s.horaInicio)
  const b = toMin(s.horaFim)
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? (b - a) / 60 : 0
}

export interface VolunteerHours {
  helper: Helper
  turnos: number
  horas: number
}
/** Horas voluntariadas por pessoa, só de turnos já realizados (data até `today`). */
export function hoursByVolunteer(list: Shift[], helpers: Helper[], today: string): VolunteerHours[] {
  const done = list.filter((s) => s.data <= today)
  return helpers
    .map((helper) => {
      const mine = done.filter((s) => s.voluntarios.includes(helper.id))
      return { helper, turnos: mine.length, horas: mine.reduce((sum, s) => sum + shiftHours(s), 0) }
    })
    .filter((x) => x.turnos > 0)
    .sort((a, b) => b.horas - a.horas || a.helper.nome.localeCompare(b.helper.nome, 'pt-BR'))
}

/** Voluntários escalados em dois turnos que se sobrepõem no mesmo dia (conflito de agenda). */
export function findConflicts(candidate: Pick<Shift, 'data' | 'horaInicio' | 'horaFim' | 'voluntarios'>, others: Shift[]): string[] {
  if (!candidate.horaInicio || !candidate.horaFim) return []
  const clash = new Set<string>()
  for (const o of others) {
    if (o.data !== candidate.data || !o.horaInicio || !o.horaFim) continue
    const overlap = candidate.horaInicio < o.horaFim && o.horaInicio < candidate.horaFim
    if (!overlap) continue
    for (const v of candidate.voluntarios) if (o.voluntarios.includes(v)) clash.add(v)
  }
  return [...clash]
}

/* ---------------------------------- Estoque -------------------------------- */

export const STOCK_CATEGORIES = ['Alimentos', 'Roupas e calçados', 'Material escolar', 'Higiene', 'Outros'] as const
export interface StockItem {
  id: string
  nome: string
  categoria: string
  unidade: string
  /** Abaixo (ou igual) a este saldo o item aparece como "baixo". */
  minimo: number
}
export interface StockMove {
  id: string
  itemId: string
  data: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  observacao: string
}
export const stockItems = createCollection<StockItem>({
  name: 'Estoque (itens)',
  key: 'asa_stock_items_v1',
  prefix: 'i',
  normalize: (r: Rec) => ({ id: str(r.id), nome: str(r.nome), categoria: str(r.categoria) || 'Outros', unidade: str(r.unidade) || 'un', minimo: num(r.minimo) }),
})
export const stockMoves = createCollection<StockMove>({
  name: 'Estoque (movimentos)',
  key: 'asa_stock_moves_v1',
  prefix: 'm',
  normalize: (r: Rec) => ({
    id: str(r.id), itemId: str(r.itemId), data: str(r.data), tipo: oneOf(r.tipo, ['entrada', 'saida'], 'entrada'), quantidade: num(r.quantidade), observacao: str(r.observacao),
  }),
})

export function stockBalance(itemId: string, moves: StockMove[]): number {
  return moves.filter((m) => m.itemId === itemId).reduce((s, m) => s + (m.tipo === 'entrada' ? m.quantidade : -m.quantidade), 0)
}
export const isLowStock = (item: StockItem, balance: number) => balance <= item.minimo

/* ----------------------------------- Metas --------------------------------- */

export const GOAL_METRICS = {
  criancas_ativas: 'Crianças e adolescentes ativos',
  atividades: 'Atividades realizadas',
  participacoes: 'Participações em atividades',
  dinheiro: 'Dinheiro recebido (R$)',
  voluntarios: 'Voluntários ativos',
  manual: 'Acompanhamento manual',
} as const
export type GoalMetric = keyof typeof GOAL_METRICS
export const GOAL_METRIC_KEYS = Object.keys(GOAL_METRICS) as GoalMetric[]
export interface Goal {
  id: string
  titulo: string
  /** Edital, convênio ou projeto a que a meta se refere (texto livre). */
  origem: string
  metrica: GoalMetric
  alvo: number
  /** Só para a métrica manual. */
  valorManual: number
  inicio: string
  fim: string
}
export const goals = createCollection<Goal>({
  name: 'Metas',
  key: 'asa_goals_v1',
  prefix: 'g',
  normalize: (r: Rec) => ({
    id: str(r.id), titulo: str(r.titulo), origem: str(r.origem), metrica: oneOf(r.metrica, GOAL_METRIC_KEYS, 'manual'), alvo: num(r.alvo), valorManual: num(r.valorManual),
    inicio: str(r.inicio), fim: str(r.fim),
  }),
})

export interface GoalData {
  children: Child[]
  activities: Activity[]
  donations: Donation[]
  helpers: Helper[]
}
export function goalProgress(g: Goal, data: GoalData): number {
  const period = { from: g.inicio || null, to: g.fim || null }
  switch (g.metrica) {
    case 'criancas_ativas':
      return data.children.filter((c) => c.status === 'ativo' || c.status === 'acompanhamento').length
    case 'atividades':
      return data.activities.filter((a) => inPeriod(a.data, period)).length
    case 'participacoes':
      return data.activities.filter((a) => inPeriod(a.data, period)).reduce((s, a) => s + a.participantes, 0)
    case 'dinheiro':
      return data.donations.filter((d) => isFinancial(d) && d.status === 'confirmada' && inPeriod(d.data, period)).reduce((s, d) => s + d.valor, 0)
    case 'voluntarios':
      return data.helpers.filter((h) => h.papel === 'voluntario' && h.ativo).length
    default:
      return g.valorManual
  }
}
export const goalPercent = (value: number, alvo: number) => (alvo > 0 ? Math.min(100, Math.round((value / alvo) * 100)) : 0)

/* --------------------------------- Campanhas ------------------------------- */

export interface Campaign {
  id: string
  titulo: string
  descricao: string
  meta: number
  /** Doações financeiras confirmadas com esta destinação, dentro do período, contam para a campanha. */
  destinacao: string
  inicio: string
  fim: string
  publicada: boolean
}
export const campaigns = createCollection<Campaign>({
  name: 'Campanhas',
  key: 'asa_campaigns_v1',
  prefix: 'p',
  normalize: (r: Rec) => ({
    id: str(r.id), titulo: str(r.titulo), descricao: str(r.descricao), meta: num(r.meta), destinacao: str(r.destinacao), inicio: str(r.inicio), fim: str(r.fim), publicada: r.publicada === true,
  }),
})

export function campaignRaised(c: Campaign, donations: Donation[]): number {
  const period = { from: c.inicio || null, to: c.fim || null }
  return donations.filter((d) => isFinancial(d) && d.status === 'confirmada' && d.destinacao === c.destinacao && inPeriod(d.data, period)).reduce((s, d) => s + d.valor, 0)
}

/** Campanhas que o site mostra: publicadas e ainda no prazo. */
export function publicCampaigns(list: Campaign[], today: string): Campaign[] {
  return list.filter((c) => c.publicada && c.titulo.trim() !== '' && c.meta > 0 && (!c.fim || c.fim >= today))
}
