import { describe, expect, it } from 'vitest'
import { buildYearSeries } from './accountsSeries'

const don = (data: string, valor: number, status = 'confirmada') => ({ id: data + valor, data, valor, status, tipo: 'financeira' }) as never
const exp = (data: string, valor: number, status = 'paga') => ({ id: data + valor, data, valor, status, categoria: 'x' }) as never

describe('buildYearSeries', () => {
  it('soma por mês e acumula, ignorando não confirmadas', () => {
    const [s] = buildYearSeries([don('2025-01-10', 100), don('2025-01-20', 50), don('2025-03-01', 25), don('2025-02-01', 999, 'pendente')], [], 'recebido', '2026-11-09')
    expect(s.monthly.slice(0, 4)).toEqual([150, 0, 25, 0])
    expect(s.cumulative.slice(0, 4)).toEqual([150, 150, 175, 175])
    expect(s.monthly[11]).toBe(0)
  })
  it('corta o ano corrente no mês atual e limita a quantidade de anos', () => {
    const list = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'].map((y) => don(`${y}-01-05`, 10))
    const out = buildYearSeries(list, [], 'recebido', '2026-03-15')
    expect(out.map((s) => s.year)).toEqual(['2022', '2023', '2024', '2025', '2026'])
    expect(out[4].monthly[2]).toBe(0)
    expect(out[4].monthly[3]).toBeNull()
  })
  it('despesas usa só as pagas', () => {
    const [s] = buildYearSeries([], [exp('2025-05-01', 40), exp('2025-05-02', 60, 'pendente')], 'despesas', '2026-01-01')
    expect(s.monthly[4]).toBe(40)
  })
})
