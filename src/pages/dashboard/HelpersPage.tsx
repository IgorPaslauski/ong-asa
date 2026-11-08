import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Drawer from '../../components/Drawer'
import {
  ROLE_LABEL,
  type Helper,
  type HelperRole,
  formatDate,
  uid,
} from '../../data/mock'
import { getHelpers, setHelpers } from '../../lib/storage'

const emptyForm = {
  nome: '',
  email: '',
  telefone: '',
  papel: 'voluntario' as HelperRole,
  cidade: 'São Paulo',
  desde: new Date().toISOString().slice(0, 10),
  ativo: true,
}

export default function HelpersPage() {
  const [items, setItems] = useState<Helper[]>(() => getHelpers())
  const [query, setQuery] = useState('')
  const [papel, setPapel] = useState<'todos' | HelperRole>('todos')
  const [onlyActive, setOnlyActive] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Helper | null>(null)
  const [form, setForm] = useState(emptyForm)

  const counts = useMemo(() => {
    const base: Record<string, number> = {
      todos: items.length,
      voluntario: 0,
      doador: 0,
      padrinho: 0,
      parceiro: 0,
    }
    for (const h of items) base[h.papel] += 1
    return base
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((h) => {
      const q = query.toLowerCase().trim()
      const matchQ =
        !q ||
        h.nome.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        h.cidade.toLowerCase().includes(q)
      const matchP = papel === 'todos' || h.papel === papel
      const matchA = !onlyActive || h.ativo
      return matchQ && matchP && matchA
    })
  }, [items, query, papel, onlyActive])

  function persist(next: Helper[]) {
    setItems(next)
    setHelpers(next)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(helper: Helper) {
    setEditing(helper)
    setForm({
      nome: helper.nome,
      email: helper.email,
      telefone: helper.telefone,
      papel: helper.papel,
      cidade: helper.cidade,
      desde: helper.desde,
      ativo: helper.ativo,
    })
    setOpen(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) {
      persist(items.map((h) => (h.id === editing.id ? { ...editing, ...form } : h)))
    } else {
      persist([{ id: uid('h'), ...form }, ...items])
    }
    setOpen(false)
  }

  function remove(id: string) {
    if (!confirm('Remover este cadastro?')) return
    persist(items.filter((h) => h.id !== id))
  }

  function toggleActive(id: string) {
    persist(items.map((h) => (h.id === id ? { ...h, ativo: !h.ativo } : h)))
  }

  return (
    <div className="dash-page">
      <div className="registry-head">
        <div>
          <p className="eyebrow">Cadastros</p>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)', fontSize: 'clamp(1.55rem, 3vw, 2rem)', margin: 0 }}>
            Quem ajuda
          </h1>
          <p className="muted">Voluntários, doadores, padrinhos e parceiros — com ativação rápida.</p>
        </div>
        <button className="btn btn-dark btn-sm" type="button" onClick={openCreate}>
          + Nova pessoa
        </button>
      </div>

      <div className="chip-row">
        {(
          [
            ['todos', 'Todos'],
            ['voluntario', 'Voluntários'],
            ['doador', 'Doadores'],
            ['padrinho', 'Padrinhos'],
            ['parceiro', 'Parceiros'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip${papel === key ? ' is-on' : ''}`}
            onClick={() => setPapel(key)}
          >
            {label}
            <span className="count">{counts[key]}</span>
          </button>
        ))}
        <button
          type="button"
          className={`chip${onlyActive ? ' is-on' : ''}`}
          onClick={() => setOnlyActive((v) => !v)}
        >
          Só ativos
        </button>
      </div>

      <div className="toolbar smart">
        <div className="field">
          <label htmlFor="hq">Buscar</label>
          <input
            id="hq"
            placeholder="Nome, e-mail ou cidade"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="result-meta">
        <span>
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Papel</th>
              <th>Contato</th>
              <th>Desde</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id}>
                <td>
                  <strong>{h.nome}</strong>
                  <div className="muted tiny">{h.cidade}</div>
                </td>
                <td>{ROLE_LABEL[h.papel]}</td>
                <td>
                  {h.email}
                  <div className="muted tiny">{h.telefone}</div>
                </td>
                <td>{formatDate(h.desde)}</td>
                <td>
                  <button
                    type="button"
                    className={`badge ${h.ativo ? 'badge-ok' : 'badge-muted'}`}
                    onClick={() => toggleActive(h.id)}
                    title="Clique para alternar"
                  >
                    {h.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost-dark btn-sm" type="button" onClick={() => openEdit(h)}>
                      Editar
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(h.id)}>
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <div className="empty">Nenhum cadastro encontrado.</div> : null}
      </div>

      {open ? (
        <Drawer
          title={editing ? 'Editar pessoa' : 'Nova pessoa'}
          subtitle="Cadastro unificado da rede de apoio."
          onClose={() => setOpen(false)}
        >
          <form className="form-grid two" onSubmit={onSubmit}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Nome</label>
              <input
                required
                autoFocus
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Papel</label>
              <select
                value={form.papel}
                onChange={(e) => setForm({ ...form, papel: e.target.value as HelperRole })}
              >
                <option value="voluntario">Voluntário</option>
                <option value="doador">Doador</option>
                <option value="padrinho">Padrinho/Madrinha</option>
                <option value="parceiro">Parceiro</option>
              </select>
            </div>
            <div className="field">
              <label>Cidade</label>
              <input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Desde</label>
              <input
                type="date"
                value={form.desde}
                onChange={(e) => setForm({ ...form, desde: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Situação</label>
              <select
                value={form.ativo ? '1' : '0'}
                onChange={(e) => setForm({ ...form, ativo: e.target.value === '1' })}
              >
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </div>
            <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-ghost-dark" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-dark" type="submit">
                Salvar
              </button>
            </div>
          </form>
        </Drawer>
      ) : null}
    </div>
  )
}
