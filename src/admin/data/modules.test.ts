import { beforeEach, describe, expect, it } from 'vitest'
import type { Activity, Child, Donation, Helper } from '@/data/mock'
import { can } from '@/lib/auth'
import {
  campaignRaised, campaigns, childrenWithoutFamily, expenses, findConflicts, goalPercent, goalProgress, hoursByVolunteer, isLowStock, publicCampaigns,
  shiftHours, stockBalance, summarizeAccounts, type Campaign, type Expense, type Family, type Goal, type Shift, type StockMove,
} from './modules'
import { COLLECTIONS } from './collections'
import { whatsappLink, personalize } from '../features/communication/communication-page'

beforeEach(() => localStorage.clear())

const don = (o: Partial<Donation>): Donation => ({ id: 'd', doadorId: 'h1', doadorNome: 'X', tipo: 'financeira', valor: 100, descricao: '', data: '2026-03-01', status: 'confirmada', destinacao: 'Geral', ...o })
const exp = (o: Partial<Expense>): Expense => ({ id: 'e', data: '2026-03-02', categoria: 'Alimentação', descricao: 'x', fornecedor: '', valor: 40, status: 'paga', destinacao: '', ...o })

describe('prestação de contas', () => {
  const P = { from: '2026-01-01', to: '2026-12-31' }
  it('soma só dinheiro confirmado e despesas pagas, e calcula o saldo', () => {
    const r = summarizeAccounts(
      [don({ valor: 500 }), don({ valor: 200, status: 'pendente' }), don({ valor: 300, tipo: 'alimento' }), don({ valor: 50, data: '2025-12-31' })],
      [exp({ valor: 120 }), exp({ valor: 80, status: 'pendente' }), exp({ valor: 30, categoria: 'Transporte' })],
      P,
    )
    expect(r.receitas).toBe(500)
    expect(r.despesas).toBe(150)
    expect(r.saldo).toBe(350)
    expect(r.despesasPendentes).toBe(80)
    expect(r.porCategoria[0]).toEqual({ categoria: 'Alimentação', valor: 120 })
  })
})

describe('coleções', () => {
  it('salva, edita, remove e lê de volta, ignorando lixo', () => {
    const a = expenses.save({ data: '2026-01-01', categoria: 'Outros', descricao: 'a', fornecedor: '', valor: 10, status: 'paga', destinacao: '' })
    expenses.save({ ...a, valor: 25 }, a.id)
    expect(expenses.read()).toHaveLength(1)
    expect(expenses.read()[0].valor).toBe(25)
    expenses.remove(a.id)
    expect(expenses.read()).toHaveLength(0)
    localStorage.setItem(expenses.key, '{"nao":"lista"}')
    expect(expenses.read()).toEqual([])
    localStorage.setItem(expenses.key, JSON.stringify([null, 3, { id: 'z', valor: 'abc', status: 'estranho' }]))
    expect(expenses.read()[0]).toMatchObject({ id: 'z', valor: 0, status: 'paga' })
  })
  it('registra as coleções para o backup', () => {
    expect(COLLECTIONS.map((c) => c.key)).toEqual(expect.arrayContaining(['asa_expenses_v1', 'asa_families_v1', 'asa_shifts_v1', 'asa_goals_v1', 'asa_campaigns_v1']))
  })
})

describe('famílias', () => {
  const kid = (id: string, status: Child['status'] = 'ativo'): Child => ({ id, nome: id, idade: 8, responsavel: '', telefone: '', bairro: '', escola: '', status, dataEntrada: '2025-01-01', observacoes: '' })
  it('lista crianças ativas sem família', () => {
    const fam = { id: 'f', criancas: ['a'] } as Family
    expect(childrenWithoutFamily([kid('a'), kid('b'), kid('c', 'concluido')], [fam]).map((c) => c.id)).toEqual(['b'])
  })
})

describe('escala', () => {
  const sh = (o: Partial<Shift>): Shift => ({ id: 's', titulo: 't', data: '2026-03-10', horaInicio: '14:00', horaFim: '16:30', local: '', voluntarios: ['h1'], ...o })
  it('calcula a duração e ignora horários incompletos ou invertidos', () => {
    expect(shiftHours(sh({}))).toBe(2.5)
    expect(shiftHours(sh({ horaFim: '' }))).toBe(0)
    expect(shiftHours(sh({ horaInicio: '16:00', horaFim: '15:00' }))).toBe(0)
  })
  it('soma horas só de turnos já realizados', () => {
    const helpers = [{ id: 'h1', nome: 'Ana' }, { id: 'h2', nome: 'Bia' }] as Helper[]
    const r = hoursByVolunteer([sh({}), sh({ id: 's2', data: '2099-01-01' })], helpers, '2026-06-01')
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ turnos: 1, horas: 2.5 })
  })
  it('detecta conflito de horário do mesmo voluntário', () => {
    const other = sh({})
    expect(findConflicts({ data: '2026-03-10', horaInicio: '15:00', horaFim: '17:00', voluntarios: ['h1', 'h2'] }, [other])).toEqual(['h1'])
    expect(findConflicts({ data: '2026-03-10', horaInicio: '16:30', horaFim: '18:00', voluntarios: ['h1'] }, [other])).toEqual([])
    expect(findConflicts({ data: '2026-03-11', horaInicio: '15:00', horaFim: '17:00', voluntarios: ['h1'] }, [other])).toEqual([])
  })
})

