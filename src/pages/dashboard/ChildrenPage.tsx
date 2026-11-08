import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Drawer from '../../components/Drawer'
import {
  STATUS_LABEL,
  type Child,
  type ChildStatus,
  formatDate,
  uid,
} from '../../data/mock'
import { getChildren, setChildren } from '../../lib/storage'

const emptyForm = {
  nome: '',
  idade: 7,
  responsavel: '',
  telefone: '',
  bairro: '',
  escola: '',
  status: 'ativo' as ChildStatus,
  dataEntrada: new Date().toISOString().slice(0, 10),
  observacoes: '',
}

export default function ChildrenPage() {
  const [items, setItems] = useState<Child[]>(() => getChildren())
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | ChildStatus>('todos')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Child | null>(null)
  const [form, setForm] = useState(emptyForm)

  const counts = useMemo(() => {
    const base = { todos: items.length, ativo: 0, acompanhamento: 0, concluido: 0 }
    for (const c of items) base[c.status] += 1
    return base
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = query.toLowerCase().trim()
      const matchQ =
        !q ||
        c.nome.toLowerCase().includes(q) ||
        c.responsavel.toLowerCase().includes(q) ||
        c.bairro.toLowerCase().includes(q) ||
        c.escola.toLowerCase().includes(q)
      return matchQ && (status === 'todos' || c.status === status)
    })
  }, [items, query, status])

  function persist(next: Child[]) {
    setItems(next)
    setChildren(next)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(child: Child) {
    setEditing(child)
    setForm({
      nome: child.nome,
      idade: child.idade,
      responsavel: child.responsavel,
      telefone: child.telefone,
      bairro: child.bairro,
      escola: child.escola,
      status: child.status,
      dataEntrada: child.dataEntrada,
      observacoes: child.observacoes,
    })
    setOpen(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) {
      persist(items.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)))
    } else {
      persist([{ id: uid('c'), ...form }, ...items])
    }
    setOpen(false)
  }

  function remove(id: string) {
    if (!confirm('Remover este cadastro?')) return
    persist(items.filter((c) => c.id !== id))
  }

  function quickStatus(id: string, next: ChildStatus) {
    persist(items.map((c) => (c.id === id ? { ...c, status: next } : c)))
  }

  return (
    <div className="dash-page">
      <div className="registry-head">
        <div>
          <p className="eyebrow">Cadastros</p>
          <h1 className="dash-header" style={{ margin: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)', fontSize: 'clamp(1.55rem, 3vw, 2rem)' }}>
              Crianças
            </span>
          </h1>
          <p className="muted">Busca rápida, filtros por status e edição em painel lateral.</p>
        </div>
        <button className="btn btn-dark btn-sm" type="button" onClick={openCreate}>
          + Nova criança
        </button>
      </div>

      <div className="chip-row">
        {(
          [
            ['todos', 'Todas'],
            ['ativo', 'Ativas'],
            ['acompanhamento', 'Acompanhamento'],
            ['concluido', 'Concluídas'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip${status === key ? ' is-on' : ''}`}
            onClick={() => setStatus(key)}
          >
            {label}
            <span className="count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar smart">
        <div className="field">
          <label htmlFor="q">Buscar</label>
          <input
            id="q"
            placeholder="Nome, responsável, bairro ou escola"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="result-meta">
        <span>
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
        </span>
        <span>Dica: use os chips para filtrar sem abrir menus</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Idade</th>
              <th>Responsável</th>
              <th>Bairro</th>
              <th>Entrada</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.nome}</strong>
                  <div className="muted tiny">{c.escola}</div>
                </td>
                <td>{c.idade}</td>
                <td>
                  {c.responsavel}
                  <div className="muted tiny">{c.telefone}</div>
                </td>
                <td>{c.bairro}</td>
                <td>{formatDate(c.dataEntrada)}</td>
                <td>
                  <select
                    aria-label={`Status de ${c.nome}`}
                    value={c.status}
                    onChange={(e) => quickStatus(c.id, e.target.value as ChildStatus)}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '0.35rem 0.5rem',
                      background: '#fff',
                    }}
                  >
                    {(Object.keys(STATUS_LABEL) as ChildStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost-dark btn-sm" type="button" onClick={() => openEdit(c)}>
                      Editar
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(c.id)}>
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
          title={editing ? 'Editar criança' : 'Nova criança'}
          subtitle="Campos essenciais primeiro — salve e continue cadastrando."
          onClose={() => setOpen(false)}
        >
          <form className="form-grid two" onSubmit={onSubmit}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Nome completo</label>
              <input
                required
                autoFocus
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Idade</label>
              <input
                type="number"
                min={0}
                max={18}
                required
                value={form.idade}
                onChange={(e) => setForm({ ...form, idade: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ChildStatus })}
              >
                <option value="ativo">Ativo</option>
                <option value="acompanhamento">Em acompanhamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div className="field">
              <label>Responsável</label>
              <input
                required
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
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
              <label>Bairro</label>
              <input
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Escola</label>
              <input
                value={form.escola}
                onChange={(e) => setForm({ ...form, escola: e.target.value })}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Data de entrada</label>
              <input
                type="date"
                value={form.dataEntrada}
                onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Observações</label>
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
            <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-ghost-dark" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-dark" type="submit">
                Salvar cadastro
              </button>
            </div>
          </form>
        </Drawer>
      ) : null}
    </div>
  )
}
