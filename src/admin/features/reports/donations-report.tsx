import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ChartCard, LegendItem } from '@/admin/components/charts/chart-card'
import { HorizontalBarChart, TimeSeriesChart } from '@/admin/components/charts/charts'
import { Kpi } from '@/admin/components/charts/kpi'
import { CHART, DONATION_TYPE_COLOR } from '@/admin/components/charts/palette'
import { dateSort, numberSort, textSort, enumSort } from '@/admin/components/data-table/columns'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { DonationStatusBadge, DonationTypeTag } from '@/admin/components/feedback/status-badge'
import { SelectFilterControl } from '@/admin/components/filters/filter-controls'
import { ReportPeriodControl, ReportShell, useReportPeriod } from '@/admin/components/reports/report-shell'
import { describePeriod, donationSeries, groupDonations, inPeriod, isFinancial, summarizeDonations, type Granularity } from '@/admin/data/domain'
import { useDonations } from '@/admin/data/store'
import { formatBRL, formatBRLCompact, formatDateBR, formatMonthLong, formatMonthShort, formatNumber } from '@/admin/lib/format'
import { useSessionState } from '@/admin/lib/hooks'
import type { ExportColumn } from '@/admin/lib/export'
import { DONATION_STATUS_LABEL, DONATION_TYPE_LABEL, type Donation, type DonationStatus, type DonationType } from '@/data/mock'
import { Segmented } from '@/admin/components/ui/segmented'
import { DONATION_EXPORT_COLUMNS } from '../donations/donations-page'

const SOURCE = 'registro de doações do sistema (dados de demonstração gravados no navegador)'
const TYPE_ORDER: DonationType[] = ['financeira', 'alimento', 'roupa', 'material', 'servico']

