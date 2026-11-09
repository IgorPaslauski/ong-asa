import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_CHILDREN, INITIAL_DONATIONS, INITIAL_HELPERS, type Child } from '@/data/mock'
import { STORAGE_KEYS, getChildren, getDonations, getHelpers } from '@/lib/storage'
import { childrenRepo, donationsRepo, helpersRepo } from './store'

const input = {
  nome: 'Teste',
  idade: 10,
  responsavel: 'Resp',
  telefone: '',
  bairro: 'Centro',
  escola: '',
  status: 'ativo' as const,
  dataEntrada: '2026-01-01',
  observacoes: '',
}

describe('repositório do admin sobre o armazenamento existente', () => {
  beforeEach(() => localStorage.clear())

  it('mantém as chaves e o formato dos dados lidos pelo site público', () => {
    expect(STORAGE_KEYS).toMatchObject({
      children: 'asa_children_v3',
      helpers: 'asa_helpers_v3',
      donations: 'asa_donations_v3',
      activities: 'asa_activities_v3',
    })
    childrenRepo.save(input)
    const raw = JSON.parse(localStorage.getItem('asa_children_v3')!) as Child[]
    expect(Array.isArray(raw)).toBe(true)
    expect(Object.keys(raw[0]).sort()).toEqual(['bairro', 'dataEntrada', 'escola', 'id', 'idade', 'nome', 'observacoes', 'responsavel', 'status', 'telefone'])
  })

  it('preserva registros existentes ao criar, editar e remover', () => {
    localStorage.setItem(STORAGE_KEYS.children, JSON.stringify(INITIAL_CHILDREN))
    const created = childrenRepo.save(input)
    expect(getChildren()).toHaveLength(INITIAL_CHILDREN.length + 1)
    childrenRepo.save({ ...input, nome: 'Editado' }, created.id)
    expect(getChildren().find((c) => c.id === created.id)?.nome).toBe('Editado')
    expect(getChildren().filter((c) => c.id !== created.id)).toEqual(INITIAL_CHILDREN)
    childrenRepo.remove(created.id)
    expect(getChildren()).toEqual(INITIAL_CHILDREN)
  })

  it('não grava nada ao apenas ler (o seed é só leitura)', () => {
    expect(getHelpers()).toEqual(INITIAL_HELPERS)
    expect(localStorage.getItem(STORAGE_KEYS.helpers)).toBeNull()
  })

  it('altera a situação sem mexer em outros campos', () => {
    const first = INITIAL_DONATIONS[0]
    donationsRepo.save({ ...first, status: 'pendente' }, first.id)
    const before = getDonations().find((d) => d.id === first.id)!
    donationsRepo.setStatus(before.id, 'confirmada')
    const after = getDonations().find((d) => d.id === before.id)!
    expect(after).toEqual({ ...before, status: 'confirmada' })
  })

  it('ativa e desativa apoiadores', () => {
    const h = helpersRepo.save({ nome: 'X', email: 'x@x.com', telefone: '', papel: 'doador', cidade: '', desde: '2026-01-01', ativo: true })
    helpersRepo.setActive(h.id, false)
    expect(getHelpers().find((x) => x.id === h.id)?.ativo).toBe(false)
  })
})

import { normalizeChild, normalizeDonation } from './store'

describe('normalização na leitura', () => {
  it('completa campos ausentes sem lançar erro', () => {
    const c = normalizeChild({ id: 'x', nome: 'Fulano' })
    expect(c).toMatchObject({ idade: 0, status: 'ativo', dataEntrada: '', bairro: '' })
    const d = normalizeDonation({ id: 'd', valor: 'abc', tipo: 'zzz' })
    expect(d).toMatchObject({ valor: 0, tipo: 'financeira', status: 'pendente', data: '', destinacao: '' })
  })
})
