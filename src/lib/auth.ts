/**
 * Usuários, perfis e permissões do painel (MVP de demonstração).
 *
 * ATENÇÃO: tudo vive no navegador (localStorage). O controle de acesso aqui define
 * o que cada perfil VÊ na interface, mas não é uma barreira de segurança real:
 * quem abrir o DevTools consegue ler os dados. Para uso em produção, a autenticação
 * e as regras por perfil precisam ir para um servidor (ex.: Supabase com RLS).
 * Esta camada fica isolada aqui justamente para ser trocada depois.
 */
import { useMemo, useSyncExternalStore } from 'react'
import { uid } from '@/data/mock'

export type Role = 'admin' | 'administrativo' | 'voluntario' | 'doador'

export const ROLES: Role[] = ['admin', 'administrativo', 'voluntario', 'doador']

export const ROLE_NAME: Record<Role, string> = {
  admin: 'Administrador',
  administrativo: 'Pessoal administrativo',
  voluntario: 'Voluntário',
  doador: 'Doador',
}

export const ROLE_SUMMARY: Record<Role, string> = {
  admin: 'Acesso total, incluindo cadastro de usuários e configurações.',
  administrativo: 'Crianças e famílias, rede de apoio, doações, despesas, escala, estoque, metas, campanhas, comunicação, eventos, atividades e relatórios.',
  voluntario: 'Consulta eventos, atividades e a própria escala. Não vê dados de crianças nem financeiros.',
  doador: 'Vê apenas as próprias doações.',
}

export type Permission =
  | 'dashboard'
  | 'inicio'
  | 'despesas'
  | 'familias'
  | 'escala'
  | 'estoque'
  | 'metas'
  | 'comunicacao'
  | 'campanhas'
  | 'minha-escala'
  | 'criancas'
  | 'rede'
  | 'candidaturas'
  | 'doacoes'
  | 'eventos.ver'
  | 'eventos.editar'
  | 'atividades'
  | 'atividades.editar'
  | 'relatorios'
  | 'usuarios'
  | 'configuracoes'
  | 'minhas-doacoes'

const PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ['dashboard', 'criancas', 'rede', 'candidaturas', 'doacoes', 'eventos.ver', 'eventos.editar', 'atividades', 'atividades.editar', 'relatorios', 'despesas', 'familias', 'escala', 'estoque', 'metas', 'comunicacao', 'campanhas', 'usuarios', 'configuracoes'],
  administrativo: ['dashboard', 'criancas', 'rede', 'candidaturas', 'doacoes', 'eventos.ver', 'eventos.editar', 'atividades', 'atividades.editar', 'relatorios', 'despesas', 'familias', 'escala', 'estoque', 'metas', 'comunicacao', 'campanhas'],
  voluntario: ['inicio', 'eventos.ver', 'atividades', 'minha-escala'],
  doador: ['minhas-doacoes'],
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && PERMISSIONS[role].includes(permission)
}

/** Primeira tela de cada perfil depois do login. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/painel/visao-geral',
  administrativo: '/painel/visao-geral',
  voluntario: '/painel/inicio',
  doador: '/painel/minhas-doacoes',
}

export interface AppUser {
  id: string
  nome: string
  email: string
  perfil: Role
  /** Cadastro da rede de apoio ligado a esta conta (usado pelo doador para achar as próprias doações). */
  helperId: string
  ativo: boolean
  criadoEm: string
  ultimoAcesso: string
  /** Senha embaralhada (demonstração). */
  senha: string
}

const USERS_KEY = 'asa_users_v1'
const SESSION_KEY = 'asa_session_v2'

/**
 * Embaralhamento simples (cyrb53) só para não gravar a senha em texto puro no localStorage.
 * NÃO é criptografia de verdade: em produção use hash no servidor (bcrypt/argon2).
 */
