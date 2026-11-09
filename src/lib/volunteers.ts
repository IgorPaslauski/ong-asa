import { useMemo, useSyncExternalStore } from 'react'
import { uid } from '../data/mock'
import { ORG } from '../data/org'
import { STORAGE_KEYS } from './storage'

/** Candidatura de voluntariado enviada pelo formulário público. */
export interface VolunteerApplication {
  id: string
  nome: string
  profissao: string
  telefone: string
  contribuicoes: string[]
  disponibilidade: string[]
  mensagem: string
  /** AAAA-MM-DD */
  data: string
  status: 'nova' | 'contatada' | 'aprovada'
}

export const CONTRIBUTIONS = [
  'Reforço escolar',
  'Informática e inclusão digital',
  'Música (violão)',
  'Dança',
  'Artesanato',
  'Esporte e recreação',
  'Cozinha e alimentação',
  'Organização de eventos',
  'Comunicação, design e redes sociais',
  'Arrecadação e parcerias',
  'Apoio administrativo',
  'Transporte',
  'Outro',
] as const

export const AVAILABILITY = ['Manhã', 'Tarde', 'Noite', 'Fins de semana'] as const

const KEY = STORAGE_KEYS.volunteerApps

const isStr = (v: unknown): v is string => typeof v === 'string'
const strList = (v: unknown) => (Array.isArray(v) ? v.filter(isStr) : [])

export function normalizeApplication(r: Record<string, unknown>): VolunteerApplication {
  const status = r.status === 'contatada' || r.status === 'aprovada' ? r.status : 'nova'
  return {
    id: isStr(r.id) ? r.id : '',
    nome: isStr(r.nome) ? r.nome : '',
    profissao: isStr(r.profissao) ? r.profissao : '',
    telefone: isStr(r.telefone) ? r.telefone : '',
    contribuicoes: strList(r.contribuicoes),
    disponibilidade: strList(r.disponibilidade),
    mensagem: isStr(r.mensagem) ? r.mensagem : '',
    data: isStr(r.data) ? r.data : '',
    status,
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function getApplications(): VolunteerApplication[] {
  try {
    const parsed: unknown = JSON.parse(readRaw() ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map(normalizeApplication)
  } catch {
    return []
  }
}

function setApplications(items: VolunteerApplication[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('asa:data-changed', { detail: { key: KEY } }))
}

export type ApplicationInput = Omit<VolunteerApplication, 'id' | 'data' | 'status'>

export const applicationsRepo = {
  add(input: ApplicationInput): VolunteerApplication {
    const created: VolunteerApplication = {
      ...input,
      id: uid('v'),
      data: new Date().toISOString().slice(0, 10),
      status: 'nova',
    }
    setApplications([created, ...getApplications()])
    return created
  },
  setStatus(id: string, status: VolunteerApplication['status']) {
    setApplications(getApplications().map((a) => (a.id === id ? { ...a, status } : a)))
  },
  remove(id: string) {
    setApplications(getApplications().filter((a) => a.id !== id))
  },
}

function subscribe(callback: () => void) {
  window.addEventListener('asa:data-changed', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('asa:data-changed', callback)
    window.removeEventListener('storage', callback)
  }
}

export function useApplications(): VolunteerApplication[] {
  const raw = useSyncExternalStore(subscribe, readRaw)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getApplications(), [raw])
}

/** Máscara de telefone brasileiro: (55) 99999-9999 ou (55) 3333-3333. */
export function maskPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const isValidPhone = (value: string) => {
  const n = value.replace(/\D/g, '').length
  return n === 10 || n === 11
}

/** Mensagem pronta para enviar à equipe pelo WhatsApp com os dados da candidatura. */
export function applicationMessage(a: ApplicationInput) {
  return [
    `Olá! Acabei de me candidatar como voluntário(a) no site da ${ORG.shortName}.`,
    `Nome: ${a.nome}`,
    `Profissão: ${a.profissao}`,
    `Telefone: ${a.telefone}`,
    `Posso ajudar com: ${a.contribuicoes.join(', ')}`,
    a.disponibilidade.length ? `Disponibilidade: ${a.disponibilidade.join(', ')}` : '',
    a.mensagem ? `Recado: ${a.mensagem}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
