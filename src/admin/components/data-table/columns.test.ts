import { describe, expect, it } from 'vitest'
import type { Row } from '@tanstack/react-table'
import { dateSort, enumSort, numberSort, textSort } from './columns'

const row = (v: unknown) => ({ getValue: () => v }) as unknown as Row<any>
const cmp = (fn: any, a: unknown, b: unknown) => fn(row(a), row(b), 'x')

describe('comparadores de coluna', () => {
  it('números são comparados numericamente (9 < 10)', () => {
    expect(cmp(numberSort, 9, 10)).toBeLessThan(0)
    expect(cmp(numberSort, 1200.5, 99)).toBeGreaterThan(0)
  })

  it('texto respeita o português (acentos e caixa)', () => {
    expect(cmp(textSort, 'Álvaro', 'Beatriz')).toBeLessThan(0)
    expect(cmp(textSort, 'ana', 'Ana')).toBe(0)
    expect(cmp(textSort, 'Zélia', 'Abel')).toBeGreaterThan(0)
  })

  it('datas são cronológicas, não alfabéticas', () => {
    expect(cmp(dateSort, '2025-12-31', '2026-01-01')).toBeLessThan(0)
    expect(cmp(dateSort, '2026-10-01', '2026-09-30')).toBeGreaterThan(0)
  })

  it('valores vazios vão para o fim', () => {
    expect(cmp(textSort, '', 'a')).toBeGreaterThan(0)
    expect(cmp(numberSort, null, 3)).toBeGreaterThan(0)
    expect(cmp(dateSort, undefined, '2026-01-01')).toBeGreaterThan(0)
  })

  it('enum usa a ordem definida', () => {
    const s = enumSort(['pendente', 'confirmada', 'cancelada'])
    expect(cmp(s, 'pendente', 'confirmada')).toBeLessThan(0)
    expect(cmp(s, 'cancelada', 'confirmada')).toBeGreaterThan(0)
  })
})