export function scramble(value: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export const MIN_PASSWORD = 6
export const DEMO_PASSWORD = 'asa2025'

const normEmail = (e: string) => e.trim().toLowerCase()

function seedUsers(): AppUser[] {
  const base = { ativo: true, criadoEm: '2025-01-01', ultimoAcesso: '', senha: scramble(DEMO_PASSWORD) }
  return [
    { ...base, id: 'u-admin', nome: 'Administrador A.S.A.', email: 'admin@asa-condor.org.br', perfil: 'admin', helperId: '' },
    { ...base, id: 'u-adm', nome: 'Equipe administrativa', email: 'administrativo@asa-condor.org.br', perfil: 'administrativo', helperId: '' },
    { ...base, id: 'u-vol', nome: 'Camila Ferreira', email: 'voluntario@asa-condor.org.br', perfil: 'voluntario', helperId: 'h1' },
    { ...base, id: 'u-doa', nome: 'Ricardo Almeida', email: 'doador@asa-condor.org.br', perfil: 'doador', helperId: 'h2' },
  ]
}

export const DEMO_ACCOUNTS = seedUsers().map((u) => ({ email: u.email, perfil: u.perfil, nome: u.nome }))

function readUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return seedUsers()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedUsers()
    return parsed
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((r) => ({
        id: String(r.id ?? ''),
        nome: String(r.nome ?? ''),
        email: String(r.email ?? ''),
        perfil: (ROLES as string[]).includes(String(r.perfil)) ? (r.perfil as Role) : 'voluntario',
        helperId: String(r.helperId ?? ''),
        ativo: r.ativo !== false,
        criadoEm: String(r.criadoEm ?? ''),
        ultimoAcesso: String(r.ultimoAcesso ?? ''),
        senha: String(r.senha ?? ''),
      }))
  } catch {
    return seedUsers()
  }
}

function emit() {
  window.dispatchEvent(new CustomEvent('asa:auth-changed'))
}

function writeUsers(list: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list))
  emit()
}

export function getUsers(): AppUser[] {
  return readUsers()
}

/* --------------------------------- Sessão --------------------------------- */

