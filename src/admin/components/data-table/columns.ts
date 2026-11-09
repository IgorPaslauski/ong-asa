import type { SortingFn } from '@tanstack/react-table'
import { collator } from '@/admin/lib/format'

/**
 * Comparadores tipados. As colunas devem expor o valor BRUTO (ISO, número, texto)
 * via accessor — nunca a string formatada — e escolher o comparador do seu tipo.
 */

function nullsLast<T>(a: T | null | undefined, b: T | null | undefined): number | null {
  const an = a == null || a === ''
  const bn = b == null || b === ''
  if (an && bn) return 0
  if (an) return 1
  if (bn) return -1
  return null
}

export const textSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<string | null>(columnId)
  const b = rowB.getValue<string | null>(columnId)
  return nullsLast(a, b) ?? collator.compare(String(a), String(b))
}

export const numberSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<number | null>(columnId)
  const b = rowB.getValue<number | null>(columnId)
  return nullsLast(a, b) ?? Number(a) - Number(b)
}

/** Datas ISO (yyyy-mm-dd ou yyyy-mm-ddThh:mm) — comparação cronológica. */
export const dateSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<string | null>(columnId)
  const b = rowB.getValue<string | null>(columnId)
  const nl = nullsLast(a, b)
  if (nl != null) return nl
  const ta = Date.parse(String(a))
  const tb = Date.parse(String(b))
  return ta === tb ? 0 : ta < tb ? -1 : 1
}

export const booleanSort: SortingFn<any> = (rowA, rowB, columnId) =>
  Number(rowA.getValue<boolean>(columnId)) - Number(rowB.getValue<boolean>(columnId))

/** Ordem definida por lista (ex.: status do menos ao mais avançado). */
export function enumSort(order: readonly string[]): SortingFn<any> {
  const rank = new Map(order.map((v, i) => [v, i]))
  return (rowA, rowB, columnId) => {
    const a = rank.get(rowA.getValue<string>(columnId)) ?? Number.MAX_SAFE_INTEGER
    const b = rank.get(rowB.getValue<string>(columnId)) ?? Number.MAX_SAFE_INTEGER
    return a - b
  }
}