describe('estoque', () => {
  const mv = (tipo: StockMove['tipo'], quantidade: number, itemId = 'i1'): StockMove => ({ id: Math.random().toString(), itemId, data: '2026-01-01', tipo, quantidade, observacao: '' })
  it('saldo = entradas − saídas, por item', () => {
    const moves = [mv('entrada', 10), mv('saida', 3), mv('entrada', 99, 'i2')]
    expect(stockBalance('i1', moves)).toBe(7)
  })
  it('estoque baixo no mínimo ou abaixo', () => {
    expect(isLowStock({ id: 'i', nome: '', categoria: '', unidade: '', minimo: 5 }, 5)).toBe(true)
    expect(isLowStock({ id: 'i', nome: '', categoria: '', unidade: '', minimo: 5 }, 6)).toBe(false)
  })
})

describe('metas', () => {
  const data = {
    children: [{ status: 'ativo' }, { status: 'acompanhamento' }, { status: 'concluido' }] as Child[],
    activities: [{ data: '2026-02-01', participantes: 10 }, { data: '2025-02-01', participantes: 5 }] as Activity[],
    donations: [don({ valor: 300 }), don({ valor: 100, data: '2025-01-01' })],
    helpers: [{ papel: 'voluntario', ativo: true }, { papel: 'voluntario', ativo: false }, { papel: 'doador', ativo: true }] as Helper[],
  }
  const goal = (o: Partial<Goal>): Goal => ({ id: 'g', titulo: '', origem: '', metrica: 'manual', alvo: 10, valorManual: 0, inicio: '', fim: '', ...o })
  it('calcula cada indicador', () => {
    expect(goalProgress(goal({ metrica: 'criancas_ativas' }), data)).toBe(2)
    expect(goalProgress(goal({ metrica: 'voluntarios' }), data)).toBe(1)
    expect(goalProgress(goal({ metrica: 'atividades', inicio: '2026-01-01', fim: '2026-12-31' }), data)).toBe(1)
    expect(goalProgress(goal({ metrica: 'participacoes' }), data)).toBe(15)
    expect(goalProgress(goal({ metrica: 'dinheiro', inicio: '2026-01-01' }), data)).toBe(300)
    expect(goalProgress(goal({ valorManual: 7 }), data)).toBe(7)
  })
  it('percentual limitado a 100 e seguro com alvo zero', () => {
    expect(goalPercent(5, 10)).toBe(50)
    expect(goalPercent(50, 10)).toBe(100)
    expect(goalPercent(5, 0)).toBe(0)
  })
})

describe('campanhas', () => {
  const camp = (o: Partial<Campaign>): Campaign => ({ id: 'c', titulo: 'Material', descricao: '', meta: 1000, destinacao: 'Material escolar', inicio: '2026-01-01', fim: '', publicada: true, ...o })
  it('arrecada só doações financeiras confirmadas da destinação, no período', () => {
    const list = [
      don({ valor: 200, destinacao: 'Material escolar' }),
      don({ valor: 50, destinacao: 'Material escolar', status: 'pendente' }),
      don({ valor: 70, destinacao: 'Geral' }),
      don({ valor: 90, destinacao: 'Material escolar', tipo: 'material' }),
      don({ valor: 40, destinacao: 'Material escolar', data: '2025-12-01' }),
    ]
    expect(campaignRaised(camp({}), list)).toBe(200)
  })
  it('o site só mostra campanhas publicadas, no prazo e com meta', () => {
    const l = [camp({}), camp({ id: '2', publicada: false }), camp({ id: '3', fim: '2026-01-31' }), camp({ id: '4', meta: 0 })]
    expect(publicCampaigns(l, '2026-06-01').map((c) => c.id)).toEqual(['c'])
  })
  it('persiste no localStorage', () => {
    campaigns.save({ titulo: 'T', descricao: '', meta: 10, destinacao: 'x', inicio: '', fim: '', publicada: true })
    expect(campaigns.read()[0].publicada).toBe(true)
  })
})

describe('comunicação', () => {
  it('monta o link do WhatsApp só com telefone válido', () => {
    expect(whatsappLink('(55) 99134-9705', 'Oi')).toBe('https://wa.me/5555991349705?text=Oi')
    expect(whatsappLink('+55 55 99134-9705', 'Oi')).toContain('5555991349705')
    expect(whatsappLink('123', 'Oi')).toBe('')
    expect(whatsappLink('', 'Oi')).toBe('')
  })
  it('personaliza com o primeiro nome', () => {
    expect(personalize('Oi, {nome}! {nome}', 'Maria da Silva')).toBe('Oi, Maria! Maria')
  })
})

describe('permissões dos módulos', () => {
  it('só admin e administrativo acessam os módulos de gestão', () => {
    for (const p of ['despesas', 'familias', 'escala', 'estoque', 'metas', 'comunicacao', 'campanhas'] as const) {
      expect(can('admin', p)).toBe(true)
      expect(can('administrativo', p)).toBe(true)
      expect(can('voluntario', p)).toBe(false)
      expect(can('doador', p)).toBe(false)
    }
  })
  it('voluntário vê só a própria escala', () => {
    expect(can('voluntario', 'minha-escala')).toBe(true)
    expect(can('administrativo', 'minha-escala')).toBe(false)
  })
})
