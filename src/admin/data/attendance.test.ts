import { describe, expect, it } from 'vitest'
import type { Activity, Child, Donation } from '@/data/mock'
import { can } from '@/lib/auth'
import { buildReceipt, canIssueReceipt, receiptNumber } from '../lib/receipt'
import { attendanceByChild } from './domain'

const child = (id: string, nome: string, dataEntrada: string, status: Child['status'] = 'ativo'): Child => ({
  id, nome, idade: 9, responsavel: '', telefone: '', bairro: '', escola: '', status, dataEntrada, observacoes: '',
})
const act = (id: string, data: string, presentes?: string[]): Activity => ({ id, titulo: id, data, tipo: 'Oficina', participantes: presentes?.length ?? 0, ...(presentes ? { presentes } : {}) })

describe('attendanceByChild', () => {
  const kids = [child('a', 'Ana', '2025-01-01'), child('b', 'Bia', '2025-01-01'), child('n', 'Novo', '2025-06-01'), child('x', 'Fim', '2025-01-01', 'concluido')]
  const acts = [act('1', '2025-02-01', ['a', 'b']), act('2', '2025-03-01', ['a']), act('3', '2025-07-01', ['a', 'n']), act('sem-lista', '2025-04-01')]

  it('ignora atividades sem lista e crianças concluídas', () => {
    const r = attendanceByChild(acts, kids)
    expect(r.map((x) => x.child.id)).not.toContain('x')
    expect(r.find((x) => x.child.id === 'a')).toMatchObject({ present: 3, possible: 3 })
  })
  it('só conta atividades desde a entrada da criança', () => {
    const novo = attendanceByChild(acts, kids).find((x) => x.child.id === 'n')!
    expect(novo).toMatchObject({ present: 1, possible: 1 })
  })
  it('lista primeiro quem tem menor frequência', () => {
    expect(attendanceByChild(acts, kids)[0].child.id).toBe('b')
  })
  it('sem nenhuma lista, ninguém tem atividades possíveis', () => {
    expect(attendanceByChild([act('1', '2025-02-01')], kids).every((x) => x.possible === 0)).toBe(true)
  })
})

describe('recibo', () => {
  const d: Donation = { id: 'dabc123xyz', doadorId: 'h1', doadorNome: 'Ricardo', tipo: 'financeira', valor: 500, descricao: '', data: '2026-03-10', status: 'confirmada', destinacao: 'Geral' }
  it('só doações confirmadas geram recibo', () => {
    expect(canIssueReceipt(d)).toBe(true)
    expect(canIssueReceipt({ status: 'pendente' })).toBe(false)
    expect(canIssueReceipt({ status: 'cancelada' })).toBe(false)
  })
  it('número é estável e leva o ano', () => {
    expect(receiptNumber(d)).toBe('2026-123XYZ')
    expect(receiptNumber(d)).toBe(receiptNumber({ ...d }))
  })
  it('gera um PDF de uma página', () => {
    expect(buildReceipt(d, new Date('2026-03-11T12:00:00')).getNumberOfPages()).toBe(1)
    expect(buildReceipt({ ...d, tipo: 'alimento', descricao: 'Cestas básicas' }).getNumberOfPages()).toBe(1)
  })
})

describe('permissões novas', () => {
  it('só admin e administrativo editam atividades', () => {
    expect(can('admin', 'atividades.editar')).toBe(true)
    expect(can('administrativo', 'atividades.editar')).toBe(true)
    expect(can('voluntario', 'atividades.editar')).toBe(false)
  })
  it('voluntário tem início próprio', () => {
    expect(can('voluntario', 'inicio')).toBe(true)
    expect(can('doador', 'inicio')).toBe(false)
  })
})
