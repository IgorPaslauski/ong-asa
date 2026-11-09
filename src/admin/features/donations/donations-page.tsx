import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { BanIcon, CheckCircle2Icon, EyeIcon, InfoIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Button } from '@/admin/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/admin/components/ui/sheet'
import { Kpi } from '@/admin/components/charts/kpi'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { dateSort, enumSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import type { DateRangeValue, FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { DonationStatusBadge, DonationTypeTag } from '@/admin/components/feedback/status-badge'
import { Detail, NumberField, SelectField, TextField, TextareaField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { isFinancial, summarizeDonations } from '@/admin/data/domain'
import { donationsRepo, useDonations, useHelpers } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatBRL, formatDateBR, formatNumber, todayISO } from '@/admin/lib/format'
import { DONATION_STATUS_LABEL, DONATION_TYPE_LABEL, type Donation, type DonationStatus, type DonationType } from '@/data/mock'
import { DESTINATION_SUGGESTIONS, donationSchema, type DonationFormValues } from './schema'

const TYPE_ORDER: DonationType[] = ['financeira', 'alimento', 'roupa', 'material', 'servico']
const STATUS_ORDER: DonationStatus[] = ['pendente', 'confirmada', 'cancelada']
const TYPE_OPTIONS = TYPE_ORDER.map((v) => ({ value: v, label: DONATION_TYPE_LABEL[v] }))
const STATUS_OPTIONS = STATUS_ORDER.map((v) => ({ value: v, label: DONATION_STATUS_LABEL[v] }))

const kindLabel = (d: Pick<Donation, 'tipo'>) => (isFinancial(d) ? 'Dinheiro' : 'Estimativa')

export const DONATION_EXPORT_COLUMNS: ExportColumn<Donation>[] = [
  { header: 'Data', value: (d) => formatDateBR(d.data) },
  { header: 'Doador', value: (d) => d.doadorNome },
  { header: 'Tipo', value: (d) => DONATION_TYPE_LABEL[d.tipo] },
  { header: 'Natureza do valor', value: kindLabel },
  { header: 'Valor (R$)', value: (d) => formatBRL(d.valor), align: 'right' },
  { header: 'Destinação', value: (d) => d.destinacao },
  { header: 'Situação', value: (d) => DONATION_STATUS_LABEL[d.status] },
  { header: 'Descrição', value: (d) => d.descricao },
]

export default function DonationsPage() {
  const donations = useDonations()
  const helpers = useHelpers()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Donation | null>(null)
  const [detail, setDetail] = useState<Donation | null>(null)
  const [toDelete, setToDelete] = useState<Donation | null>(null)
  const [visible, setVisible] = useState<Donation[]>(donations)

  const defaults = (): DonationFormValues => ({
    doadorId: helpers[0]?.id ?? '',
    tipo: 'financeira',
    valor: '' as unknown as number,
    descricao: '',
    data: todayISO(),
    status: 'confirmada',
    destinacao: 'Geral',
  })
  const form = useForm<DonationFormValues>({ resolver: zodResolver(donationSchema), defaultValues: defaults(), mode: 'onTouched' })
  const tipoWatch = useWatch({ control: form.control, name: 'tipo' })

  function openCreate() {
    setEditing(null)
    form.reset(defaults())
    setFormOpen(true)
  }
  function openEdit(d: Donation) {
    setEditing(d)
    form.reset({ doadorId: d.doadorId, tipo: d.tipo, valor: d.valor, descricao: d.descricao, data: d.data, status: d.status, destinacao: d.destinacao })
    setDetail(null)
    setFormOpen(true)
  }
  useEffect(() => {
    if (params.get('novo') === '1') {
      openCreate()
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line
  }, [params, helpers.length])

  function save(values: DonationFormValues) {
    const helper = helpers.find((h) => h.id === values.doadorId)
    // O nome fica gravado na doação (comportamento original); mantém o anterior se o cadastro do doador já não existir.
    const doadorNome = helper?.nome ?? editing?.doadorNome ?? ''
    const saved = donationsRepo.save({ ...values, doadorNome }, editing?.id)
    toast.success(editing ? 'Doação atualizada.' : 'Doação registrada.', { description: `${saved.doadorNome} · ${formatBRL(saved.valor)}` })
    setFormOpen(false)
  }

  function setStatus(d: Donation, status: DonationStatus) {
    donationsRepo.setStatus(d.id, status)
    toast.success(`Doação marcada como ${DONATION_STATUS_LABEL[status].toLowerCase()}.`, { description: d.doadorNome })
  }

  const columns = useMemo<ColumnDef<Donation, any>[]>(
    () => [
      {
        id: 'data',
        accessorFn: (d) => d.data,
        sortingFn: dateSort,
        meta: { title: 'Data' },
        header: ({ column }) => <SortableHeader column={column} title="Data" />,
        cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span>,
      },
      {
        id: 'doador',
        accessorFn: (d) => d.doadorNome,
        sortingFn: textSort,
        meta: { title: 'Doador' },
        header: ({ column }) => <SortableHeader column={column} title="Doador" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <button type="button" className="block max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setDetail(row.original)}>
              {row.original.doadorNome}
            </button>
            <span className="block max-w-[28ch] truncate text-xs text-muted-foreground">{row.original.descricao}</span>
          </div>
        ),
      },
      {
        id: 'tipo',
        accessorFn: (d) => d.tipo,
        sortingFn: enumSort(TYPE_ORDER),
        meta: { title: 'Tipo' },
        header: ({ column }) => <SortableHeader column={column} title="Tipo" />,
        cell: ({ getValue }) => <DonationTypeTag type={getValue<DonationType>()} />,
      },
      {
        id: 'valor',
        accessorFn: (d) => d.valor,
        sortingFn: numberSort,
        meta: { title: 'Valor', className: 'text-right' },
        header: ({ column }) => <SortableHeader column={column} title="Valor" align="right" />,
        cell: ({ row }) => (
          <div className="text-right tabular">
            {row.original.valor ? formatBRL(row.original.valor) : '—'}
            {!isFinancial(row.original) && row.original.valor ? <span className="block text-[11px] text-muted-foreground">estimado</span> : null}
          </div>
        ),
      },
      {
        id: 'destinacao',
        accessorFn: (d) => d.destinacao,
        sortingFn: textSort,
        meta: { title: 'Destinação' },
        header: ({ column }) => <SortableHeader column={column} title="Destinação" />,
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'status',
        accessorFn: (d) => d.status,
        sortingFn: enumSort(STATUS_ORDER),
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ getValue }) => <DonationStatusBadge status={getValue<DonationStatus>()} />,
      },
    ],
    [],
  )

  const filters = useMemo<FilterDef<Donation>[]>(() => {
    const donors = new Map<string, string>()
    for (const d of donations) donors.set(d.doadorId, d.doadorNome)
    for (const h of helpers) donors.set(h.id, h.nome)
    const dest = [...new Set(donations.map((d) => d.destinacao).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return [
      {
        id: 'periodo',
        type: 'date-range',
        label: 'Período',
        match: (d, v) => {
          const r = v as DateRangeValue
          return (!r.from || d.data >= r.from) && (!r.to || d.data <= r.to)
        },
      },
      { id: 'doador', type: 'combobox', label: 'Doador', options: [...donors].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')), match: (d, v) => d.doadorId === v },
      { id: 'tipo', type: 'select', label: 'Tipo', options: TYPE_OPTIONS, match: (d, v) => d.tipo === v },
      { id: 'destinacao', type: 'select', label: 'Destinação', options: dest.map((v) => ({ value: v, label: v })), match: (d, v) => d.destinacao === v },
      { id: 'status', type: 'select', label: 'Situação', options: STATUS_OPTIONS, match: (d, v) => d.status === v },
    ]
  }, [donations, helpers])

  const rowActions = useMemo(
    () =>
      (d: Donation): RowAction<Donation>[] => [
        { id: 'ver', label: 'Ver detalhes', icon: <EyeIcon />, onSelect: setDetail },
        { id: 'editar', label: 'Editar doação', icon: <PencilIcon />, onSelect: openEdit },
        { id: 'confirmar', label: 'Confirmar recebimento', icon: <CheckCircle2Icon />, hidden: d.status === 'confirmada', onSelect: (x) => setStatus(x, 'confirmada') },
        { id: 'cancelar', label: 'Cancelar doação', icon: <BanIcon />, hidden: d.status === 'cancelada', onSelect: (x) => setStatus(x, 'cancelada') },
        { id: 'remover', label: 'Remover lançamento', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
      ],
    // eslint-disable-next-line
    [],
  )

  const totals = useMemo(() => summarizeDonations(visible), [visible])
  const filtered = visible.length !== donations.length

  return (
    <div>
      <PageHeader
        title="Doações"
        description="Registro, acompanhamento e exportação das doações recebidas. Dinheiro e bens/serviços são contabilizados separadamente."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nova doação
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          label="Dinheiro recebido"
          value={formatBRL(totals.cashReceived)}
          scope={filtered ? 'Doações financeiras confirmadas · filtros atuais' : 'Doações financeiras confirmadas · todo o histórico'}
          explanation="Soma das doações do tipo Financeira com situação Confirmada. É o único total que representa dinheiro efetivamente recebido."
        />
        <Kpi
          label="Bens e serviços (estimativa)"
          value={formatBRL(totals.inKindEstimate)}
          scope={filtered ? 'Alimentos, roupas, materiais e serviços confirmados · filtros atuais' : 'Alimentos, roupas, materiais e serviços confirmados'}
          explanation="Soma dos valores estimados atribuídos a doações em espécie e serviços confirmados. Não é dinheiro em caixa e não deve ser somado ao valor recebido."
        />
        <Kpi
          label="Aguardando confirmação"
          value={formatNumber(totals.pendingCount)}
          scope={`${formatBRL(totals.cashPending)} em dinheiro · ${formatBRL(totals.inKindPending)} estimados`}
          tone={totals.pendingCount ? 'warning' : 'default'}
          explanation="Doações com situação Pendente nos filtros atuais. Ainda não entram nos totais acima."
        />
        <Kpi label="Lançamentos" value={formatNumber(totals.totalCount)} scope={`${totals.confirmedCount} confirmados · ${totals.canceledCount} cancelados`} />
      </div>

      <Alert variant="info" className="mb-3">
        <InfoIcon />
        <AlertDescription>
          Valores de alimentos, roupas, materiais e serviços são <strong>estimativas</strong> informadas no cadastro, não entradas de caixa. Os indicadores acima acompanham os filtros da tabela.
        </AlertDescription>
      </Alert>

      <DataTable<Donation>
        id="donations"
        caption="Doações registradas"
        data={donations}
        columns={columns}
        getRowId={(d) => d.id}
        searchText={(d) => `${d.doadorNome} ${d.descricao} ${d.destinacao}`}
        searchPlaceholder="Buscar por doador, descrição ou destinação"
        filters={filters}
        initialSort={[{ id: 'data', desc: true }]}
        rowActions={rowActions}
        noun={['doação', 'doações']}
        onFilteredRowsChange={setVisible}
        empty={{
          title: 'Nenhuma doação registrada ainda',
          description: 'Registre a primeira doação para acompanhar o que o Instituto recebe.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Nova doação
            </Button>
          ),
        }}
        exportConfig={{
          filename: 'doacoes',
          title: 'Doações',
          subtitle: 'Valores de bens e serviços são estimativas; apenas “Dinheiro” representa recebimento financeiro.',
          columns: DONATION_EXPORT_COLUMNS,
          notes: ['Dinheiro recebido = doações financeiras confirmadas. Estimativa = valor atribuído a alimentos, roupas, materiais e serviços; não é entrada de caixa.'],
        }}
        exportPeriod="Conforme filtros (sem filtro de período = todo o histórico)"
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar doação' : 'Nova doação'}
        description="Informe quem doou, o que foi doado e para onde será destinado."
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Registrar doação'}
        banner={
          helpers.length === 0 ? (
            <Alert variant="warning">
              <InfoIcon />
              <AlertDescription>
                Cadastre primeiro o doador na <Link className="underline" to="/painel/pessoas?novo=1">Rede de apoio</Link>.
              </AlertDescription>
            </Alert>
          ) : null
        }
      >
        <FormSection title="Origem">
          <SelectField
            control={form.control}
            name="doadorId"
            label="Doador ou parceiro"
            required
            className="sm:col-span-2"
            placeholder="Selecione quem doou"
            options={helpers.map((h) => ({ value: h.id, label: h.nome }))}
          />
          <TextField control={form.control} name="data" label="Data da doação" type="date" required />
          <SelectField control={form.control} name="status" label="Situação" required options={STATUS_OPTIONS} />
        </FormSection>
        <FormSection title="Doação">
          <SelectField control={form.control} name="tipo" label="Tipo" required options={TYPE_OPTIONS} />
          <NumberField
            control={form.control}
            name="valor"
            label={tipoWatch === 'financeira' ? 'Valor recebido (R$)' : 'Valor estimado (R$)'}
            required
            min={0}
            step={0.01}
            description={tipoWatch === 'financeira' ? 'Dinheiro doado.' : 'Estimativa do valor do bem ou serviço; não é dinheiro em caixa.'}
          />
          <TextareaField control={form.control} name="descricao" label="Descrição" rows={3} className="sm:col-span-2" />
        </FormSection>
        <FormSection title="Destinação">
          <TextField control={form.control} name="destinacao" label="Destinação" list="destinos-sugeridos" className="sm:col-span-2" autoComplete="off" description="Escolha uma sugestão ou digite outra." />
          <datalist id="destinos-sugeridos">
            {DESTINATION_SUGGESTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </FormSection>
      </FormSheet>

      <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent>
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{formatBRL(detail.valor)}</SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap items-center gap-2">
                    <DonationStatusBadge status={detail.status} />
                    <span className="text-[13px] text-muted-foreground">{isFinancial(detail) ? 'Dinheiro recebido' : 'Valor estimado (bem ou serviço)'}</span>
                  </div>
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail label="Doador">
                    {helpers.some((h) => h.id === detail.doadorId) ? (
                      <Link className="text-primary underline-offset-2 hover:underline" to="/painel/pessoas">
                        {detail.doadorNome}
                      </Link>
                    ) : (
                      detail.doadorNome
                    )}
                  </Detail>
                  <Detail label="Data">{formatDateBR(detail.data)}</Detail>
                  <Detail label="Tipo"><DonationTypeTag type={detail.tipo} /></Detail>
                  <Detail label="Destinação">{detail.destinacao}</Detail>
                  <Detail label="Descrição" className="sm:col-span-2">{detail.descricao}</Detail>
                </dl>
              </SheetBody>
              <SheetFooter>
                {detail.status === 'pendente' ? (
                  <Button variant="outline" onClick={() => { setStatus(detail, 'confirmada'); setDetail(null) }}>
                    <CheckCircle2Icon />
                    Confirmar recebimento
                  </Button>
                ) : null}
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
        title="Remover este lançamento?"
        description={
          <p>
            A doação de <strong>{toDelete?.doadorNome}</strong> ({toDelete ? formatBRL(toDelete.valor) : ''}) será removida deste navegador e deixará de compor os totais. Para manter o registro, prefira marcá-la como <em>cancelada</em>. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover lançamento"
        onConfirm={() => {
          if (!toDelete) return
          donationsRepo.remove(toDelete.id)
          toast.success('Lançamento removido.', { description: toDelete.doadorNome })
          setDetail(null)
          setToDelete(null)
        }}
      />
    </div>
  )
}
