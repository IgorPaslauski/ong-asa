import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { numberSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { NumberField, SelectField, TextareaField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { MultiPickField } from '@/admin/components/forms/multi-pick'
import { PageHeader } from '@/admin/components/layout/page-header'
import { BENEFITS, INCOME_BANDS, childrenWithoutFamily, families, type Family } from '@/admin/data/modules'
import { useChildren } from '@/admin/data/store'

const schema = z.object({
  responsavel: z.string().trim().min(1, 'Informe o nome do responsável.'),
  parentesco: z.string().trim(),
  telefone: z.string().trim(),
  pessoasNaCasa: z.union([z.number().int('Use um número inteiro.').min(1, 'Informe pelo menos 1 pessoa.'), z.literal('')]),
  renda: z.string().min(1),
  beneficios: z.array(z.string()),
  criancas: z.array(z.string()),
  observacoes: z.string().trim(),
})
type Form = z.infer<typeof schema>
const emptyValues = (): Form => ({ responsavel: '', parentesco: '', telefone: '', pessoasNaCasa: '', renda: 'Não informado', beneficios: [], criancas: [], observacoes: '' })

export default function FamiliesPage() {
  const list = families.useAll()
  const children = useChildren()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Family | null>(null)
  const [toDelete, setToDelete] = useState<Family | null>(null)
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: emptyValues(), mode: 'onTouched' })

  const byId = useMemo(() => new Map(children.map((c) => [c.id, c])), [children])
  const orphans = useMemo(() => childrenWithoutFamily(children, list), [children, list])
  const withBenefit = list.filter((f) => f.beneficios.length > 0).length

  const childOptions = useMemo(
    () => [...children].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((c) => ({ value: c.id, label: c.nome, hint: `${c.idade} anos${c.bairro ? ` · ${c.bairro}` : ''}` })),
    [children],
  )

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(f: Family) {
    setEditing(f)
    form.reset({ ...f, pessoasNaCasa: f.pessoasNaCasa || '' })
    setFormOpen(true)
  }
  function save(v: Form) {
    const saved = families.save({ ...v, pessoasNaCasa: v.pessoasNaCasa === '' ? 0 : v.pessoasNaCasa }, editing?.id)
    toast.success(editing ? 'Família atualizada.' : 'Família cadastrada.', { description: saved.responsavel })
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Family, any>[]>(
    () => [
      {
        id: 'responsavel',
        accessorFn: (f) => f.responsavel,
        sortingFn: textSort,
        meta: { title: 'Responsável' },
        header: ({ column }) => <SortableHeader column={column} title="Responsável" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{row.original.responsavel}</span>
            <span className="block truncate text-xs text-muted-foreground">{[row.original.parentesco, row.original.telefone].filter(Boolean).join(' · ') || '—'}</span>
          </div>
        ),
      },
      {
        id: 'criancas',
        accessorFn: (f) => f.criancas.length,
        sortingFn: numberSort,
        meta: { title: 'Crianças' },
        header: ({ column }) => <SortableHeader column={column} title="Crianças" />,
        cell: ({ row }) => {
          const names = row.original.criancas.map((id) => byId.get(id)?.nome).filter(Boolean) as string[]
          return names.length ? <span className="line-clamp-2 text-[13px]">{names.join(', ')}</span> : '—'
        },
      },
      { id: 'pessoas', accessorFn: (f) => f.pessoasNaCasa, sortingFn: numberSort, meta: { title: 'Pessoas na casa', className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title="Na casa" align="right" />, cell: ({ getValue }) => <span className="tabular">{getValue<number>() || '—'}</span> },
      { id: 'renda', accessorFn: (f) => f.renda, sortingFn: textSort, meta: { title: 'Renda' }, header: ({ column }) => <SortableHeader column={column} title="Renda" />, cell: ({ getValue }) => <span className="text-[13px]">{getValue<string>()}</span> },
      {
        id: 'beneficios',
        accessorFn: (f) => f.beneficios.join(', '),
        sortingFn: textSort,
        meta: { title: 'Benefícios' },
        header: ({ column }) => <SortableHeader column={column} title="Benefícios" />,
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {row.original.beneficios.length ? row.original.beneficios.map((b) => <Badge key={b} variant="info">{b}</Badge>) : '—'}
          </span>
        ),
      },
    ],
    [byId],
  )

  const filters = useMemo<FilterDef<Family>[]>(
    () => [
      { id: 'beneficio', type: 'select', label: 'Benefício', options: BENEFITS.map((b) => ({ value: b, label: b })), match: (f, v) => f.beneficios.includes(v) },
      { id: 'renda', type: 'select', label: 'Renda', options: INCOME_BANDS.map((b) => ({ value: b, label: b })), match: (f, v) => f.renda === v },
    ],
    [],
  )

  const rowActions = (): RowAction<Family>[] => [
    { id: 'editar', label: 'Editar família', icon: <PencilIcon />, onSelect: openEdit },
    { id: 'remover', label: 'Remover família', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
  ]

  return (
    <div>
      <PageHeader
        title="Famílias"
        description="Responsáveis, composição familiar e benefícios, ligados às crianças atendidas."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nova família
          </Button>
        }
      />
      <StatStrip label="Resumo das famílias" items={[['Famílias', list.length], ['Com benefício', withBenefit], ['Crianças sem família', orphans.length]]} />
      {orphans.length > 0 && list.length > 0 ? (
        <Alert variant="info" className="mb-4">
          <AlertDescription>
            {orphans.length} {orphans.length === 1 ? 'criança ativa ainda não está' : 'crianças ativas ainda não estão'} ligada(s) a uma família: {orphans.slice(0, 4).map((c) => c.nome).join(', ')}
            {orphans.length > 4 ? ' e outras' : ''}.
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTable<Family>
        id="families"
        caption="Famílias"
        data={list}
        columns={columns}
        getRowId={(f) => f.id}
        searchText={(f) => `${f.responsavel} ${f.criancas.map((id) => byId.get(id)?.nome ?? '').join(' ')}`}
        searchPlaceholder="Buscar por responsável ou criança"
        filters={filters}
        initialSort={[{ id: 'responsavel', desc: false }]}
        rowActions={rowActions}
        noun={['família', 'famílias']}
        empty={{
          title: 'Nenhuma família cadastrada',
          description: 'Cadastre o responsável e ligue as crianças que ele acompanha.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Nova família
            </Button>
          ),
        }}
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar família' : 'Nova família'}
        description={editing ? editing.responsavel : 'Dados do responsável e das crianças atendidas.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Cadastrar família'}
      >
        <FormSection title="Responsável">
          <TextField control={form.control} name="responsavel" label="Nome" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <TextField control={form.control} name="parentesco" label="Parentesco" autoComplete="off" placeholder="Mãe, pai, avó…" />
          <TextField control={form.control} name="telefone" label="Telefone" type="tel" autoComplete="off" />
        </FormSection>
        <FormSection title="Situação da família">
          <NumberField control={form.control} name="pessoasNaCasa" label="Pessoas na casa" min={1} />
          <SelectField control={form.control} name="renda" label="Renda por pessoa" options={INCOME_BANDS.map((b) => ({ value: b, label: b }))} />
          <MultiPickField control={form.control} name="beneficios" label="Benefícios" options={BENEFITS.map((b) => ({ value: b, label: b }))} className="sm:col-span-2" />
          <TextareaField control={form.control} name="observacoes" label="Observações" rows={3} className="sm:col-span-2" />
        </FormSection>
        <FormSection title="Crianças e adolescentes">
          <MultiPickField control={form.control} name="criancas" label="Quem a família acompanha" options={childOptions} empty="Cadastre crianças primeiro." className="sm:col-span-2" />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover esta família?"
        description={
          <p>
            O cadastro da família de <strong>{toDelete?.responsavel}</strong> será removido. As crianças continuam cadastradas. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover família"
        onConfirm={() => {
          if (!toDelete) return
          families.remove(toDelete.id)
          toast.success('Família removida.', { description: toDelete.responsavel })
          setToDelete(null)
        }}
      />
    </div>
  )
}
