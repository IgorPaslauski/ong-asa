/**
 * Coleções simples no localStorage para os módulos novos do painel
 * (despesas, famílias, escala, estoque, metas, campanhas).
 * Mesmo contrato das demais: evento `asa:data-changed`, leitura tolerante a registros incompletos.
 */
import { useMemo, useSyncExternalStore } from 'react'
import { uid } from '@/data/mock'

export type Rec = Record<string, unknown>

export const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
export const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}
export const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
export const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback)

function subscribe(cb: () => void) {
  window.addEventListener('asa:data-changed', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('asa:data-changed', cb)
    window.removeEventListener('storage', cb)
  }
}

/** Todas as coleções criadas aqui, para o backup nas configurações. */
export const COLLECTIONS: { name: string; key: string; read: () => unknown[] }[] = []

export function createCollection<T extends { id: string }>(opts: { name: string; key: string; prefix: string; normalize: (r: Rec) => T }) {
  const { name, key, prefix, normalize } = opts
  const EMPTY: T[] = []

  const rawGet = (): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }
  function parse(raw: string | null): T[] {
    if (!raw) return EMPTY
    try {
      const p: unknown = JSON.parse(raw)
      return Array.isArray(p) ? p.filter((x): x is Rec => !!x && typeof x === 'object').map(normalize) : EMPTY
    } catch {
      return EMPTY
    }
  }
  const read = () => parse(rawGet())
  function write(list: T[]) {
    localStorage.setItem(key, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('asa:data-changed', { detail: { key } }))
  }

  COLLECTIONS.push({ name, key, read })

  return {
    key,
    read,
    write,
    /** Hook reativo. */
    useAll(): T[] {
      const raw = useSyncExternalStore(subscribe, rawGet)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return useMemo(() => parse(raw), [raw])
    },
    save(input: Omit<T, 'id'>, id?: string): T {
      const list = read()
      if (id) {
        const next = { ...(list.find((x) => x.id === id) as T), ...input, id } as T
        write(list.map((x) => (x.id === id ? next : x)))
        return next
      }
      const created = { id: uid(prefix), ...input } as T
      write([created, ...list])
      return created
    },
    remove(id: string) {
      write(read().filter((x) => x.id !== id))
    },
  }
}
