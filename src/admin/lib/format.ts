/** Formatadores pt-BR compartilhados por tabelas, gráficos, relatórios e exportações. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const num = new Intl.NumberFormat('pt-BR')

export function formatBRL(value: number): string {
  return brl.format(value)
}

export function formatBRLCompact(value: number): string {
  return brlCompact.format(value)
}

export function formatNumber(value: number): string {
  return num.format(value)
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`
}

/** "2026-10-05" -> "05/10/2026". Não passa por Date (evita deslocamento de fuso). */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** "2026-10" -> "out/26" */
export function formatMonthShort(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_SHORT[Number(m) - 1] ?? m}/${y.slice(2)}`
}

/** "2026-10" -> "outubro de 2026" */
export function formatMonthLong(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_LONG[Number(m) - 1] ?? m} de ${y}`
}

export function formatDateTimeBR(date: Date): string {
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Comparação de texto adequada ao português (acentos, caixa, números naturais). */
export const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

/** Normaliza para busca: minúsculas e sem acentos. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
