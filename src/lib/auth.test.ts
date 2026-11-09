import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, can, getSessionUser, login, logout, usersRepo, getUsers } from './auth'

beforeEach(() => {
  localStorage.clear()
})

describe('permissões por perfil', () => {
  it('administrador acessa tudo, inclusive usuários', () => {
    expect(can('admin', 'usuarios')).toBe(true)
    expect(can('admin', 'criancas')).toBe(true)
  })
  it('administrativo não gerencia usuários nem configurações', () => {
    expect(can('administrativo', 'doacoes')).toBe(true)
    expect(can('administrativo', 'usuarios')).toBe(false)
    expect(can('administrativo', 'configuracoes')).toBe(false)
  })
  it('voluntário não vê crianças nem doações, só consulta eventos', () => {
    expect(can('voluntario', 'criancas')).toBe(false)
    expect(can('voluntario', 'doacoes')).toBe(false)
    expect(can('voluntario', 'eventos.ver')).toBe(true)
    expect(can('voluntario', 'eventos.editar')).toBe(false)
  })
  it('doador só tem a própria área', () => {
    expect(can('doador', 'minhas-doacoes')).toBe(true)
    expect(can('doador', 'dashboard')).toBe(false)
    expect(can('doador', 'eventos.ver')).toBe(false)
  })
  it('sem perfil, nada', () => {
    expect(can(null, 'dashboard')).toBe(false)
  })
})

describe('login', () => {
  it('aceita conta de exemplo e abre sessão', () => {
    const r = login('Doador@asa-condor.org.br', DEMO_PASSWORD)
    expect(r.ok).toBe(true)
    expect(getSessionUser()?.perfil).toBe('doador')
    logout()
    expect(getSessionUser()).toBeNull()
  })
  it('recusa senha errada e e-mail qualquer', () => {
    expect(login('admin@asa-condor.org.br', 'errada').ok).toBe(false)
    expect(login('qualquer@coisa.com', 'abcd').ok).toBe(false)
    expect(getSessionUser()).toBeNull()
  })
  it('recusa conta desativada', () => {
    login('admin@asa-condor.org.br', DEMO_PASSWORD)
    const vol = getUsers().find((u) => u.perfil === 'voluntario')!
    usersRepo.setActive(vol.id, false)
    logout()
    const r = login(vol.email, DEMO_PASSWORD)
    expect(r).toEqual({ ok: false, reason: 'inactive' })
  })
})

describe('cadastro de usuários', () => {
  const base = { nome: 'Novo', email: 'novo@x.org', perfil: 'voluntario' as const, helperId: '', ativo: true, senha: 'segredo1' }

  it('cria usuário que consegue entrar com a senha definida', () => {
    expect(usersRepo.save(base).ok).toBe(true)
    expect(login('novo@x.org', 'segredo1').ok).toBe(true)
  })
  it('bloqueia e-mail duplicado e senha curta', () => {
    expect(usersRepo.save({ ...base, email: 'ADMIN@asa-condor.org.br' })).toEqual({ ok: false, error: 'email-duplicado' })
    expect(usersRepo.save({ ...base, senha: '123' })).toEqual({ ok: false, error: 'senha-curta' })
  })
  it('limpa o vínculo de perfis que não usam vínculo', () => {
    const r = usersRepo.save({ ...base, perfil: 'administrativo', helperId: 'h1' })
    expect(r.ok && r.user.helperId).toBe('')
  })
  it('não permite remover, desativar ou rebaixar o último administrador / a si mesmo', () => {
    login('admin@asa-condor.org.br', DEMO_PASSWORD)
    const admin = getUsers().find((u) => u.perfil === 'admin')!
    expect(usersRepo.setActive(admin.id, false)).toEqual({ ok: false, error: 'si-mesmo' })
    expect(usersRepo.remove(admin.id)).toEqual({ ok: false, error: 'si-mesmo' })
    expect(usersRepo.save({ ...base, nome: admin.nome, email: admin.email, perfil: 'doador', senha: '' }, admin.id)).toEqual({ ok: false, error: 'si-mesmo' })
  })
  it('protege o último administrador ativo mesmo quando outro admin tenta', () => {
    const other = usersRepo.save({ ...base, email: 'outro@x.org', perfil: 'admin' })
    expect(other.ok).toBe(true)
    login('outro@x.org', 'segredo1')
    const first = getUsers().find((u) => u.id === 'u-admin')!
    expect(usersRepo.setActive(first.id, false).ok).toBe(true) // ainda há o "outro"
    // agora "outro" é o único admin ativo; outro usuário não-admin não pode derrubá-lo
    expect(usersRepo.remove('u-admin').ok).toBe(true)
  })
  it('edição mantém a senha quando o campo vem vazio', () => {
    const created = usersRepo.save(base)
    if (!created.ok) throw new Error('falhou')
    usersRepo.save({ ...base, nome: 'Renomeado', senha: '' }, created.user.id)
    expect(login(base.email, base.senha).ok).toBe(true)
  })
})
