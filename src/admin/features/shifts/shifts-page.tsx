import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import { Button } from '@/admin/components/ui/button'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { dateSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import type { RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { MultiPickField } from '@/admin/components/forms/multi-pick'
import { PageHeader } from '@/admin/components/layout/page-header'
import { findConflicts, hoursByVolunteer, shiftHours, shifts, type Shift } from '@/admin/data/modules'
import { useHelpers } from '@/admin/data/store'
import { formatDateBR, formatNumber, todayISO } from '@/admin/lib/format'
import { useSessionUser } from '@/lib/auth'

const time = z.string().regex(/^(\d{2}:\d{2})?$/, 'Use o formato HH:MM.')
const schema = z
  .object({
    titulo: z.string().trim().min(1, 'Informe a atividade ou tarefa.'),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
    horaInicio: time,
    horaFim: time,
    local: z.string().trim(),
    voluntarios: z.array(z.string()),
  })
  .refine((v) => !v.horaFim || !!v.horaInicio, { path: ['horaInicio'], message: 'Informe o horário de início.' })
  .refine((v) => !v.horaFim || !v.horaInicio || v.horaFim > v.horaInicio, { path: ['horaFim'], message: 'O término deve ser depois do início.' })
type Form = z.infer<typeof schema>
const emptyValues = (): Form => ({ titulo: '', data: todayISO(), horaInicio: '', horaFim: '', local: '', voluntarios: [] })

const hoursLabel = (h: number) => (h ? `${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h` : '—')

function timeText(s: Shift) {
  if (!s.horaInicio) return '—'
  return s.horaFim ? `${s.horaInicio} às ${s.horaFim}` : `a partir das ${s.horaInicio}`
}

/** Escala completa (admin e administrativo): turnos, quem foi escalado e horas voluntariadas. */
export default function ShiftsPage() {
  const list = shifts.useAll()
  const helpers = useHelpers()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [toDelete, setToDelete] = useState<Shift | null>(null)
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: emptyValues(), mode: 'onTouched' })
  const today = todayISO()

  const nameOf = useMemo(() => new Map(helpers.map((h) => [h.id, h.nome])), [helpers])
  const options = useMemo(
    () => helpers.filter((h) => h.papel === 'voluntario' && h.ativo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((h) => ({ value: h.id, label: h.nome, hint: h.telefone })),
    [helpers],
  )
  const hours = useMemo(() => hoursByVolunteer(list, helpers, today), [list, helpers, today])
  const upcoming = list.filter((s) => s.data >= today).length

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(s: Shift) {
    setEditing(s)
    form.reset({ titulo: s.titulo, data: s.data, horaInicio: s.horaInicio, horaFim: s.horaFim, local: s.local, voluntarios: s.voluntarios })
    setFormOpen(true)
  }
  function save(v: Form) {
    const clash = findConflicts(v, list.filter((s) => s.id !== editing?.id))
    if (clash.length) {
      const names = clash.map((id) => nameOf.get(id) ?? id).join(', ')
      form.setError('voluntarios', { message: `Já escalado(s) em outro turno no mesmo horário: ${names}.` })
      throw new Error(`Conflito de horário: ${names}.`)
    }
    const saved = shifts.save(v, editing?.id)
    toast.success(editing ? 'Turno atualizado.' : 'Turno criado.', { description: `${saved.titulo} · ${formatDateBR(saved.data)}` })
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Shift, any>[]>(
    () => [
      { id: 'data', accessorFn: (s) => `${s.data} ${s.horaInicio}`, sortingFn: dateSort, meta: { title: 'Quando' }, header: ({ column }) => <SortableHeader column={column} title="Quando" />, cell: ({ row }) => (
        <div>
          <span className="block tabular font-medium">{formatDateBR(row.original.data)}</span>
          <span className="block text-xs text-muted-foreground tabular">{timeText(row.original)}</span>
        </div>
      ) },
      { id: 'titulo', accessorFn: (s) => s.titulo, sortingFn: textSort, meta: { title: 'Atividade' }, header: ({ column }) => <SortableHeader column={column} title="Atividade" />, cell: ({ row }) => (
        <div className="min-w-0">
          <span className="block truncate font-medium">{row.original.titulo}</span>
          {row.original.local ? <span className="block truncate text-xs text-muted-foreground">{row.original.local}</span> : null}
        </div>
      ) },
      { id: 'voluntarios', accessorFn: (s) => s.voluntarios.length, sortingFn: numberSort, meta: { title: 'Escalados' }, header: ({ column }) => <SortableHeader column={column} title="Escalados" />, cell: ({ row }) => {
        const names = row.original.voluntarios.map((id) => nameOf.get(id)).filter(Boolean) as string[]
        return names.length ? <span className="line-clamp-2 text-[13px]">{names.join(', ')}</span> : <span className="text-muted-foreground">Ninguém escalado</span>
      } },
      { id: 'horas', accessorFn: (s) => shiftHours(s), sortingFn: numberSort, meta: { title: 'Duração', className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title="Duração" align="right" />, cell: ({ getValue }) => <span className="tabular">{hoursLabel(getValue<number>())}</span> },
    ],
    [nameOf],
  )

  const rowActions = (): RowAction<Shift>[] => [
    { id: 'editar', label: 'Editar turno', icon: <PencilIcon />, onSelect: openEdit },
    { id: 'remover', label: 'Remover turno', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
  ]

  return (
    <div>
      <PageHeader
        title="Escala de voluntários"
        description="Quem fica em qual atividade e em qual horário. As horas voluntariadas saem dos turnos já realizados."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Novo turno
          </Button>
        }
      />
      <StatStrip label="Resumo da escala" items={[['Turnos', list.length], ['Próximos', upcoming], ['Voluntários com horas', hours.length]]} />
      <DataTable<Shift>
        id="shifts"
        caption="Turnos da escala"
        data={list}
        columns={columns}
        getRowId={(s) => s.id}
        searchText={(s) => `${s.titulo} ${s.local} ${s.voluntarios.map((id) => nameOf.get(id) ?? '').join(' ')}`}
        searchPlaceholder="Buscar por atividade, local ou voluntário"
        initialSort={[{ id: 'data', desc: true }]}
        rowActions={rowActions}
        noun={['turno', 'turnos']}
        empty={{
          title: 'Nenhum turno na escala',
          description: 'Crie um turno e escolha quais voluntários participam.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Novo turno
            </Button>
          ),
        }}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Horas voluntariadas</CardTitle>
          <CardDescription>Soma dos turnos já realizados (data até hoje), com horário de início e término.</CardDescription>
        </CardHeader>
        <CardContent>
          {hours.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Ainda não há turnos realizados com voluntários escalados.</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <caption className="sr-only">Horas voluntariadas por pessoa</caption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Voluntário</TableHead>
                    <TableHead className="text-right">Turnos</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hours.map((h) => (
                    <TableRow key={h.helper.id}>
                      <TableCell className="font-medium">{h.helper.nome}</TableCell>
                      <TableCell className="text-right tabular">{formatNumber(h.turnos)}</TableCell>
                      <TableCell className="text-right tabular">{hoursLabel(h.horas)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar turno' : 'Novo turno'}
        description={editing ? editing.titulo : 'Escolha a atividade, o horário e quem participa.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Criar turno'}
      >
        <FormSection title="O turno">
          <TextField control={form.control} name="titulo" label="Atividade ou tarefa" required autoFocus className="sm:col-span-2" autoComplete="off" placeholder="Ex.: Reforço escolar — turma da tarde" />
          <TextField control={form.control} name="data" label="Data" type="date" required className="sm:col-span-2" />
          <TextField control={form.control} name="horaInicio" label="Início" type="time" />
          <TextField control={form.control} name="horaFim" label="Término" type="time" />
          <TextField control={form.control} name="local" label="Local" className="sm:col-span-2" autoComplete="off" />
        </FormSection>
        <FormSection title="Voluntários">
          <MultiPickField control={form.control} name="voluntarios" label="Quem participa" options={options} empty="Nenhum voluntário ativo na rede de apoio." className="sm:col-span-2" description="Mostra voluntários ativos da rede de apoio." />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este turno?"
        description={
          <p>
            <strong>{toDelete?.titulo}</strong> ({toDelete ? formatDateBR(toDelete.data) : ''}) será removido e as horas deixam de contar. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover turno"
        onConfirm={() => {
          if (!toDelete) return
          shifts.remove(toDelete.id)
          toast.success('Turno removido.', { description: toDelete.titulo })
          setToDelete(null)
        }}
      />
    </div>
  )
}

/** Escala do próprio voluntário (só os turnos em que ele está). Sem dados de terceiros. */
export function MyShiftsPage() {
  const user = useSessionUser()
  const list = shifts.useAll()
  const helperId = user?.helperId ?? ''
  const today = todayISO()
  const mine = useMemo(() => list.filter((s) => helperId && s.voluntarios.includes(helperId)).sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio)), [list, helperId])
  const next = mine.filter((s) => s.data >= today)
  const done = mine.filter((s) => s.data < today)
  const totalHours = done.reduce((s, x) => s + shiftHours(x), 0)

  return (
    <div>
      <PageHeader title="Minha escala" description="Seus turnos como voluntário no Instituto A.S.A." />
      {!helperId ? (
        <Alert variant="info">
          <AlertDescription>Sua conta ainda não está vinculada a um cadastro de voluntário. Peça à administração para fazer o vínculo.</AlertDescription>
        </Alert>
      ) : (
        <>
          <StatStrip label="Resumo da minha escala" items={[['Próximos turnos', next.length], ['Turnos realizados', done.length], ['Horas voluntariadas', hoursLabel(totalHours)]]} />
          <Card>
            <CardHeader>
              <CardTitle>Próximos turnos</CardTitle>
            </CardHeader>
            <CardContent>
              {next.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nenhum turno marcado para você por enquanto.</p>
              ) : (
                <ul className="divide-y">
                  {next.map((s) => (
                    <li key={s.id} className="py-2.5">
                      <p className="text-sm font-medium">{s.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBR(s.data)} · {timeText(s)}
                        {s.local ? ` · ${s.local}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
