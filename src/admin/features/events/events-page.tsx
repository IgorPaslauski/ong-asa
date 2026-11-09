import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { EyeIcon, EyeOffIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge, type BadgeVariant } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { dateSort, enumSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { SwitchField, TextField, TextareaField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { eventsRepo, useEvents } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatDateBR, todayISO } from '@/admin/lib/format'
import type { EventItem } from '@/data/mock'
import { formatEventTime } from '@/lib/publicEvents'

type Situacao = 'publicado' | 'rascunho' | 'realizado'
const SITUACAO_LABEL: Record<Situacao, string> = { publicado: 'No site', rascunho: 'Rascunho', realizado: 'Realizado' }
const SITUACAO_VARIANT: Record<Situacao, BadgeVariant> = { publicado: 'success', rascunho: 'warning', realizado: 'muted' }
const SITUACAO_ORDER: Situacao[] = ['publicado', 'rascunho', 'realizado']

const time = z.string().regex(/^(\d{2}:\d{2})?$/, 'Informe um horário válido.')
const eventSchema = z
  .object({
    titulo: z.string().trim().min(1, 'Informe o título do evento.').max(100, 'Use até 100 caracteres.'),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data do evento.'),
    horaInicio: time,
    horaFim: time,
    local: z.string().trim().max(120, 'Use até 120 caracteres.'),
    descricao: z.string().trim().max(400, 'Use até 400 caracteres.'),
    publicado: z.boolean(),
  })
  .refine((v) => !v.horaFim || !!v.horaInicio, { path: ['horaInicio'], message: 'Informe o horário de início.' })
  .refine((v) => !v.horaFim || !v.horaInicio || v.horaFim > v.horaInicio, { path: ['horaFim'], message: 'O término deve ser depois do início.' })
type EventForm = z.infer<typeof eventSchema>

const emptyValues = (): EventForm => ({ titulo: '', data: '', horaInicio: '', horaFim: '', local: '', descricao: '', publicado: true })

interface Row extends EventItem {
  situacao: Situacao
}

function situacaoOf(e: EventItem, today: string): Situacao {
  if (e.data < today) return 'realizado'
  return e.publicado ? 'publicado' : 'rascunho'
}

export default function EventsPage() {
  const events = useEvents()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [toDelete, setToDelete] = useState<EventItem | null>(null)
  const today = todayISO()

  const form = useForm<EventForm>({ resolver: zodResolver(eventSchema), defaultValues: emptyValues(), mode: 'onTouched' })

  const rows = useMemo<Row[]>(() => events.map((e) => ({ ...e, situacao: situacaoOf(e, today) })), [events, today])

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(e: EventItem) {
    setEditing(e)
    form.reset({ titulo: e.titulo, data: e.data, horaInicio: e.horaInicio, horaFim: e.horaFim, local: e.local, descricao: e.descricao, publicado: e.publicado })
    setFormOpen(true)
  }
  useEffect(() => {
    if (params.get('novo') === '1') {
      openCreate()
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line
  }, [params])

  function save(values: EventForm) {
    const saved = eventsRepo.save(values, editing?.id)
    toast.success(editing ? 'Evento atualizado.' : values.publicado ? 'Evento cadastrado e publicado no site.' : 'Evento salvo como rascunho.', { description: saved.titulo })
    setFormOpen(false)
  }

  const counts = useMemo(() => {
    const c = { total: rows.length, noSite: 0, rascunho: 0, realizado: 0 }
    for (const r of rows) {
      if (r.situacao === 'publicado') c.noSite += 1
      else if (r.situacao === 'rascunho') c.rascunho += 1
      else c.realizado += 1
    }
    return c
  }, [rows])

  const columns = useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        id: 'titulo',
        accessorFn: (e) => e.titulo,
        sortingFn: textSort,
        meta: { title: 'Evento' },
        header: ({ column }) => <SortableHeader column={column} title="Evento" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <button type="button" className="block max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openEdit(row.original)}>
              {row.original.titulo}
            </button>
            {row.original.descricao ? <span className="block max-w-md truncate text-xs text-muted-foreground">{row.original.descricao}</span> : null}
          </div>
        ),
      },
      {
        id: 'quando',
        accessorFn: (e) => `${e.data}T${e.horaInicio || '00:00'}`,
        sortingFn: dateSort,
        meta: { title: 'Data e horário' },
        header: ({ column }) => <SortableHeader column={column} title="Data e horário" />,
        cell: ({ row }) => (
          <div className="tabular">
            {formatDateBR(row.original.data)}
            {formatEventTime(row.original) ? <span className="block text-xs text-muted-foreground">{formatEventTime(row.original)}</span> : null}
          </div>
        ),
      },
      {
        id: 'local',
        accessorFn: (e) => e.local,
        sortingFn: textSort,
        meta: { title: 'Local' },
        header: ({ column }) => <SortableHeader column={column} title="Local" />,
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'situacao',
        accessorFn: (e) => e.situacao,
        sortingFn: enumSort(SITUACAO_ORDER),
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ getValue }) => <Badge variant={SITUACAO_VARIANT[getValue<Situacao>()]}>{SITUACAO_LABEL[getValue<Situacao>()]}</Badge>,
      },
    ],
    // eslint-disable-next-line
    [],
  )

  const filters = useMemo<FilterDef<Row>[]>(
    () => [
      {
        id: 'situacao',
        type: 'select',
        label: 'Situação',
        options: SITUACAO_ORDER.map((v) => ({ value: v, label: SITUACAO_LABEL[v] })),
        match: (e, v) => e.situacao === v,
      },
    ],
    [],
  )

  const rowActions = useMemo(
    () =>
      (e: Row): RowAction<Row>[] => [
        { id: 'editar', label: 'Editar evento', icon: <PencilIcon />, onSelect: openEdit },
        {
          id: 'toggle',
          label: e.publicado ? 'Tirar do site (virar rascunho)' : 'Publicar no site',
          icon: e.publicado ? <EyeOffIcon /> : <EyeIcon />,
          hidden: e.situacao === 'realizado',
          onSelect: (x) => {
            eventsRepo.setPublished(x.id, !x.publicado)
            toast.success(x.publicado ? 'Evento retirado do site.' : 'Evento publicado no site.', { description: x.titulo })
          },
        },
        { id: 'remover', label: 'Remover evento', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
      ],
    // eslint-disable-next-line
    [],
  )

  const exportColumns: ExportColumn<Row>[] = [
    { header: 'Evento', value: (e) => e.titulo },
    { header: 'Data', value: (e) => formatDateBR(e.data) },
    { header: 'Horário', value: (e) => formatEventTime(e) },
    { header: 'Local', value: (e) => e.local },
    { header: 'Situação', value: (e) => SITUACAO_LABEL[e.situacao] },
  ]

  return (
    <div>
      <PageHeader
        title="Eventos"
        description="Agenda de eventos futuros. Os publicados aparecem automaticamente na página inicial do site."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Novo evento
          </Button>
        }
      />

      <StatStrip label="Resumo dos eventos" items={[['Eventos cadastrados', counts.total], ['No site', counts.noSite], ['Rascunhos', counts.rascunho], ['Realizados', counts.realizado]]} />

      <DataTable<Row>
        id="events"
        caption="Eventos"
        data={rows}
        columns={columns}
        getRowId={(e) => e.id}
        searchText={(e) => `${e.titulo} ${e.local} ${e.descricao}`}
        searchPlaceholder="Buscar por título, local ou descrição"
        filters={filters}
        initialSort={[{ id: 'quando', desc: false }]}
        rowActions={rowActions}
        noun={['evento', 'eventos']}
        empty={{
          title: 'Nenhum evento cadastrado ainda',
          description: 'Cadastre os próximos eventos do Instituto. Os publicados aparecem na página inicial do site.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Novo evento
            </Button>
          ),
        }}
        exportConfig={{ filename: 'eventos', title: 'Eventos', subtitle: 'Agenda de eventos do Instituto A.S.A.', columns: exportColumns }}
        exportPeriod="Todo o histórico"
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar evento' : 'Novo evento'}
        description={editing ? editing.titulo : 'Preencha o que o público precisa saber.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Cadastrar evento'}
      >
        <FormSection title="O evento">
          <TextField control={form.control} name="titulo" label="Título" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <TextareaField
            control={form.control}
            name="descricao"
            label="Descrição"
            rows={3}
            className="sm:col-span-2"
            description="Texto curto para o site (até 400 caracteres)."
          />
        </FormSection>
        <FormSection title="Quando e onde">
          <TextField control={form.control} name="data" label="Data" type="date" required className="sm:col-span-2" />
          <TextField control={form.control} name="horaInicio" label="Início" type="time" />
          <TextField control={form.control} name="horaFim" label="Término" type="time" />
          <TextField control={form.control} name="local" label="Local" className="sm:col-span-2" autoComplete="off" placeholder="Ex.: sede do Instituto" />
        </FormSection>
        <FormSection title="Publicação">
          <SwitchField
            control={form.control}
            name="publicado"
            label="Mostrar no site"
            description="Tudo o que está neste formulário fica visível ao público. Não inclua dados pessoais de crianças ou famílias. Desative para guardar como rascunho."
            className="sm:col-span-2"
          />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este evento?"
        description={
          <p>
            <strong>{toDelete?.titulo}</strong> será removido do painel e do site neste navegador. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover evento"
        onConfirm={() => {
          if (!toDelete) return
          eventsRepo.remove(toDelete.id)
          toast.success('Evento removido.', { description: toDelete.titulo })
          setToDelete(null)
        }}
      />
    </div>
  )
}
