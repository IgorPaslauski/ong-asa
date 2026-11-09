import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, EyeIcon, PencilIcon, PlusIcon, Trash2Icon, UserRoundCheckIcon, UserRoundSearchIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/admin/components/ui/sheet'
import { SortableHeader, DataTable } from '@/admin/components/data-table/data-table'
import { dateSort, enumSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { ChildStatusBadge } from '@/admin/components/feedback/status-badge'
import { Detail, NumberField, SelectField, TextField, TextareaField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { childrenRepo, useChildren } from '@/admin/data/store'
import { formatDateBR, formatNumber, todayISO } from '@/admin/lib/format'
import { STATUS_LABEL, type Child, type ChildStatus } from '@/data/mock'
import { AGE_BANDS, ageBandLabel, ageBandOf, childSchema, timeInProgram, type ChildFormValues } from './schema'
import type { ColumnDef } from '@tanstack/react-table'
import type { ExportColumn } from '@/admin/lib/export'

const STATUS_ORDER: ChildStatus[] = ['acompanhamento', 'ativo', 'concluido']
const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ChildStatus[]).map((v) => ({ value: v, label: STATUS_LABEL[v] }))

const emptyValues = (): ChildFormValues => ({
  nome: '',
  idade: '' as unknown as number,
  responsavel: '',
  telefone: '',
  bairro: '',
  escola: '',
  status: 'ativo',
  dataEntrada: todayISO(),
  observacoes: '',
})

const toValues = (c: Child): ChildFormValues => ({
  nome: c.nome,
  idade: c.idade,
  responsavel: c.responsavel,
  telefone: c.telefone,
  bairro: c.bairro,
  escola: c.escola,
  status: c.status,
  dataEntrada: c.dataEntrada,
  observacoes: c.observacoes,
})

/** Exportação anonimizada: sem nome, responsável, telefone ou observações. */
const EXPORT_COLUMNS: ExportColumn<Child>[] = [
  { header: 'Código', value: (c) => c.id },
  { header: 'Idade', value: (c) => c.idade, align: 'right' },
  { header: 'Faixa etária', value: (c) => ageBandLabel(c.idade) },
  { header: 'Bairro', value: (c) => c.bairro },
  { header: 'Escola', value: (c) => c.escola },
  { header: 'Situação', value: (c) => STATUS_LABEL[c.status] },
  { header: 'Entrada', value: (c) => formatDateBR(c.dataEntrada) },
]

export default function ChildrenPage() {
  const children = useChildren()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Child | null>(null)
  const [detail, setDetail] = useState<Child | null>(null)
  const [toDelete, setToDelete] = useState<Child | null>(null)

  const form = useForm<ChildFormValues>({ resolver: zodResolver(childSchema), defaultValues: emptyValues(), mode: 'onTouched' })

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(c: Child) {
    setEditing(c)
    form.reset(toValues(c))
    setDetail(null)
    setFormOpen(true)
  }

  // Atalho vindo do dashboard: /painel/criancas?novo=1
  useEffect(() => {
    if (params.get('novo') === '1') {
      openCreate()
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line
  }, [params])

  function save(values: ChildFormValues) {
    const saved = childrenRepo.save(values, editing?.id)
    toast.success(editing ? 'Cadastro atualizado.' : 'Cadastro criado.', { description: saved.nome })
    setFormOpen(false)
  }

  const counts = useMemo(() => {
    const c = { total: children.length, ativo: 0, acompanhamento: 0, concluido: 0 }
    for (const x of children) c[x.status] += 1
    return c
  }, [children])

  const columns = useMemo<ColumnDef<Child, any>[]>(
    () => [
      {
        id: 'nome',
        accessorFn: (c) => c.nome,
        sortingFn: textSort,
        meta: { title: 'Nome' },
        header: ({ column }) => <SortableHeader column={column} title="Nome" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <button type="button" className="block max-w-full truncate rounded-sm text-left font-medium text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setDetail(row.original)}>
              {row.original.nome}
            </button>
            <span className="block truncate text-xs text-muted-foreground">{row.original.escola || 'Escola não informada'}</span>
          </div>
        ),
      },
      {
        id: 'idade',
        accessorFn: (c) => c.idade,
        sortingFn: numberSort,
        meta: { title: 'Idade', className: 'text-right' },
        header: ({ column }) => <SortableHeader column={column} title="Idade" align="right" />,
        cell: ({ getValue }) => <span className="tabular">{getValue<number>()}</span>,
      },
      {
        id: 'responsavel',
        accessorFn: (c) => c.responsavel,
        sortingFn: textSort,
        meta: { title: 'Responsável' },
        header: ({ column }) => <SortableHeader column={column} title="Responsável" />,
        cell: ({ row }) => (
          <div>
            <span className="block">{row.original.responsavel}</span>
            <span className="block text-xs text-muted-foreground tabular">{row.original.telefone}</span>
          </div>
        ),
      },
      {
        id: 'bairro',
        accessorFn: (c) => c.bairro,
        sortingFn: textSort,
        meta: { title: 'Bairro' },
        header: ({ column }) => <SortableHeader column={column} title="Bairro" />,
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'dataEntrada',
        accessorFn: (c) => c.dataEntrada,
        sortingFn: dateSort,
        meta: { title: 'Entrada' },
        header: ({ column }) => <SortableHeader column={column} title="Entrada" />,
        cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span>,
      },
      {
        id: 'status',
        accessorFn: (c) => c.status,
        sortingFn: enumSort(STATUS_ORDER),
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ getValue }) => <ChildStatusBadge status={getValue<ChildStatus>()} />,
      },
    ],
    [],
  )

  const filters = useMemo<FilterDef<Child>[]>(() => {
    const uniq = (pick: (c: Child) => string) => [...new Set(children.map(pick).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({ value: v, label: v }))
    return [
      { id: 'status', type: 'select', label: 'Situação', options: STATUS_OPTIONS, match: (c, v) => c.status === v },
      { id: 'faixa', type: 'select', label: 'Faixa etária', options: AGE_BANDS.map((b) => ({ value: b.value, label: b.label })), match: (c, v) => ageBandOf(c.idade) === v },
      { id: 'bairro', type: 'select', label: 'Bairro', options: uniq((c) => c.bairro), match: (c, v) => c.bairro === v },
      { id: 'escola', type: 'combobox', label: 'Escola', options: uniq((c) => c.escola), match: (c, v) => c.escola === v },
    ]
  }, [children])

  const rowActions = useMemo(
    () =>
      (c: Child): RowAction<Child>[] => [
        { id: 'ver', label: 'Ver detalhes', icon: <EyeIcon />, onSelect: setDetail },
        { id: 'editar', label: 'Editar cadastro', icon: <PencilIcon />, onSelect: openEdit },
        { id: 'ativo', label: 'Marcar como ativo', icon: <UserRoundCheckIcon />, hidden: c.status === 'ativo', onSelect: (x) => setStatus(x, 'ativo') },
        { id: 'acomp', label: 'Marcar em acompanhamento', icon: <UserRoundSearchIcon />, hidden: c.status === 'acompanhamento', onSelect: (x) => setStatus(x, 'acompanhamento') },
        { id: 'concl', label: 'Marcar como concluído', icon: <CheckCircle2Icon />, hidden: c.status === 'concluido', onSelect: (x) => setStatus(x, 'concluido') },
        { id: 'remover', label: 'Remover cadastro', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
      ],
    // eslint-disable-next-line
    [],
  )

  function setStatus(c: Child, status: ChildStatus) {
    childrenRepo.setStatus(c.id, status)
    toast.success(`Situação atualizada para “${STATUS_LABEL[status]}”.`, { description: c.nome })
  }

  return (
    <div>
      <PageHeader
        title="Crianças e adolescentes"
        description="Cadastro e acompanhamento. Dados pessoais de menores: acesso restrito à equipe; exportações não incluem nome, responsável nem telefone."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nova criança
          </Button>
        }
      />

      <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumo dos cadastros">
        {[
          ['Cadastros', counts.total],
          ['Ativos', counts.ativo],
          ['Em acompanhamento', counts.acompanhamento],
          ['Concluídos', counts.concluido],
        ].map(([label, value]) => (
          <Card key={label as string} className="flex-row items-baseline justify-between gap-2 px-4 py-2.5">
            <dt className="text-[13px] text-muted-foreground">{label}</dt>
            <dd className="text-lg font-semibold tabular">{formatNumber(value as number)}</dd>
          </Card>
        ))}
      </dl>

      <DataTable<Child>
        id="children"
        caption="Crianças e adolescentes cadastrados"
        data={children}
        columns={columns}
        getRowId={(c) => c.id}
        searchText={(c) => `${c.nome} ${c.responsavel} ${c.bairro} ${c.escola}`}
        searchPlaceholder="Buscar por nome, responsável, bairro ou escola"
        filters={filters}
        initialSort={[{ id: 'nome', desc: false }]}
        rowActions={rowActions}
        noun={['cadastro', 'cadastros']}
        empty={{
          title: 'Nenhuma criança cadastrada ainda',
          description: 'Cadastre a primeira criança ou adolescente para começar o acompanhamento.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Nova criança
            </Button>
          ),
        }}
        exportConfig={{
          filename: 'criancas-anonimizado',
          title: 'Crianças e adolescentes — lista anonimizada',
          subtitle: 'Exportação sem dados pessoais identificáveis (nome, responsável, telefone e observações foram omitidos).',
          columns: EXPORT_COLUMNS,
          notes: ['Dados de demonstração armazenados no navegador. Uso interno: não divulgar.'],
        }}
        exportPeriod="Todos os cadastros"
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar cadastro' : 'Nova criança ou adolescente'}
        description={editing ? editing.nome : 'Preencha os dados essenciais. Você pode completar depois.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Cadastrar'}
      >
        <FormSection title="Identificação">
          <TextField control={form.control} name="nome" label="Nome completo" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <NumberField control={form.control} name="idade" label="Idade" required min={0} max={18} step={1} description="De 0 a 18 anos." />
        </FormSection>
        <FormSection title="Responsável e contato">
          <TextField control={form.control} name="responsavel" label="Responsável" required autoComplete="off" />
          <TextField control={form.control} name="telefone" label="Telefone" type="tel" placeholder="(55) 99999-9999" autoComplete="off" />
        </FormSection>
        <FormSection title="Escola e território">
          <TextField control={form.control} name="escola" label="Escola" autoComplete="off" />
          <TextField control={form.control} name="bairro" label="Bairro" autoComplete="off" />
        </FormSection>
        <FormSection title="Acompanhamento">
          <SelectField control={form.control} name="status" label="Situação" required options={STATUS_OPTIONS} />
          <TextField control={form.control} name="dataEntrada" label="Data de entrada" type="date" required />
          <TextareaField control={form.control} name="observacoes" label="Observações" rows={4} className="sm:col-span-2" />
        </FormSection>
      </FormSheet>

      <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent>
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.nome}</SheetTitle>
                <SheetDescription>
                  <ChildStatusBadge status={detail.status} />
                </SheetDescription>
              </SheetHeader>
              <SheetBody className="space-y-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail label="Idade">{detail.idade} anos ({ageBandLabel(detail.idade)})</Detail>
                  <Detail label="Entrada">{formatDateBR(detail.dataEntrada)}</Detail>
                  <Detail label="No programa há">{timeInProgram(detail.dataEntrada)}</Detail>
                  <Detail label="Bairro">{detail.bairro}</Detail>
                  <Detail label="Escola" className="sm:col-span-2">{detail.escola}</Detail>
                  <Detail label="Responsável">{detail.responsavel}</Detail>
                  <Detail label="Telefone">{detail.telefone}</Detail>
                  <Detail label="Observações" className="sm:col-span-2">
                    <span className="whitespace-pre-wrap">{detail.observacoes}</span>
                  </Detail>
                </dl>
              </SheetBody>
              <SheetFooter>
                <Button variant="outline" onClick={() => setToDelete(detail)}>
                  <Trash2Icon />
                  Remover
                </Button>
                <Button onClick={() => openEdit(detail)}>
                  <PencilIcon />
                  Editar
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este cadastro?"
        description={
          <p>
            O cadastro de <strong>{toDelete?.nome}</strong> será removido deste navegador. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover cadastro"
        onConfirm={() => {
          if (!toDelete) return
          childrenRepo.remove(toDelete.id)
          toast.success('Cadastro removido.', { description: toDelete.nome })
          setDetail(null)
          setToDelete(null)
        }}
      />
    </div>
  )
}
