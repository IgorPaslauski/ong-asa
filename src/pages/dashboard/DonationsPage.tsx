import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Drawer from '../../components/Drawer'
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
  const [status, setStatus] = useState<'todos' | DonationStatus>('todos')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Donation | null>(null)
  const [form, setForm] = useState(emptyForm)

  const totals = useMemo(() => {
    const confirmed = items.filter((d) => d.status === 'confirmada')
    return {
      count: items.length,
      confirmed: confirmed.length,
      pending: items.filter((d) => d.status === 'pendente').length,
      amount: confirmed.reduce((s, d) => s + d.valor, 0),
    }
  }, [items])

  const filtered = useMemo(() => {
    return items
      .filter((d) => {
        const q = query.toLowerCase().trim()
        const matchQ =
          !q ||
          d.doadorNome.toLowerCase().includes(q) ||
          d.descricao.toLowerCase().includes(q) ||
          d.destinacao.toLowerCase().includes(q)
        const matchT = tipo === 'todos' || d.tipo === tipo
        const matchS = status === 'todos' || d.status === status
        return matchQ && matchT && matchS
      })
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [items, query, tipo, status])

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

  function setDonationStatus(id: string, next: DonationStatus) {
    persist(items.map((d) => (d.id === id ? { ...d, status: next } : d)))
  }

  return (
    <div className="dash-page">
      <div className="registry-head">
        <div>
          <p className="eyebrow">Financeiro</p>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)', fontSize: 'clamp(1.55rem, 3vw, 2rem)', margin: 0 }}>
            Doações
          </h1>
          <p className="muted">
            {formatCurrency(totals.amount)} confirmados · {totals.pending} pendente(s)
          </p>
        </div>
        <button className="btn btn-dark btn-sm" type="button" onClick={openCreate}>
          + Nova doação
        </button>
      </div>

      <div className="metric-grid" style={{ marginBottom: '0.25rem' }}>
        <article className="metric-card">
          <div className="metric-top"><span>Total lançamentos</span></div>
          <strong>{totals.count}</strong>
          <em>{totals.confirmed} confirmadas</em>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Volume confirmado</span></div>
          <strong style={{ fontSize: '1.35rem' }}>{formatCurrency(totals.amount)}</strong>
          <em>soma financeira + espécie</em>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Pendências</span></div>
          <strong>{totals.pending}</strong>
          <em>aguardando conciliação</em>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Filtro atual</span></div>
          <strong style={{ fontSize: '1.35rem' }}>{filtered.length}</strong>
          <em>visíveis na tabela</em>
        </article>
      </div>

      <div className="chip-row">
        <button type="button" className={`chip${tipo === 'todos' ? ' is-on' : ''}`} onClick={() => setTipo('todos')}>
          Todos os tipos
        </button>
        {(Object.keys(DONATION_TYPE_LABEL) as DonationType[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`chip${tipo === k ? ' is-on' : ''}`}
            onClick={() => setTipo(k)}
          >
            {DONATION_TYPE_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {(
          [
            ['todos', 'Todos status'],
            ['confirmada', 'Confirmadas'],
            ['pendente', 'Pendentes'],
            ['cancelada', 'Canceladas'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip${status === key ? ' is-on' : ''}`}
            onClick={() => setStatus(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="toolbar smart">
        <div className="field">
          <label htmlFor="dq">Buscar</label>
          <input
            id="dq"
            placeholder="Doador, descrição ou destinação"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>{formatDate(d.data)}</td>
                <td>
                  <strong>{d.doadorNome}</strong>
                  <div className="muted tiny">{d.descricao}</div>
                </td>
                <td>{DONATION_TYPE_LABEL[d.tipo]}</td>
                <td>{d.valor ? formatCurrency(d.valor) : '—'}</td>
                <td>{d.destinacao}</td>
                <td>
                  <select
                    aria-label={`Status da doação ${d.id}`}
                    value={d.status}
                    onChange={(e) => setDonationStatus(d.id, e.target.value as DonationStatus)}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '0.35rem 0.5rem',
                      background: '#fff',
                    }}
                  >
                    {(Object.keys(DONATION_STATUS_LABEL) as DonationStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {DONATION_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
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
        <Drawer
          title={editing ? 'Editar doação' : 'Nova doação'}
          subtitle="Registre valor, tipo e destinação em um fluxo único."
          onClose={() => setOpen(false)}
        >
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
                list="destinos"
                value={form.destinacao}
                onChange={(e) => setForm({ ...form, destinacao: e.target.value })}
              />
              <datalist id="destinos">
                <option value="Oficinas e reforço" />
                <option value="Famílias acolhidas" />
                <option value="Inclusão digital" />
                <option value="Música e cultura" />
                <option value="Jovens Empreendedores" />
                <option value="Apadrinhamento" />
                <option value="Kit vestuário" />
                <option value="Geral" />
              </datalist>
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
                Salvar doação
              </button>
            </div>
          </form>
        </Drawer>
      ) : null}
    </div>
  )
}
