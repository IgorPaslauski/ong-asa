import { describe, expect, it } from 'vitest'
import type { Donation } from '@/data/mock'
import { buildPeriodPresets, describePeriod, donationSeries, groupDonations, inPeriod, summarizeDonations } from './domain'

const d = (over: Partial<Donation>): Donation => ({
  id: Math.random().toString(36),
  doadorId: 'h1',
  doadorNome: 'Fulano',
  tipo: 'financeira',
  valor: 100,
  descricao: '',
  data: '2026-01-10',
  status: 'confirmada',
  destinacao: 'Geral',
  ...over,
})

describe('summarizeDonations', () => {
  it('separa dinheiro recebido de estimativa de bens e serviços', () => {
    const t = summarizeDonations([
      d({ valor: 100 }),
      d({ tipo: 'alimento', valor: 400 }),
      d({ tipo: 'servico', valor: 50 }),
      d({ valor: 30, status: 'pendente' }),
      d({ tipo: 'material', valor: 70, status: 'pendente' }),
      d({ valor: 999, status: 'cancelada' }),
    ])
    expect(t.cashReceived).toBe(100)
    expect(t.inKindEstimate).toBe(450)
    expect(t.cashPending).toBe(30)
    expect(t.inKindPending).toBe(70)
    expect(t.confirmedCount).toBe(3)
    expect(t.pendingCount).toBe(2)
    expect(t.canceledCount).toBe(1)
    expect(t.totalCount).toBe(6)
  })

  it('ignora canceladas e pendentes nos totais confirmados', () => {
    const t = summarizeDonations([d({ valor: 10, status: 'cancelada' }), d({ valor: 20, status: 'pendente' })])
    expect(t.cashReceived).toBe(0)
  })
})

describe('inPeriod / períodos', () => {
  it('inclui as pontas e aceita limites nulos', () => {
    expect(inPeriod('2026-01-01', { from: '2026-01-01', to: '2026-01-31' })).toBe(true)
    expect(inPeriod('2026-01-31', { from: '2026-01-01', to: '2026-01-31' })).toBe(true)
    expect(inPeriod('2025-12-31', { from: '2026-01-01', to: '2026-01-31' })).toBe(false)
    expect(inPeriod('1999-01-01', { from: null, to: null })).toBe(true)
  })

  it('gera presets relativos à data informada', () => {
    const presets = buildPeriodPresets(new Date(2026, 10, 9))
    const byId = Object.fromEntries(presets.map((p) => [p.id, p]))
    expect(byId['ano']).toMatchObject({ from: '2026-01-01', to: '2026-12-31' })
    expect(byId['12m']).toMatchObject({ from: '2025-11-09', to: '2026-11-09' })
    expect(byId['ano-ant']).toMatchObject({ from: '2025-01-01', to: '2025-12-31' })
    expect(byId['tudo']).toMatchObject({ from: null, to: null })
  })

  it('descreve o período em pt-BR', () => {
    expect(describePeriod({ from: '2026-01-01', to: '2026-03-31', label: '' })).toBe('01/01/2026 a 31/03/2026')
    expect(describePeriod({ from: null, to: null, label: '' })).toBe('Todo o histórico')
  })
})

describe('donationSeries', () => {
  const period = { id: 'x', label: '', from: null, to: null }
  it('preenche meses sem doações e separa dinheiro de estimativa', () => {
    const s = donationSeries(
      [d({ data: '2026-01-10', valor: 100 }), d({ data: '2026-03-05', tipo: 'alimento', valor: 40 }), d({ data: '2026-02-01', status: 'pendente' })],
      'month',
      period,
    )
    expect(s.map((p) => p.key)).toEqual(['2026-01', '2026-02', '2026-03'])
    expect(s[0]).toMatchObject({ cash: 100, inKind: 0 })
    expect(s[1]).toMatchObject({ cash: 0, inKind: 0, count: 0 })
    expect(s[2]).toMatchObject({ cash: 0, inKind: 40 })
  })

  it('agrupa por ano', () => {
    const s = donationSeries([d({ data: '2024-05-01', valor: 1 }), d({ data: '2026-05-01', valor: 2 })], 'year', period)
    expect(s.map((p) => [p.key, p.cash])).toEqual([
      ['2024', 1],
      ['2025', 0],
      ['2026', 2],
    ])
  })

  it('retorna vazio sem doações confirmadas no período', () => {
    expect(donationSeries([d({ status: 'pendente' })], 'month', period)).toEqual([])
  })
})

describe('groupDonations', () => {
  it('ordena do maior para o menor valor', () => {
    const g = groupDonations(
      [d({ destinacao: 'A', valor: 1 }), d({ destinacao: 'B', valor: 5 }), d({ destinacao: 'A', valor: 2 })],
      (x) => x.destinacao,
    )
    expect(g.map((x) => [x.key, x.value, x.count])).toEqual([
      ['B', 5, 1],
      ['A', 3, 2],
    ])
  })
})
