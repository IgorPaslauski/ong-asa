import { describe, expect, it } from 'vitest'
import { ageBandOf, childSchema, timeInProgram } from './children/schema'
import { donationSchema } from './donations/schema'

const child = { nome: 'Ana', idade: 8, responsavel: 'Maria', telefone: '', bairro: '', escola: '', status: 'ativo', dataEntrada: '2026-01-01', observacoes: '' }

describe('validação do cadastro de crianças (regras originais preservadas)', () => {
  it('aceita um cadastro mínimo válido', () => {
    expect(childSchema.safeParse(child).success).toBe(true)
  })
  it('exige nome e responsável', () => {
    expect(childSchema.safeParse({ ...child, nome: '  ' }).success).toBe(false)
    expect(childSchema.safeParse({ ...child, responsavel: '' }).success).toBe(false)
  })
  it('limita a idade entre 0 e 18', () => {
    expect(childSchema.safeParse({ ...child, idade: -1 }).success).toBe(false)
    expect(childSchema.safeParse({ ...child, idade: 19 }).success).toBe(false)
    expect(childSchema.safeParse({ ...child, idade: 0 }).success).toBe(true)
    expect(childSchema.safeParse({ ...child, idade: 18 }).success).toBe(true)
    expect(childSchema.safeParse({ ...child, idade: 7.5 }).success).toBe(false)
  })
  it('calcula faixa etária e tempo no programa', () => {
    expect(ageBandOf(5)).toBe('primeira-infancia')
    expect(ageBandOf(6)).toBe('infancia')
    expect(ageBandOf(14)).toBe('adolescencia-inicial')
    expect(ageBandOf(18)).toBe('adolescencia')
    expect(timeInProgram('2025-03-12', new Date(2026, 10, 9))).toBe('1 ano e 7 meses')
    expect(timeInProgram('2026-11-01', new Date(2026, 10, 9))).toBe('menos de 1 mês')
  })
})

describe('validação de doações', () => {
  const donation = { doadorId: 'h1', tipo: 'financeira', valor: 10, descricao: '', data: '2026-01-01', status: 'confirmada', destinacao: 'Geral' }
  it('aceita valor zero mas não negativo', () => {
    expect(donationSchema.safeParse({ ...donation, valor: 0 }).success).toBe(true)
    expect(donationSchema.safeParse({ ...donation, valor: -1 }).success).toBe(false)
  })
  it('exige doador e destinação', () => {
    expect(donationSchema.safeParse({ ...donation, doadorId: '' }).success).toBe(false)
    expect(donationSchema.safeParse({ ...donation, destinacao: ' ' }).success).toBe(false)
  })
})
