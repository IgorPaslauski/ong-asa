import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/Modal'
import {
  DONATION_STATUS_LABEL,
  DONATION_TYPE_LABEL,
  type Donation,
  type DonationStatus,
  type DonationType,
  formatCurrency,
  formatDate,
  uid,
} from '../../data/mock'
import { getDonations, getHelpers, setDonations } from '../../lib/storage'

const emptyForm = {
  doadorId: '',
  doadorNome: '',
  tipo: 'financeira' as DonationType,
  valor: 100,
  descricao: '',
  data: new Date().toISOString().slice(0, 10),
  status: 'confirmada' as DonationStatus,
  destinacao: 'Geral',
}

export default function DonationsPage() {
  const helpers = getHelpers()
  const [items, setItems] = useState<Donation[]>(() => getDonations())
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState<'todos' | DonationType>('todos')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Donation | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return items
      .filter((d) => {
        const q = query.toLowerCase()
        const matchQ =
          !q ||
          d.doadorNome.toLowerCase().includes(q) ||
          d.descricao.toLowerCase().includes(q) ||
          d.destinacao.toLowerCase().includes(q)
        const matchT = tipo === 'todos' || d.tipo === tipo
        return matchQ && matchT
      })
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [items, query, tipo])

  function persist(next: Donation[]) {
    setItems(next)
    setDonations(next)
  }

  function openCreate() {
    const first = helpers[0]
    setEditing(null)
    setForm({
      ...emptyForm,
      doadorId: first?.id || '',
      doadorNome: first?.nome || '',
    })
    setOpen(true)
  }

  function openEdit(donation: Donation) {
    setEditing(donation)
    setForm({
      doadorId: donation.doadorId,
      doadorNome: donation.doadorNome,
      tipo: donation.tipo,
      valor: donation.valor,
      descricao: donation.descricao,
      data: donation.data,
      status: donation.status,
      destinacao: donation.destinacao,
    })
    setOpen(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) {
      persist(items.map((d) => (d.id === editing.id ? { ...editing, ...form } : d)))
    } else {
      persist([{ id: uid('d'), ...form }, ...items])
    }
    setOpen(false)
  }

  function remove(id: string) {
    if (!confirm('Remover esta doação?')) return
    persist(items.filter((d) => d.id !== id))
  }

  return (
    <div>
      <header className="dash-header">
        <div>
          <h1>Doações</h1>
          <p>Registro de contribuições financeiras e em espécie.</p>
        </div>
        <button className="btn btn-dark btn-sm" type="button" onClick={openCreate}>
          Nova doação
        </button>
      </header>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="dq">Buscar</label>
          <input
            id="dq"
            placeholder="Doador, descrição ou destinação"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          >
            <option value="todos">Todos</option>
            {(Object.keys(DONATION_TYPE_LABEL) as DonationType[]).map((k) => (
              <option key={k} value={k}>
                {DONATION_TYPE_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Doador</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Destinação</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>{formatDate(d.data)}</td>
                <td>
                  <strong>{d.doadorNome}</strong>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {d.descricao}
                  </div>
                </td>
                <td>{DONATION_TYPE_LABEL[d.tipo]}</td>
                <td>{d.valor ? formatCurrency(d.valor) : '—'}</td>
                <td>{d.destinacao}</td>
                <td>
                  <span
                    className={`badge ${
                      d.status === 'confirmada'
                        ? 'badge-ok'
                        : d.status === 'pendente'
                          ? 'badge-warn'
                          : 'badge-danger'
                    }`}
                  >
                    {DONATION_STATUS_LABEL[d.status]}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost-dark btn-sm" type="button" onClick={() => openEdit(d)}>
                      Editar
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(d.id)}>
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <div className="empty">Nenhuma doação encontrada.</div> : null}
      </div>

      {open ? (
        <Modal title={editing ? 'Editar doação' : 'Nova doação'} onClose={() => setOpen(false)}>
          <form className="form-grid two" onSubmit={onSubmit}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Doador / parceiro</label>
              <select
                value={form.doadorId}
                onChange={(e) => {
                  const h = helpers.find((x) => x.id === e.target.value)
                  setForm({
                    ...form,
                    doadorId: e.target.value,
                    doadorNome: h?.nome || form.doadorNome,
                  })
                }}
              >
                {helpers.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as DonationType })}
              >
                {(Object.keys(DONATION_TYPE_LABEL) as DonationType[]).map((k) => (
                  <option key={k} value={k}>
                    {DONATION_TYPE_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DonationStatus })}
              >
                <option value="confirmada">Confirmada</option>
                <option value="pendente">Pendente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Destinação</label>
              <input
                value={form.destinacao}
                onChange={(e) => setForm({ ...form, destinacao: e.target.value })}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Descrição</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
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