export function getSessionUserId(): string {
  try {
    return localStorage.getItem(SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Usuário logado (precisa existir e estar ativo; senão a sessão é considerada inválida). */
export function getSessionUser(): AppUser | null {
  const id = getSessionUserId()
  if (!id) return null
  const user = readUsers().find((u) => u.id === id)
  return user && user.ativo ? user : null
}

export function isAuthenticated(): boolean {
  return getSessionUser() !== null
}

export type LoginResult = { ok: true; user: AppUser } | { ok: false; reason: 'invalid' | 'inactive' }

export function login(email: string, password: string): LoginResult {
  const list = readUsers()
  const user = list.find((u) => normEmail(u.email) === normEmail(email))
  if (!user || user.senha !== scramble(password)) return { ok: false, reason: 'invalid' }
  if (!user.ativo) return { ok: false, reason: 'inactive' }
  // Persiste os usuários (inclusive os de exemplo) no primeiro acesso, registrando o último acesso.
  writeUsers(list.map((u) => (u.id === user.id ? { ...u, ultimoAcesso: new Date().toISOString() } : u)))
  localStorage.setItem(SESSION_KEY, user.id)
  emit()
  return { ok: true, user }
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* noop */
  }
  emit()
}

/* ---------------------------- Cadastro de usuários -------------------------- */

export interface UserInput {
  nome: string
  email: string
  perfil: Role
  helperId: string
  ativo: boolean
  /** Obrigatória ao criar; ao editar, vazia = manter a atual. */
  senha: string
}

export type UserError = 'email-duplicado' | 'ultimo-admin' | 'si-mesmo' | 'senha-curta' | 'nao-encontrado'

export type UserResult = { ok: true; user: AppUser } | { ok: false; error: UserError }

export const USER_ERROR_MESSAGE: Record<UserError, string> = {
  'email-duplicado': 'Já existe um usuário com este e-mail.',
  'ultimo-admin': 'Mantenha pelo menos um administrador ativo.',
  'si-mesmo': 'Você não pode desativar nem remover a própria conta, nem trocar o próprio perfil.',
  'senha-curta': `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`,
  'nao-encontrado': 'Usuário não encontrado.',
}

const activeAdmins = (list: AppUser[]) => list.filter((u) => u.perfil === 'admin' && u.ativo)

export const usersRepo = {
  save(input: UserInput, id?: string): UserResult {
    const list = readUsers()
    const email = input.email.trim()
    if (list.some((u) => u.id !== id && normEmail(u.email) === normEmail(email))) return { ok: false, error: 'email-duplicado' }
    const helperId = input.perfil === 'doador' || input.perfil === 'voluntario' ? input.helperId : ''

    if (!id) {
      if (input.senha.length < MIN_PASSWORD) return { ok: false, error: 'senha-curta' }
      const created: AppUser = {
        id: uid('u'),
        nome: input.nome.trim(),
        email,
        perfil: input.perfil,
        helperId,
        ativo: input.ativo,
        criadoEm: new Date().toISOString().slice(0, 10),
        ultimoAcesso: '',
        senha: scramble(input.senha),
      }
      writeUsers([created, ...list])
      return { ok: true, user: created }
    }

    const current = list.find((u) => u.id === id)
    if (!current) return { ok: false, error: 'nao-encontrado' }
    if (input.senha && input.senha.length < MIN_PASSWORD) return { ok: false, error: 'senha-curta' }
    const self = getSessionUserId() === id
    if (self && (!input.ativo || input.perfil !== current.perfil)) return { ok: false, error: 'si-mesmo' }
    const next: AppUser = {
      ...current,
      nome: input.nome.trim(),
      email,
      perfil: input.perfil,
      helperId,
      ativo: input.ativo,
      senha: input.senha ? scramble(input.senha) : current.senha,
    }
    const after = list.map((u) => (u.id === id ? next : u))
    if (activeAdmins(after).length === 0) return { ok: false, error: 'ultimo-admin' }
    writeUsers(after)
    return { ok: true, user: next }
  },

  setActive(id: string, ativo: boolean): UserResult {
    const list = readUsers()
    const current = list.find((u) => u.id === id)
    if (!current) return { ok: false, error: 'nao-encontrado' }
    if (!ativo && getSessionUserId() === id) return { ok: false, error: 'si-mesmo' }
    const next = { ...current, ativo }
    const after = list.map((u) => (u.id === id ? next : u))
    if (activeAdmins(after).length === 0) return { ok: false, error: 'ultimo-admin' }
    writeUsers(after)
    return { ok: true, user: next }
  },

  remove(id: string): UserResult {
    const list = readUsers()
    const current = list.find((u) => u.id === id)
    if (!current) return { ok: false, error: 'nao-encontrado' }
    if (getSessionUserId() === id) return { ok: false, error: 'si-mesmo' }
    const after = list.filter((u) => u.id !== id)
    if (activeAdmins(after).length === 0) return { ok: false, error: 'ultimo-admin' }
    writeUsers(after)
    return { ok: true, user: current }
  },

  /** Volta ao conjunto de exemplo (usado nas configurações). */
  reset() {
    localStorage.removeItem(USERS_KEY)
    emit()
  },
}

/* ---------------------------------- Hooks --------------------------------- */

function subscribe(cb: () => void) {
  window.addEventListener('asa:auth-changed', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('asa:auth-changed', cb)
    window.removeEventListener('storage', cb)
  }
}

function snap(key: string) {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export function useUsers(): AppUser[] {
  const raw = useSyncExternalStore(subscribe, () => snap(USERS_KEY))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readUsers(), [raw])
}

/** Usuário logado, reativo (muda se a conta for desativada ou o perfil alterado). */
export function useSessionUser(): AppUser | null {
  const sid = useSyncExternalStore(subscribe, () => snap(SESSION_KEY))
  const raw = useSyncExternalStore(subscribe, () => snap(USERS_KEY))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (sid ? (readUsers().find((u) => u.id === sid && u.ativo) ?? null) : null), [sid, raw])
}
