import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ChartCard } from '@/admin/components/charts/chart-card'
import { HorizontalBarChart } from '@/admin/components/charts/charts'
import { Kpi } from '@/admin/components/charts/kpi'
import { dateSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { ReportPeriodControl, ReportShell, useReportPeriod } from '@/admin/components/reports/report-shell'
import { describePeriod, inPeriod } from '@/admin/data/domain'
import { expenses, summarizeAccounts, type Expense } from '@/admin/data/modules'
import { useDonations } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatBRL, formatDateBR } from '@/admin/lib/format'

const SYSTEM = 'doações e despesas lançadas no sistema (dados gravados no navegador)'

/** Prestação de contas: dinheiro recebido x despesas pagas no período, por categoria. */
export default function AccountsReport() {
  const donations = useDonations()
  const list = expenses.useAll()
  const { period, presets, setPreset, setCustom } = useReportPeriod('prestacao', 'ano')
  const periodText = describePeriod(period)

  const acc = useMemo(() => summarizeAccounts(donations, list, period), [donations, list, period])
  const rows = useMemo(() => list.filter((e) => e.status === 'paga' && inPeriod(e.data, period)).sort((a, b) => a.data.localeCompare(b.data)), [list, period])

  const columns = useMemo<ColumnDef<Expense, any>[]>(
    () => [
      { id: 'data', accessorFn: (e) => e.data, sortingFn: dateSort, meta: { title: 'Data' }, header: ({ column }) => <SortableHeader column={column} title="Data" />, cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span> },
      { id: 'descricao', accessorFn: (e) => e.descricao, sortingFn: textSort, meta: { title: 'Despesa' }, header: ({ column }) => <SortableHeader column={column} title="Despesa" /> },
      { id: 'categoria', accessorFn: (e) => e.categoria, sortingFn: textSort, meta: { title: 'Categoria' }, header: ({ column }) => <SortableHeader column={column} title="Categoria" /> },
      { id: 'valor', accessorFn: (e) => e.valor, sortingFn: numberSort, meta: { title: 'Valor', className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title="Valor" align="right" />, cell: ({ getValue }) => <span className="tabular">{formatBRL(getValue<number>())}</span> },
    ],
    [],
  )
  const exportColumns: ExportColumn<Expense>[] = [
    { header: 'Data', value: (e) => formatDateBR(e.data) },
    { header: 'Despesa', value: (e) => e.descricao },
    { header: 'Fornecedor', value: (e) => e.fornecedor },
    { header: 'Categoria', value: (e) => e.categoria },
    { header: 'Valor (R$)', value: (e) => formatBRL(e.valor), align: 'right' },
  ]
  const catData = acc.porCategoria.map((c) => ({ label: c.categoria, value: c.valor }))

  return (
    <ReportShell<Expense>
      slug="prestacao-de-contas"
      title="Prestação de contas"
      description="Dinheiro recebido e despesas pagas no período, com o saldo e as despesas por categoria."
      periodText={periodText}
      filtersApplied={[]}
      controls={<ReportPeriodControl period={period} presets={presets} onPreset={setPreset} onCustom={setCustom} />}
      summary={
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Dinheiro recebido" value={formatBRL(acc.receitas)} scope={`No período · ${periodText}`} explanation="Doações financeiras confirmadas com data no período." />
          <Kpi label="Despesas pagas" value={formatBRL(acc.despesas)} scope="No período" explanation="Despesas com situação Paga e data no período." />
          <Kpi label="Saldo do período" value={formatBRL(acc.saldo)} scope="Recebido menos pago" tone={acc.saldo < 0 ? 'warning' : 'default'} explanation="Dinheiro recebido menos despesas pagas. Não inclui saldo anterior nem bens e serviços." />
          <Kpi label="A pagar" value={formatBRL(acc.despesasPendentes)} scope="Compromissos já lançados no período" />
        </div>
      }
      methodology={{
        sources: ['Doações (módulo Doações) e despesas (módulo Despesas e contas).'],
        definitions: [
          { term: 'Dinheiro recebido', text: 'soma das doações financeiras confirmadas. Doações pendentes ou canceladas não entram.' },
          { term: 'Despesas pagas', text: 'soma das despesas com situação Paga. As “A pagar” aparecem à parte.' },
          { term: 'Saldo', text: 'dinheiro recebido menos despesas pagas no mesmo período.' },
        ],
        notes: ['Bens e serviços doados são estimativas e não são caixa, por isso ficam fora do saldo.', 'Este relatório é gerencial. Conferir com extrato bancário e comprovantes antes de enviar a um órgão parceiro.'],
      }}
      exportConfig={{
        filename: 'prestacao-de-contas',
        columns: exportColumns,
        rows,
        summary: [
          { label: 'Dinheiro recebido', value: formatBRL(acc.receitas) },
          { label: 'Despesas pagas', value: formatBRL(acc.despesas) },
          { label: 'Saldo', value: formatBRL(acc.saldo) },
          { label: 'A pagar', value: formatBRL(acc.despesasPendentes) },
        ],
        notes: ['Lista as despesas pagas no período. Bens e serviços doados (estimativas) não entram no saldo.'],
      }}
    >
      <ChartCard
        title="Despesas por categoria"
        description="Despesas pagas no período."
        unit="R$ (reais)"
        period={periodText}
        source={SYSTEM}
        empty={catData.length === 0}
        altText={`Despesas por categoria: ${catData.map((c) => `${c.label} ${formatBRL(c.value)}`).join('; ')}.`}
        tableRows={catData.map((c) => ({ label: c.label, values: [{ header: 'Valor', value: formatBRL(c.value) }] }))}
        height={Math.max(140, catData.length * 36)}
      >
        <HorizontalBarChart data={catData} format={formatBRL} labelWidth={140} valueLabel="Valor" />
      </ChartCard>
      <section aria-labelledby="det">
        <h2 id="det" className="mb-2 text-sm font-semibold">Despesas pagas no período</h2>
        <DataTable<Expense> id="report-accounts" caption="Despesas pagas" data={rows} columns={columns} getRowId={(e) => e.id} searchText={(e) => `${e.descricao} ${e.categoria}`} searchPlaceholder="Buscar despesa" initialSort={[{ id: 'data', desc: false }]} noun={['despesa', 'despesas']} empty={{ title: 'Sem despesas pagas no período' }} />
      </section>
    </ReportShell>
  )
}