export default function DonationsReport() {
  const donations = useDonations()
  const { period, presets, setPreset, setCustom } = useReportPeriod('doacoes', '12m')
  const [tipo, setTipo] = useSessionState<string | undefined>('report_doacoes_tipo', undefined)
  const [status, setStatus] = useSessionState<string | undefined>('report_doacoes_status', undefined)
  const [destino, setDestino] = useSessionState<string | undefined>('report_doacoes_destino', undefined)
  const [granularity, setGranularity] = useSessionState<Granularity>('report_doacoes_gran', 'month')

  const periodText = describePeriod(period)
  const rows = useMemo(
    () => donations.filter((d) => inPeriod(d.data, period) && (!tipo || d.tipo === tipo) && (!status || d.status === status) && (!destino || d.destinacao === destino)),
    [donations, period, tipo, status, destino],
  )
  const totals = useMemo(() => summarizeDonations(rows), [rows])
  const confirmed = useMemo(() => rows.filter((d) => d.status === 'confirmada'), [rows])
  const series = useMemo(() => donationSeries(rows, granularity, period), [rows, granularity, period])
  const byType = useMemo(
    () => groupDonations(confirmed, (d) => d.tipo, (k) => `${DONATION_TYPE_LABEL[k as DonationType]} (${k === 'financeira' ? 'dinheiro' : 'estimativa'})`).sort((a, b) => TYPE_ORDER.indexOf(a.key as DonationType) - TYPE_ORDER.indexOf(b.key as DonationType)),
    [confirmed],
  )
  const byDest = useMemo(() => groupDonations(confirmed.filter(isFinancial), (d) => d.destinacao || 'Sem destinação').slice(0, 8), [confirmed])
  const destinations = useMemo(() => [...new Set(donations.map((d) => d.destinacao).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [donations])

  const filtersApplied = [
    tipo ? `Tipo: ${DONATION_TYPE_LABEL[tipo as DonationType]}` : '',
    status ? `Situação: ${DONATION_STATUS_LABEL[status as DonationStatus]}` : '',
    destino ? `Destinação: ${destino}` : '',
  ].filter(Boolean)

  const columns = useMemo<ColumnDef<Donation, any>[]>(
    () => [
      { id: 'data', accessorFn: (d) => d.data, sortingFn: dateSort, meta: { title: 'Data' }, header: ({ column }) => <SortableHeader column={column} title="Data" />, cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span> },
      { id: 'doador', accessorFn: (d) => d.doadorNome, sortingFn: textSort, meta: { title: 'Doador' }, header: ({ column }) => <SortableHeader column={column} title="Doador" />, cell: ({ getValue }) => getValue<string>() },
      { id: 'tipo', accessorFn: (d) => d.tipo, sortingFn: enumSort(TYPE_ORDER), meta: { title: 'Tipo' }, header: ({ column }) => <SortableHeader column={column} title="Tipo" />, cell: ({ getValue }) => <DonationTypeTag type={getValue<DonationType>()} /> },
      {
        id: 'valor',
        accessorFn: (d) => d.valor,
        sortingFn: numberSort,
        meta: { title: 'Valor', className: 'text-right' },
        header: ({ column }) => <SortableHeader column={column} title="Valor" align="right" />,
        cell: ({ row }) => (
          <span className="tabular">
            {formatBRL(row.original.valor)}
            {!isFinancial(row.original) ? <span className="ml-1 text-[11px] text-muted-foreground">(estim.)</span> : null}
          </span>
        ),
      },
      { id: 'destinacao', accessorFn: (d) => d.destinacao, sortingFn: textSort, meta: { title: 'Destinação' }, header: ({ column }) => <SortableHeader column={column} title="Destinação" />, cell: ({ getValue }) => getValue<string>() },
      { id: 'status', accessorFn: (d) => d.status, meta: { title: 'Situação' }, header: ({ column }) => <SortableHeader column={column} title="Situação" />, cell: ({ getValue }) => <DonationStatusBadge status={getValue<DonationStatus>()} /> },
    ],
    [],
  )

  const exportRows: ExportColumn<Donation>[] = DONATION_EXPORT_COLUMNS
  const sorted = useMemo(() => [...rows].sort((a, b) => b.data.localeCompare(a.data)), [rows])

  return (
    <ReportShell<Donation>
      slug="doacoes"
      title="Relatório de doações"
      description="Entradas por período, tipo e destinação, separando dinheiro recebido de estimativas de bens e serviços."
      periodText={periodText}
      filtersApplied={filtersApplied}
      controls={
        <>
          <ReportPeriodControl period={period} presets={presets} onPreset={setPreset} onCustom={setCustom} />
          <SelectFilterControl label="Tipo" value={tipo} onChange={setTipo} options={TYPE_ORDER.map((v) => ({ value: v, label: DONATION_TYPE_LABEL[v] }))} />
          <SelectFilterControl label="Situação" value={status} onChange={setStatus} options={(Object.keys(DONATION_STATUS_LABEL) as DonationStatus[]).map((v) => ({ value: v, label: DONATION_STATUS_LABEL[v] }))} />
          <SelectFilterControl label="Destinação" value={destino} onChange={setDestino} options={destinations.map((v) => ({ value: v, label: v }))} />
        </>
      }
      summary={
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Dinheiro recebido" value={formatBRL(totals.cashReceived)} scope="Doações financeiras confirmadas" explanation="Soma das doações do tipo Financeira com situação Confirmada no período e filtros." />
          <Kpi label="Bens e serviços (estimativa)" value={formatBRL(totals.inKindEstimate)} scope="Valores estimados · não é caixa" explanation="Soma dos valores estimados de doações em espécie e serviços confirmados." />
          <Kpi label="Aguardando confirmação" value={formatNumber(totals.pendingCount)} scope={`${formatBRL(totals.cashPending)} em dinheiro + ${formatBRL(totals.inKindPending)} estimados`} tone={totals.pendingCount ? 'warning' : 'default'} />
          <Kpi label="Lançamentos no recorte" value={formatNumber(totals.totalCount)} scope={`${totals.confirmedCount} confirmados · ${totals.canceledCount} cancelados`} />
        </div>
      }
      methodology={{
        sources: ['Registro de doações do sistema (módulo Doações).', 'Doadores vinculados pelo cadastro da Rede de apoio.'],
        definitions: [
          { term: 'Dinheiro recebido', text: 'doações financeiras com situação Confirmada.' },
          { term: 'Bens e serviços (estimativa)', text: 'valor monetário atribuído a alimentos, roupas, materiais e serviços confirmados; é uma estimativa, não uma entrada de caixa.' },
          { term: 'Aguardando confirmação', text: 'doações com situação Pendente; não entram nos totais confirmados.' },
        ],
        notes: ['Dinheiro e estimativas nunca são somados. As séries históricas incluem apenas doações confirmadas.', 'Doações canceladas ficam fora dos totais e dos gráficos.'],
      }}
      exportConfig={{
        filename: 'relatorio-doacoes',
        columns: exportRows,
        rows: sorted,
        summary: [
          { label: 'Dinheiro recebido', value: formatBRL(totals.cashReceived), hint: 'financeiras confirmadas' },
          { label: 'Bens/serviços (estimativa)', value: formatBRL(totals.inKindEstimate), hint: 'não é caixa' },
          { label: 'Aguardando confirmação', value: String(totals.pendingCount) },
          { label: 'Lançamentos', value: String(totals.totalCount) },
        ],
        notes: [
          'Dinheiro recebido = doações financeiras confirmadas. Estimativa = valor atribuído a bens e serviços; não é entrada de caixa. Os dois totais não são somados.',
          'Dados de demonstração armazenados no navegador.',
        ],
      }}
    >
      <ChartCard
        title="Evolução das doações confirmadas"
        description="Dinheiro recebido e estimativa de bens e serviços em cada período."
        unit="R$ (reais)"
        period={periodText}
        source={SOURCE}
        empty={series.length === 0}
        altText={`Evolução ${granularity === 'month' ? 'mensal' : 'anual'} com ${series.length} pontos. Dinheiro recebido ${formatBRL(totals.cashReceived)}; estimativa ${formatBRL(totals.inKindEstimate)}.`}
        tableRows={series.map((p) => ({ label: granularity === 'month' ? formatMonthShort(p.key) : p.key, values: [{ header: 'Dinheiro', value: formatBRL(p.cash) }, { header: 'Estimativa', value: formatBRL(p.inKind) }] }))}
        legend={<><LegendItem color={CHART.cash} label="Dinheiro recebido" /><LegendItem color={CHART.inKind} label="Bens e serviços (estimativa)" /></>}
        controls={
          <Segmented label="Granularidade" value={granularity} onValueChange={setGranularity} options={[{ value: 'month', label: 'Mensal' }, { value: 'year', label: 'Anual' }]} />
        }
      >
        <TimeSeriesChart
          data={series.map((p) => ({ key: p.key, cash: p.cash, inKind: p.inKind }))}
          xKey="key"
          kind="bar"
          series={[{ key: 'cash', label: 'Dinheiro recebido', color: CHART.cash }, { key: 'inKind', label: 'Bens e serviços (estimativa)', color: CHART.inKind }]}
          format={formatBRL}
          tickFormat={formatBRLCompact}
          labelFormat={(k) => (granularity === 'month' ? formatMonthLong(k) : k)}
          xTick={(k) => (granularity === 'month' ? formatMonthShort(k) : k)}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Valor confirmado por tipo"
          description="Cada barra tem natureza diferente: Financeira é dinheiro; os demais tipos são estimativas."
          unit="R$ (reais; dinheiro ou estimativa)"
          period={periodText}
          source={SOURCE}
          empty={byType.length === 0}
          altText={`Barras por tipo de doação: ${byType.map((b) => `${b.label} ${formatBRL(b.value)}`).join('; ')}.`}
          tableRows={byType.map((b) => ({ label: b.label, values: [{ header: 'Valor', value: formatBRL(b.value) }, { header: 'Doações', value: String(b.count) }] }))}
          height={230}
        >
          <HorizontalBarChart data={byType.map((b) => ({ label: b.label, value: b.value, color: DONATION_TYPE_COLOR[b.key as DonationType] }))} format={formatBRLCompact} labelWidth={150} />
        </ChartCard>
        <ChartCard
          title="Dinheiro recebido por destinação"
          description="Apenas doações financeiras confirmadas."
          unit="R$ (reais)"
          period={periodText}
          source={SOURCE}
          empty={byDest.length === 0}
          altText={`Barras por destinação do dinheiro recebido: ${byDest.map((b) => `${b.label} ${formatBRL(b.value)}`).join('; ')}.`}
          tableRows={byDest.map((b) => ({ label: b.label, values: [{ header: 'Valor', value: formatBRL(b.value) }, { header: 'Doações', value: String(b.count) }] }))}
          height={230}
        >
          <HorizontalBarChart data={byDest.map((b) => ({ label: b.label, value: b.value }))} format={formatBRLCompact} labelWidth={130} />
        </ChartCard>
      </div>

      <section aria-labelledby="det">
        <h2 id="det" className="mb-2 text-sm font-semibold">Lançamentos do período</h2>
        <DataTable<Donation>
          id="report-donations"
          caption="Lançamentos de doações no período"
          data={sorted}
          columns={columns}
          getRowId={(d) => d.id}
          searchText={(d) => `${d.doadorNome} ${d.descricao} ${d.destinacao}`}
          searchPlaceholder="Buscar nos lançamentos"
          initialSort={[{ id: 'data', desc: true }]}
          noun={['lançamento', 'lançamentos']}
          empty={{ title: 'Nenhum lançamento no recorte', description: 'Amplie o período ou remova filtros para ver doações.' }}
        />
      </section>
    </ReportShell>
  )
}
