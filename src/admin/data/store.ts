/**
 * Camada de dados do admin sobre o armazenamento existente (`src/lib/storage.ts`).
 * NÃO altera chaves nem formato dos registros: o site público lê os mesmos dados.
 * Os hooks assinam o evento `asa:data-changed` (mesma aba) e `storage` (outras abas).
 */
import { useMemo, useSyncExternalStore } from 'react'
import {
  INITIAL_ACTIVITIES,
  INITIAL_CHILDREN,
  INITIAL_DONATIONS,
  INITIAL_HELPERS,
  uid,
  type Activity,
  type Child,
  type Donation,
  type Helper,
} from '@/data/mock'
import {
  STORAGE_KEYS,
  getChildren,
  getDonations,
  getHelpers,
  setChildren,
  setDonations,
  setHelpers,
} from '@/lib/storage'

function subscribe(callback: () => void) {
  window.addEventListener('asa:data-changed', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('asa:data-changed', callback)
    window.removeEventListener('storage', callback)
  }
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/* Normalização na LEITURA: registros antigos ou incompletos ganham valores neutros
 * para campos ausentes, sem reescrever o que está salvo e sem inventar dados. */
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback

type Rec = Record<string, unknown>

export function normalizeChild(r: Rec): Child {
  return {
    id: str(r.id), nome: str(r.nome), idade: num(r.idade), responsavel: str(r.responsavel), telefone: str(r.telefone),
    bairro: str(r.bairro), escola: str(r.escola), status: oneOf(r.status, ['ativo', 'acompanhamento', 'concluido'], 'ativo'),
    dataEntrada: str(r.dataEntrada), observacoes: str(r.observacoes),
  }
}
export function normalizeHelper(r: Rec): Helper {
  return {
    id: str(r.id), nome: str(r.nome), email: str(r.email), telefone: str(r.telefone),
    papel: oneOf(r.papel, ['voluntario', 'doador', 'padrinho', 'parceiro'], 'voluntario'),
    cidade: str(r.cidade), desde: str(r.desde), ativo: r.ativo !== false,
  }
}
export function normalizeDonation(r: Rec): Donation {
  return {
    id: str(r.id), doadorId: str(r.doadorId), doadorNome: str(r.doadorNome),
    tipo: oneOf(r.tipo, ['financeira', 'alimento', 'roupa', 'material', 'servico'], 'financeira'),
    valor: num(r.valor), descricao: str(r.descricao), data: str(r.data),
    status: oneOf(r.status, ['confirmada', 'pendente', 'cancelada'], 'pendente'), destinacao: str(r.destinacao),
  }
}
export function normalizeActivity(r: Rec): Activity {
  return { id: str(r.id), titulo: str(r.titulo), data: str(r.data), tipo: str(r.tipo), participantes: num(r.participantes) }
}

function useStored<T>(key: string, fallback: T[], normalize: (r: Rec) => T): T[] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key))
  return useMemo(() => {
    if (!raw) return fallback
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return fallback
      return parsed.filter((x): x is Rec => !!x && typeof x === 'object').map(normalize)
    } catch {
      return fallback
    }
  }, [raw, fallback, normalize])
}

export const useChildren = () => useStored<Child>(STORAGE_KEYS.children, INITIAL_CHILDREN, normalizeChild)
export const useHelpers = () => useStored<Helper>(STORAGE_KEYS.helpers, INITIAL_HELPERS, normalizeHelper)
export const useDonations = () => useStored<Donation>(STORAGE_KEYS.donations, INITIAL_DONATIONS, normalizeDonation)
export const useActivities = () => useStored<Activity>(STORAGE_KEYS.activities, INITIAL_ACTIVITIES, normalizeActivity)

/* ------------------------------ Mutações (CRUD) ----------------------------- */

export type ChildInput = Omit<Child, 'id'>
export type HelperInput = Omit<Helper, 'id'>
export type DonationInput = Omit<Donation, 'id'>

export const childrenRepo = {
  save(input: ChildInput, id?: string): Child {
    const list = getChildren()
    if (id) {
      const current = list.find((c) => c.id === id)
      const next = { ...(current as Child), ...input, id }
      setChildren(list.map((c) => (c.id === id ? next : c)))
      return next
    }
    const created: Child = { id: uid('c'), ...input }
    setChildren([created, ...list])
    return created
  },
  remove(id: string) {
    setChildren(getChildren().filter((c) => c.id !== id))
  },
  setStatus(id: string, status: Child['status']) {
    setChildren(getChildren().map((c) => (c.id === id ? { ...c, status } : c)))
  },
}

export const helpersRepo = {
  save(input: HelperInput, id?: string): Helper {
    const list = getHelpers()
    if (id) {
      const current = list.find((h) => h.id === id)
      const next = { ...(current as Helper), ...input, id }
      setHelpers(list.map((h) => (h.id === id ? next : h)))
      return next
    }
    const created: Helper = { id: uid('h'), ...input }
    setHelpers([created, ...list])
    return created
  },
  remove(id: string) {
    setHelpers(getHelpers().filter((h) => h.id !== id))
  },
  setActive(id: string, ativo: boolean) {
    setHelpers(getHelpers().map((h) => (h.id === id ? { ...h, ativo } : h)))
  },
}

export const donationsRepo = {
  save(input: DonationInput, id?: string): Donation {
    const list = getDonations()
    if (id) {
      const current = list.find((d) => d.id === id)
      const next = { ...(current as Donation), ...input, id }
      setDonations(list.map((d) => (d.id === id ? next : d)))
      return next
    }
    const created: Donation = { id: uid('d'), ...input }
    setDonations([created, ...list])
    return created
  },
  remove(id: string) {
    setDonations(getDonations().filter((d) => d.id !== id))
  },
  setStatus(id: string, status: Donation['status']) {
    setDonations(getDonations().map((d) => (d.id === id ? { ...d, status } : d)))
  },
}
