import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardCheckIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { Checkbox } from '@/admin/components/ui/checkbox'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/admin/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { dateSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import type { RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { NumberField, SelectField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { activitiesRepo, useActivities, useChildren } from '@/admin/data/store'
import { attendanceByChild } from '@/admin/data/domain'
import { formatDateBR, formatNumber, formatPercent, todayISO } from '@/admin/lib/format'
import { can, useSessionUser } from '@/lib/auth'
import type { Activity } from '@/data/mock'

const DEFAULT_TYPES = ['Reforço escolar', 'Informática', 'Música', 'Dança', 'Artesanato', 'Assistência', 'Evento', 'Outro']

const schema = z.object({
  titulo: z.string().trim().min(1, 'Informe o nome da atividade.'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  tipo: z.string().trim().min(1, 'Escolha a área.'),
  participantes: z.union([z.number().int('Use um número inteiro.').min(0, 'Não pode ser negativo.'), z.literal('')]),
})
type Form = z.infer<typeof schema>
const emptyValues = (): Form => ({ titulo: '', data: todayISO(), tipo: '', participantes: '' })

/**
 * Oficinas e ações. Quem edita (admin e administrativo) cria atividades e registra a presença das crianças;
 * voluntários só consultam, sem ver nomes de crianças.
 */
export default function ActivitiesPage() {
  const activities = useActivities()
  const children = useChildren()
  const canEdit = can(useSessionUser()?.perfil, 'atividades.editar')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [toDelete, setToDelete] = useState<Activity | null>(null)
  const [attId, setAttId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: emptyValues(), mode: 'onTouched' })
  const total = activities.reduce((s, a) => s + a.participantes, 0)
  const withAttendance = activities.filter((a) => a.presentes).length

  const typeOptions = useMemo(() => {
    const set = new Set([...DEFAULT_TYPES, ...activities.map((a) => a.tipo).filter(Boolean)])
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({ value: v, label: v }))
  }, [activities])

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(a: Activity) {
    setEditing(a)
    form.reset({ titulo: a.titulo, data: a.data, tipo: a.tipo, participantes: a.participantes })
    setFormOpen(true)
  }
  function save(v: Form) {
    const presentes = editing?.presentes
    const participantes = presentes ? presentes.length : v.participantes === '' ? 0 : v.participantes
    const saved = activitiesRepo.save({ titulo: v.titulo, data: v.data, tipo: v.tipo, participantes, ...(presentes ? { presentes } : {}) }, editing?.id)
    toast.success(editing ? 'Atividade atualizada.' : 'Atividade cadastrada.', { description: saved.titulo })
    setFormOpen(false)
  }

  const attActivity = activities.find((a) => a.id === attId) ?? null
  const roster = useMemo(() => children.filter((c) => c.status !== 'concluido').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [children])
  function openAttendance(a: Activity) {
    setSelected(new Set(a.presentes ?? []))
    setAttId(a.id)
  }
  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }
  function saveAttendance() {
    if (!attActivity) return
    activitiesRepo.setAttendance(attActivity.id, [...selected])
    toast.success('Presença registrada.', { description: `${attActivity.titulo}: ${selected.size} presente(s).` })
    setAttId(null)
  }

  const frequency = useMemo(() => attendanceByChild(activities, children), [activities, children])

  const columns = useMemo<ColumnDef<Activity, any>[]>(
    () => [
      {
        id: 'data',
        accessorFn: (a) => a.data,
        sortingFn: dateSort,
        meta: { title: 'Data' },
        header: ({ column }) => <SortableHeader column={column} title="Data" />,
        cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span>,
      },
      {
        id: 'titulo',
        accessorFn: (a) => a.titulo,
        sortingFn: textSort,
        meta: { title: 'Atividade' },
        header: ({ column }) => <SortableHeader column={column} title="Atividade" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      {
        id: 'tipo',
        accessorFn: (a) => a.tipo,
        sortingFn: textSort,
        meta: { title: 'Área' },
        header: ({ column }) => <SortableHeader column={column} title="Área" />,
      },
      {
        id: 'participantes',
        accessorFn: (a) => a.participantes,
        sortingFn: numberSort,
        meta: { title: 'Participações', className: 'text-right' },
        header: ({ column }) => <SortableHeader column={column} title="Participações" align="right" />,
        cell: ({ row }) => (
          <span className="tabular">
            {formatNumber(row.original.participantes)}
            {canEdit && row.original.presentes ? <span className="block text-[11px] text-muted-foreground">com lista de presença</span> : null}
          </span>
        ),
      },
    ],
    [canEdit],
  )

  const rowActions = (): RowAction<Activity>[] =>
    canEdit
      ? [
          { id: 'presenca', label: 'Registrar presença', icon: <ClipboardCheckIcon />, onSelect: openAttendance },
          { id: 'editar', label: 'Editar atividade', icon: <PencilIcon />, onSelect: openEdit },
          { id: 'remover', label: 'Remover atividade', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
        ]
      : []

  return (
    <div>
      <PageHeader
        title="Atividades"
        description={canEdit ? 'Oficinas e ações do Instituto. Registre a presença das crianças em cada uma.' : 'Oficinas e ações realizadas pelo Instituto. Somente consulta.'}
        actions={
          canEdit ? (
            <Button onClick={openCreate}>
              <PlusIcon />
              Nova atividade
            </Button>
          ) : undefined
        }
      />
      <StatStrip
        label="Resumo das atividades"
        items={canEdit ? [['Atividades registradas', activities.length], ['Participações', total], ['Com lista de presença', withAttendance]] : [['Atividades registradas', activities.length], ['Participações', total]]}
      />
      <DataTable<Activity>
        id="activities-view"
        caption="Atividades"
        data={activities}
        columns={columns}
        getRowId={(a) => a.id}
        searchText={(a) => `${a.titulo} ${a.tipo}`}
        searchPlaceholder="Buscar por atividade ou área"
        initialSort={[{ id: 'data', desc: true }]}
        rowActions={rowActions}
        noun={['atividade', 'atividades']}
        empty={{
          title: 'Nenhuma atividade registrada',
          description: canEdit ? 'Cadastre a primeira oficina ou ação do Instituto.' : 'As atividades aparecem aqui quando forem registradas pela equipe.',
          action: canEdit ? (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Nova atividade
            </Button>
          ) : undefined,
        }}
      />

      {canEdit ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Frequência por criança</CardTitle>
            <CardDescription>
              Considera só as atividades com lista de presença ({withAttendance}). Quem tem menos presença aparece primeiro, para facilitar o contato com a família.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {withAttendance === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">
                Registre a presença em uma atividade (menu da linha → Registrar presença) para ver a frequência.
              </p>
            ) : (
              <div className="max-h-96 overflow-auto rounded-md border">
                <Table>
                  <caption className="sr-only">Frequência por criança</caption>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Criança</TableHead>
                      <TableHead className="text-right">Presenças</TableHead>
                      <TableHead className="text-right">Frequência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {frequency.map((f) => (
                      <TableRow key={f.child.id}>
                        <TableCell className="font-medium">{f.child.nome}</TableCell>
                        <TableCell className="text-right tabular">{f.present} de {f.possible}</TableCell>
                        <TableCell className="text-right tabular">{f.possible ? formatPercent((f.present / f.possible) * 100) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar atividade' : 'Nova atividade'}
        description={editing ? editing.titulo : 'Oficina, ação ou evento realizado.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Cadastrar atividade'}
      >
        <FormSection title="A atividade">
          <TextField control={form.control} name="titulo" label="Nome" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <TextField control={form.control} name="data" label="Data" type="date" required />
          <SelectField control={form.control} name="tipo" label="Área" required options={typeOptions} />
          {editing?.presentes ? (
            <p className="text-[13px] text-muted-foreground sm:col-span-2">O total de participações vem da lista de presença ({editing.presentes.length}).</p>
          ) : (
            <NumberField control={form.control} name="participantes" label="Participações" min={0} description="Total de participantes. Se registrar a presença depois, o número é calculado pela lista." className="sm:col-span-2" />
          )}
        </FormSection>
      </FormSheet>

      <Sheet open={Boolean(attActivity)} onOpenChange={(o) => !o && setAttId(null)}>
        <SheetContent>
          {attActivity ? (
            <>
              <SheetHeader>
                <SheetTitle>Presença</SheetTitle>
                <SheetDescription>
                  {attActivity.titulo} · {formatDateBR(attActivity.data)}
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[13px] text-muted-foreground" aria-live="polite">
                    {selected.size} de {roster.length} presentes
                  </p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(roster.map((c) => c.id)))}>
                      Marcar todos
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                      Limpar
                    </Button>
                  </div>
                </div>
                {roster.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nenhuma criança ativa cadastrada.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {roster.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/50">
                          <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => toggle(c.id, v === true)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{c.nome}</span>
                            <span className="block text-xs text-muted-foreground">{c.idade} anos</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </SheetBody>
              <SheetFooter>
                <Button variant="outline" onClick={() => setAttId(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveAttendance}>Salvar presença</Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover esta atividade?"
        description={
          <p>
            <strong>{toDelete?.titulo}</strong> será removida, junto com a lista de presença, e deixará de contar nos relatórios e nos números do site. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover atividade"
        onConfirm={() => {
          if (!toDelete) return
          activitiesRepo.remove(toDelete.id)
          toast.success('Atividade removida.', { description: toDelete.titulo })
          setToDelete(null)
        }}
      />
    </div>
  )
}
