import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { EyeIcon, HeartHandshakeIcon, PencilIcon, PlusIcon, PowerIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/admin/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { booleanSort, dateSort, enumSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { ActiveBadge, DonationStatusBadge, DonationTypeTag, RoleTag } from '@/admin/components/feedback/status-badge'
import { Detail, SelectField, SwitchField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { donationsOfHelper, summarizeDonations } from '@/admin/data/domain'
import { helpersRepo, useDonations, useHelpers } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatBRL, formatDateBR, todayISO } from '@/admin/lib/format'
import { ROLE_LABEL, type Donation, type Helper, type HelperRole } from '@/data/mock'
import { ORG } from '@/data/org'

const ROLE_ORDER: HelperRole[] = ['doador', 'padrinho', 'parceiro', 'voluntario']
const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as HelperRole[]).map((v) => ({ value: v, label: ROLE_LABEL[v] }))

/** Regras originais: nome e e-mail obrigatórios (e-mail em formato válido). */
const helperSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('Informe um e-mail válido.')),
  telefone: z.string().trim(),
  papel: z.enum(['voluntario', 'doador', 'padrinho', 'parceiro']),
  cidade: z.string().trim(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  ativo: z.boolean(),
})
type HelperForm = z.infer<typeof helperSchema>

const emptyValues = (): HelperForm => ({ nome: '', email: '', telefone: '', papel: 'voluntario', cidade: ORG.city ?? 'Condor', desde: todayISO(), ativo: true })

interface Row extends Helper {
  donationsCount: number
  cash: number
  inKind: number
}

