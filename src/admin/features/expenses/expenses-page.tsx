import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2Icon, FileTextIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { dateSort, enumSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { NumberField, SelectField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { EXPENSE_CATEGORIES, expenses, summarizeAccounts, type Expense } from '@/admin/data/modules'
import { useDonations } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatBRL, formatDateBR, todayISO } from '@/admin/lib/format'

const schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  categoria: z.string().min(1, 'Escolha a categoria.'),
  descricao: z.string().trim().min(1, 'Descreva a despesa.'),
  fornecedor: z.string().trim(),
  valor: z.number({ error: 'Informe o valor.' }).positive('O valor precisa ser maior que zero.'),
  status: z.enum(['paga', 'pendente']),
  destinacao: z.string().trim(),
})
type Form = z.infer<typeof schema>
const emptyValues = (): Form => ({ data: todayISO(), categoria: '', descricao: '', fornecedor: '', valor: '' as unknown as number, status: 'paga', destinacao: '' })
const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))

export default function ExpensesPage() {
  const list = expenses.useAll()
  const donations = useDonations()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [toDelete, setToDelete] = useState<Expense | null>(null)
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: emptyValues(), mode: 'onTouched' })

  const totals = useMemo(() => summarizeAccounts(donations, list, { from: null, to: null }), [donations, list])

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(e: Expense) {
    setEditing(e)
    form.reset({ data: e.data, categoria: e.categoria, descricao: e.descricao, fornecedor: e.fornecedor, valor: e.valor, status: e.status, destinacao: e.destinacao })
    setFormOpen(true)
  }
  function save(v: Form) {
    const saved = expenses.save(v, editing?.id)
    toast.success(editing ? 'Despesa atualizada.' : 'Despesa lançada.', { description: `${saved.descricao} — ${formatBRL(saved.valor)}` })
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Expense, any>[]>(
    () => [
      { id: 'data', accessorFn: (e) => e.data, sortingFn: dateSort, meta: { title: 'Data' }, header: ({ column }) => <SortableHeader column={column} title="Data" />, cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span> },
      {
        id: 'descricao',
        accessorFn: (e) => e.descricao,
        sortingFn: textSort,
        meta: { title: 'Despesa' },
        header: ({ column }) => <SortableHeader column={column} title="Despesa" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{row.original.descricao}</span>
            {row.original.fornecedor ? <span className="block truncate text-xs text-muted-foreground">{row.original.fornecedor}</span> : null}
          </div>
        ),
      },
      { id: 'categoria', accessorFn: (e) => e.categoria, sortingFn: textSort, meta: { title: 'Categoria' }, header: ({ column }) => <SortableHeader column={column} title="Categoria" /> },
      { id: 'destinacao', accessorFn: (e) => e.destinacao, sortingFn: textSort, meta: { title: 'Destinação' }, header: ({ column }) => <SortableHeader column={column} title="Destinação" />, cell: ({ getValue }) => getValue<string>() || '—' },
      { id: 'valor', accessorFn: (e) => e.valor, sortingFn: numberSort, meta: { title: 'Valor', className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title="Valor" align="right" />, cell: ({ getValue }) => <span className="tabular">{formatBRL(getValue<number>())}</span> },
      {
        id: 'status',
        accessorFn: (e) => e.status,
        sortingFn: enumSort(['pendente', 'paga']),
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ getValue }) => <Badge variant={getValue<string>() === 'paga' ? 'success' : 'warning'}>{getValue<string>() === 'paga' ? 'Paga' : 'A pagar'}</Badge>,
      },
    ],
    [],
  )

  const filters = useMemo<FilterDef<Expense>[]>(
    () => [
      { id: 'categoria', type: 'select', label: 'Categoria', options: CATEGORY_OPTIONS, match: (e, v) => e.categoria === v },
      { id: 'status', type: 'select', label: 'Situação', options: [{ value: 'paga', label: 'Pagas' }, { value: 'pendente', label: 'A pagar' }], match: (e, v) => e.status === v },
    ],
    [],
  )

  const rowActions = (e: Expense): RowAction<Expense>[] => [
    { id: 'pagar', label: 'Marcar como paga', icon: <CheckCircle2Icon />, hidden: e.status === 'paga', onSelect: (x) => expenses.save({ ...x, status: 'paga' }, x.id) },
    { id: 'editar', label: 'Editar despesa', icon: <PencilIcon />, onSelect: openEdit },
    { id: 'remover', label: 'Remover lançamento', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
  ]

  const exportColumns: ExportColumn<Expense>[] = [
    { header: 'Data', value: (e) => formatDateBR(e.data) },
    { header: 'Despesa', value: (e) => e.descricao },
    { header: 'Fornecedor', value: (e) => e.fornecedor },
    { header: 'Categoria', value: (e) => e.categoria },
    { header: 'Destinação', value: (e) => e.destinacao },
    { header: 'Situação', value: (e) => (e.status === 'paga' ? 'Paga' : 'A pagar') },
    { header: 'Valor (R$)', value: (e) => formatBRL(e.valor), align: 'right' },
  ]

  return (
    <div>
      <PageHeader
        title="Despesas e contas"
        description="Saídas do caixa por categoria. Com as doações financeiras confirmadas, formam a prestação de contas."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/painel/relatorios/prestacao-de-contas">
                <FileTextIcon />
                Prestação de contas
              </Link>
            </Button>
            <Button onClick={openCreate}>
              <PlusIcon />
              Nova despesa
            </Button>
          </div>
        }
      />
      <StatStrip
        label="Resumo financeiro (todo o histórico)"
        items={[['Dinheiro recebido', formatBRL(totals.receitas)], ['Despesas pagas', formatBRL(totals.despesas)], ['Saldo', formatBRL(totals.saldo)], ['A pagar', formatBRL(totals.despesasPendentes)]]}
      />
      <DataTable<Expense>
        id="expenses"
        caption="Despesas"
        data={list}
        columns={columns}
        getRowId={(e) => e.id}
        searchText={(e) => `${e.descricao} ${e.fornecedor} ${e.categoria} ${e.destinacao}`}
        searchPlaceholder="Buscar por despesa, fornecedor ou categoria"
        filters={filters}
        initialSort={[{ id: 'data', desc: true }]}
        defaultColumnVisibility={{ destinacao: false }}
        rowActions={rowActions}
        noun={['despesa', 'despesas']}
        empty={{
          title: 'Nenhuma despesa lançada',
          description: 'Lance as saídas do caixa (compras, contas, pagamentos) para fechar o saldo e prestar contas.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Nova despesa
            </Button>
          ),
        }}
        exportConfig={{ filename: 'despesas', title: 'Despesas', subtitle: 'Saídas do caixa do Instituto A.S.A.', columns: exportColumns }}
        exportPeriod="Conforme filtros"
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar despesa' : 'Nova despesa'}
        description={editing ? editing.descricao : 'Registre uma saída do caixa.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Lançar despesa'}
      >
        <FormSection title="A despesa">
          <TextField control={form.control} name="descricao" label="Descrição" required autoFocus className="sm:col-span-2" autoComplete="off" placeholder="Ex.: compra de cestas básicas" />
          <TextField control={form.control} name="fornecedor" label="Fornecedor" className="sm:col-span-2" autoComplete="off" />
          <SelectField control={form.control} name="categoria" label="Categoria" required options={CATEGORY_OPTIONS} />
          <NumberField control={form.control} name="valor" label="Valor (R$)" required min={0} step="0.01" />
          <TextField control={form.control} name="data" label="Data" type="date" required />
          <SelectField control={form.control} name="status" label="Situação" required options={[{ value: 'paga', label: 'Paga' }, { value: 'pendente', label: 'A pagar' }]} />
          <TextField control={form.control} name="destinacao" label="Destinação / projeto" className="sm:col-span-2" autoComplete="off" description="Opcional. Use o mesmo nome das doações para cruzar na prestação de contas." />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este lançamento?"
        description={
          <p>
            <strong>{toDelete?.descricao}</strong> ({toDelete ? formatBRL(toDelete.valor) : ''}) será removida e deixará de contar no saldo. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover lançamento"
        onConfirm={() => {
          if (!toDelete) return
          expenses.remove(toDelete.id)
          toast.success('Lançamento removido.', { description: toDelete.descricao })
          setToDelete(null)
        }}
      />
    </div>
  )
}
