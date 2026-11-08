import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/Modal'
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

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = query.toLowerCase()
      const matchQ =
        !q ||
        c.nome.toLowerCase().includes(q) ||
        c.responsavel.toLowerCase().includes(q) ||
        c.bairro.toLowerCase().includes(q)
      const matchS = status === 'todos' || c.status === status
      return matchQ && matchS
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

  return (
    <div>
      <header className="dash-header">
        <div>
          <h1>Crianças</h1>
          <p>Cadastro e acompanhamento das crianças acolhidas pela ASA.</p>
        </div>
        <button className="btn btn-dark btn-sm" type="button" onClick={openCreate}>
          Nova criança
        </button>
      </header>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="q">Buscar</label>
          <input
            id="q"
            placeholder="Nome, responsável ou bairro"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="acompanhamento">Em acompanhamento</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.nome}</strong>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {c.escola}
                  </div>
                </td>
                <td>{c.idade}</td>
                <td>
                  {c.responsavel}
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {c.telefone}
                  </div>
                </td>
                <td>{c.bairro}</td>
                <td>{formatDate(c.dataEntrada)}</td>
                <td>
                  <span
                    className={`badge ${
                      c.status === 'ativo'
                        ? 'badge-ok'
                        : c.status === 'acompanhamento'
                          ? 'badge-warn'
                          : 'badge-muted'
                    }`}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
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
        <Modal title={editing ? 'Editar criança' : 'Nova criança'} onClose={() => setOpen(false)}>
          <form className="form-grid two" onSubmit={onSubmit}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Nome</label>
              <input
                required
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
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