export default function PeoplePage() {
  const helpers = useHelpers()
  const donations = useDonations()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Helper | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Helper | null>(null)

  const form = useForm<HelperForm>({ resolver: zodResolver(helperSchema), defaultValues: emptyValues(), mode: 'onTouched' })

  const rows = useMemo<Row[]>(
    () =>
      helpers.map((h) => {
        const mine = donationsOfHelper(h, donations)
        const t = summarizeDonations(mine)
        return { ...h, donationsCount: t.confirmedCount, cash: t.cashReceived, inKind: t.inKindEstimate }
      }),
    [helpers, donations],
  )
  const detail = rows.find((r) => r.id === detailId) ?? null

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(h: Helper) {
    setEditing(h)
    form.reset({ nome: h.nome, email: h.email, telefone: h.telefone, papel: h.papel, cidade: h.cidade, desde: h.desde, ativo: h.ativo })
    setDetailId(null)
    setFormOpen(true)
  }
  useEffect(() => {
    if (params.get('novo') === '1') {
      openCreate()
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line
  }, [params])

  function save(values: HelperForm) {
    const saved = helpersRepo.save(values, editing?.id)
    toast.success(editing ? 'Cadastro atualizado.' : 'Pessoa cadastrada na rede de apoio.', { description: saved.nome })
    setFormOpen(false)
  }

  const counts = useMemo(() => {
    const c = { total: helpers.length, ativos: 0, doador: 0, voluntario: 0 }
    for (const h of helpers) {
      if (h.ativo) c.ativos += 1
      if (h.papel === 'doador') c.doador += 1
      if (h.papel === 'voluntario') c.voluntario += 1
    }
    return c
  }, [helpers])

  const columns = useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        id: 'nome',
        accessorFn: (h) => h.nome,
        sortingFn: textSort,
        meta: { title: 'Nome' },
        header: ({ column }) => <SortableHeader column={column} title="Nome" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <button type="button" className="block max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setDetailId(row.original.id)}>
              {row.original.nome}
            </button>
            <span className="block truncate text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        id: 'papel',
        accessorFn: (h) => h.papel,
        sortingFn: enumSort(ROLE_ORDER),
        meta: { title: 'Participação' },
        header: ({ column }) => <SortableHeader column={column} title="Participação" />,
        cell: ({ getValue }) => <RoleTag role={getValue<HelperRole>()} />,
      },
      {
        id: 'cidade',
        accessorFn: (h) => h.cidade,
        sortingFn: textSort,
        meta: { title: 'Cidade' },
        header: ({ column }) => <SortableHeader column={column} title="Cidade" />,
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'telefone',
        accessorFn: (h) => h.telefone,
        sortingFn: textSort,
        meta: { title: 'Telefone' },
        header: ({ column }) => <SortableHeader column={column} title="Telefone" />,
        cell: ({ getValue }) => <span className="tabular">{getValue<string>() || '—'}</span>,
      },
      {
        id: 'desde',
        accessorFn: (h) => h.desde,
        sortingFn: dateSort,
        meta: { title: 'Na rede desde' },
        header: ({ column }) => <SortableHeader column={column} title="Na rede desde" />,
        cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span>,
      },
      {
        id: 'donationsCount',
        accessorFn: (h) => h.donationsCount,
        sortingFn: numberSort,
        meta: { title: 'Doações confirmadas', className: 'text-right' },
        header: ({ column }) => <SortableHeader column={column} title="Doações" align="right" />,
        cell: ({ getValue }) => <span className="tabular">{getValue<number>()}</span>,
      },
      {
        id: 'cash',
        accessorFn: (h) => h.cash,
        sortingFn: numberSort,
        meta: { title: 'Dinheiro recebido', className: 'text-right' },
        header: ({ column }) => <SortableHeader column={column} title="Dinheiro recebido" align="right" />,
        cell: ({ getValue }) => <span className="tabular">{getValue<number>() ? formatBRL(getValue<number>()) : '—'}</span>,
      },
      {
        id: 'ativo',
        accessorFn: (h) => h.ativo,
        sortingFn: booleanSort,
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
      },
    ],
    [],
  )

  const filters = useMemo<FilterDef<Row>[]>(() => {
    const cities = [...new Set(helpers.map((h) => h.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({ value: v, label: v }))
    return [
      { id: 'papel', type: 'select', label: 'Participação', options: ROLE_OPTIONS, match: (h, v) => h.papel === v },
      { id: 'ativo', type: 'select', label: 'Situação', options: [{ value: 'ativo', label: 'Ativos' }, { value: 'inativo', label: 'Inativos' }], match: (h, v) => (v === 'ativo' ? h.ativo : !h.ativo) },
      { id: 'cidade', type: 'select', label: 'Cidade', options: cities, match: (h, v) => h.cidade === v },
    ]
  }, [helpers])

  const rowActions = useMemo(
    () =>
      (h: Row): RowAction<Row>[] => [
        { id: 'ver', label: 'Ver detalhes e histórico', icon: <EyeIcon />, onSelect: (x) => setDetailId(x.id) },
        { id: 'editar', label: 'Editar cadastro', icon: <PencilIcon />, onSelect: openEdit },
        {
          id: 'toggle',
          label: h.ativo ? 'Marcar como inativo' : 'Marcar como ativo',
          icon: <PowerIcon />,
          onSelect: (x) => {
            helpersRepo.setActive(x.id, !x.ativo)
            toast.success(x.ativo ? 'Marcado como inativo.' : 'Marcado como ativo.', { description: x.nome })
          },
        },
        { id: 'remover', label: 'Remover cadastro', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
      ],
    // eslint-disable-next-line
    [],
  )

  // Exportação sem e-mail/telefone: apenas dados de participação.
  const exportColumns: ExportColumn<Row>[] = [
    { header: 'Nome', value: (h) => h.nome },
    { header: 'Participação', value: (h) => ROLE_LABEL[h.papel] },
    { header: 'Cidade', value: (h) => h.cidade },
    { header: 'Na rede desde', value: (h) => formatDateBR(h.desde) },
    { header: 'Situação', value: (h) => (h.ativo ? 'Ativo' : 'Inativo') },
    { header: 'Doações confirmadas', value: (h) => h.donationsCount, align: 'right' },
    { header: 'Dinheiro recebido (R$)', value: (h) => formatBRL(h.cash), align: 'right' },
    { header: 'Estimativa de bens/serviços (R$)', value: (h) => formatBRL(h.inKind), align: 'right' },
  ]

  const history: Donation[] = detail ? donationsOfHelper(detail, donations) : []
  const linked = toDelete ? donationsOfHelper(toDelete, donations).length : 0

  return (
    <div>
      <PageHeader
        title="Rede de apoio"
        description="Doadores, voluntários, padrinhos e parceiros do Instituto, com histórico de contribuições."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nova pessoa
          </Button>
        }
      />

      <StatStrip label="Resumo da rede de apoio" items={[['Pessoas e organizações', counts.total], ['Ativas', counts.ativos], ['Doadores', counts.doador], ['Voluntários', counts.voluntario]]} />

      <DataTable<Row>
        id="people"
        caption="Rede de apoio"
        data={rows}
        columns={columns}
        getRowId={(h) => h.id}
        searchText={(h) => `${h.nome} ${h.email} ${h.cidade} ${ROLE_LABEL[h.papel]}`}
        searchPlaceholder="Buscar por nome, e-mail ou cidade"
        filters={filters}
        initialSort={[{ id: 'nome', desc: false }]}
        defaultColumnVisibility={{ telefone: false }}
        rowActions={rowActions}
        noun={['pessoa', 'pessoas']}
        empty={{
          title: 'Nenhuma pessoa cadastrada ainda',
          description: 'Cadastre doadores, voluntários, padrinhos e parceiros para registrar contribuições.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Nova pessoa
            </Button>
          ),
        }}
        exportConfig={{
          filename: 'rede-de-apoio',
          title: 'Rede de apoio',
          subtitle: 'Exportação sem e-mail nem telefone. Valores em dinheiro consideram apenas doações financeiras confirmadas.',
          columns: exportColumns,
        }}
        exportPeriod="Todo o histórico"
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar cadastro' : 'Nova pessoa na rede de apoio'}
        description={editing ? editing.nome : 'Registre quem apoia o Instituto.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Cadastrar'}
      >
        <FormSection title="Identificação">
          <TextField control={form.control} name="nome" label="Nome ou organização" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <SelectField control={form.control} name="papel" label="Tipo de participação" required options={ROLE_OPTIONS} />
          <TextField control={form.control} name="desde" label="Na rede desde" type="date" required />
        </FormSection>
        <FormSection title="Contato">
          <TextField control={form.control} name="email" label="E-mail" type="email" required autoComplete="off" className="sm:col-span-2" />
          <TextField control={form.control} name="telefone" label="Telefone" type="tel" placeholder="(55) 99999-9999" autoComplete="off" />
          <TextField control={form.control} name="cidade" label="Cidade" autoComplete="off" />
        </FormSection>
        <FormSection title="Situação">
          <SwitchField control={form.control} name="ativo" label="Participação ativa" description="Desative quando a pessoa deixar de apoiar, sem apagar o histórico." className="sm:col-span-2" />
        </FormSection>
      </FormSheet>

      <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="sm:w-[40rem]">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.nome}</SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleTag role={detail.papel} />
                    <ActiveBadge active={detail.ativo} />
                  </div>
                </SheetDescription>
              </SheetHeader>
              <SheetBody className="space-y-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail label="E-mail">{detail.email}</Detail>
                  <Detail label="Telefone">{detail.telefone}</Detail>
                  <Detail label="Cidade">{detail.cidade}</Detail>
                  <Detail label="Na rede desde">{formatDateBR(detail.desde)}</Detail>
                </dl>
                <section aria-labelledby="hist">
                  <h3 id="hist" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <HeartHandshakeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    Histórico de contribuições
                  </h3>
                  <ul className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <li><Card className="px-2 py-2"><span className="text-xs text-muted-foreground">Doações confirmadas</span><strong className="block font-semibold tabular">{detail.donationsCount}</strong></Card></li>
                    <li><Card className="px-2 py-2"><span className="text-xs text-muted-foreground">Dinheiro recebido</span><strong className="block font-semibold tabular">{formatBRL(detail.cash)}</strong></Card></li>
                    <li><Card className="px-2 py-2"><span className="text-xs text-muted-foreground">Bens/serviços (estim.)</span><strong className="block font-semibold tabular">{formatBRL(detail.inKind)}</strong></Card></li>
                  </ul>
                  {history.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nenhuma contribuição registrada para esta pessoa.</p>
                  ) : (
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="tabular">{formatDateBR(d.data)}</TableCell>
                              <TableCell><DonationTypeTag type={d.tipo} /></TableCell>
                              <TableCell className="text-right tabular">
                                {formatBRL(d.valor)}
                                {d.tipo !== 'financeira' ? <span className="block text-[11px] text-muted-foreground">estimado</span> : null}
                              </TableCell>
                              <TableCell><DonationStatusBadge status={d.status} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    <Link to="/painel/doacoes?novo=1" className="text-primary underline-offset-2 hover:underline">Registrar nova doação</Link>
                  </p>
                </section>
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
          <div className="space-y-2">
            <p>
              <strong>{toDelete?.nome}</strong> será removido da rede de apoio neste navegador. Esta ação não pode ser desfeita.
            </p>
            {linked > 0 ? <p>Há {linked} doação(ões) registrada(s) para esta pessoa. Elas serão mantidas, mas o histórico não ficará mais acessível por este cadastro.</p> : null}
          </div>
        }
        confirmLabel="Remover cadastro"
        onConfirm={() => {
          if (!toDelete) return
          helpersRepo.remove(toDelete.id)
          toast.success('Cadastro removido.', { description: toDelete.nome })
          setDetailId(null)
          setToDelete(null)
        }}
      />
    </div>
  )
}
