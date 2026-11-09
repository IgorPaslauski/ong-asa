import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ChartCard, LegendItem } from '@/admin/components/charts/chart-card'
import { CompositionBar, HorizontalBarChart, TimeSeriesChart } from '@/admin/components/charts/charts'
import { Kpi } from '@/admin/components/charts/kpi'
import { CHART, CHILD_STATUS_COLOR, HELPER_ROLE_COLOR } from '@/admin/components/charts/palette'
import { dateSort, numberSort, textSort } from '@/admin/components/data-table/columns'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { SelectFilterControl } from '@/admin/components/filters/filter-controls'
import { ReportPeriodControl, ReportShell, useReportPeriod } from '@/admin/components/reports/report-shell'
import { activitiesByYear, countBy, describePeriod, donationsOfHelper, inPeriod, summarizeDonations } from '@/admin/data/domain'
import { useActivities, useChildren, useDonations, useHelpers } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatBRL, formatBRLCompact, formatDateBR, formatNumber } from '@/admin/lib/format'
import { useSessionState } from '@/admin/lib/hooks'
import { ROLE_LABEL, STATUS_LABEL, type Activity, type ChildStatus, type HelperRole } from '@/data/mock'
import { AGE_BANDS, ageBandOf } from '../children/schema'

const SYSTEM = 'cadastros do sistema (dados de demonstração gravados no navegador)'

function numCol<T>(id: string, title: string, get: (r: T) => number, fmt: (n: number) => string = formatNumber): ColumnDef<T, any> {
  return { id, accessorFn: get, sortingFn: numberSort, meta: { title, className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title={title} align="right" />, cell: ({ getValue }) => <span className="tabular">{fmt(getValue<number>())}</span> }
}
function txtCol<T>(id: string, title: string, get: (r: T) => string): ColumnDef<T, any> {
  return { id, accessorFn: get, sortingFn: textSort, meta: { title }, header: ({ column }) => <SortableHeader column={column} title={title} />, cell: ({ getValue }) => getValue<string>() || '—' }
}

/* ----------------------------- Atendimentos ------------------------------- */

interface NeighborhoodRow {
  bairro: string
  total: number
  ativo: number
  acompanhamento: number
  concluido: number
}

export function ServiceReport() {
  const children = useChildren()
  const { period, presets, setPreset, setCustom } = useReportPeriod('atendimentos', 'tudo')
  const [status, setStatus] = useSessionState<string | undefined>('report_atendimentos_status', undefined)
  const periodText = describePeriod(period)

  // O período filtra pela DATA DE ENTRADA no acompanhamento.
  const rows = useMemo(() => children.filter((c) => inPeriod(c.dataEntrada, period) && (!status || c.status === status)), [children, period, status])
  const counts = useMemo(() => countBy(rows, (c) => c.status), [rows])
  const statusData = (Object.keys(STATUS_LABEL) as ChildStatus[]).map((s) => ({ label: STATUS_LABEL[s], value: counts[s] ?? 0, color: CHILD_STATUS_COLOR[s] }))
  const ageData = AGE_BANDS.map((b) => ({ label: b.label, value: rows.filter((c) => ageBandOf(c.idade) === b.value).length }))
  const byYear = useMemo(() => {
    const m = countBy(rows, (c) => c.dataEntrada.slice(0, 4))
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([year, entries]) => ({ year, entries }))
  }, [rows])
  const neighborhoods = useMemo<NeighborhoodRow[]>(() => {
    const m = new Map<string, NeighborhoodRow>()
    for (const c of rows) {
      const key = c.bairro || 'Não informado'
      const r = m.get(key) ?? { bairro: key, total: 0, ativo: 0, acompanhamento: 0, concluido: 0 }
      r.total += 1
      r[c.status] += 1
      m.set(key, r)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [rows])
  const avgAge = rows.length ? rows.reduce((s, c) => s + c.idade, 0) / rows.length : 0

  const columns = useMemo<ColumnDef<NeighborhoodRow, any>[]>(
    () => [txtCol('bairro', 'Bairro', (r) => r.bairro), numCol('total', 'Total', (r) => r.total), numCol('ativo', 'Ativos', (r) => r.ativo), numCol('acompanhamento', 'Em acompanhamento', (r) => r.acompanhamento), numCol('concluido', 'Concluídos', (r) => r.concluido)],
    [],
  )
  const exportColumns: ExportColumn<NeighborhoodRow>[] = [
    { header: 'Bairro', value: (r) => r.bairro },
    { header: 'Total', value: (r) => r.total, align: 'right' },
    { header: 'Ativos', value: (r) => r.ativo, align: 'right' },
    { header: 'Em acompanhamento', value: (r) => r.acompanhamento, align: 'right' },
    { header: 'Concluídos', value: (r) => r.concluido, align: 'right' },
  ]

  return (
    <ReportShell<NeighborhoodRow>
      slug="atendimentos"
      title="Relatório de atendimentos"
      description="Crianças e adolescentes acompanhados, de forma agregada. Não identifica ninguém: nomes, responsáveis e telefones não aparecem."
      periodText={`${periodText} (data de entrada)`}
      filtersApplied={[status ? `Situação: ${STATUS_LABEL[status as ChildStatus]}` : ''].filter(Boolean)}
      controls={
        <>
          <ReportPeriodControl period={period} presets={presets} onPreset={setPreset} onCustom={setCustom} />
          <SelectFilterControl label="Situação" value={status} onChange={setStatus} options={(Object.keys(STATUS_LABEL) as ChildStatus[]).map((v) => ({ value: v, label: STATUS_LABEL[v] }))} />
        </>
      }
      summary={
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Cadastros no recorte" value={formatNumber(rows.length)} scope="Por data de entrada no acompanhamento" />
          <Kpi label="Ativos" value={formatNumber(counts.ativo ?? 0)} scope="Situação atual do cadastro" />
          <Kpi label="Em acompanhamento" value={formatNumber(counts.acompanhamento ?? 0)} scope="Situação atual do cadastro" tone={counts.acompanhamento ? 'warning' : 'default'} />
          <Kpi label="Idade média" value={rows.length ? `${avgAge.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos` : '—'} scope="Média simples das idades cadastradas" explanation="A idade é a registrada no cadastro; não é recalculada ao longo do tempo." />
        </div>
      }
      methodology={{
        sources: ['Cadastro de crianças e adolescentes do sistema (módulo Crianças e adolescentes).'],
        definitions: [
          { term: 'Cadastros no recorte', text: 'cadastros cuja data de entrada está dentro do período escolhido.' },
          { term: 'Situação', text: 'valor atual do cadastro (Ativo, Em acompanhamento ou Concluído), independente do período.' },
          { term: 'Faixa etária', text: 'agrupa a idade registrada: 0–5, 6–11, 12–14 e 15–18 anos.' },
        ],
        notes: ['Relatório agregado por privacidade: não há lista nominal nem dados de contato.', 'O sistema não registra frequência nem atendimentos individuais; “atendimento” aqui significa o cadastro em acompanhamento.'],
      }}
      exportConfig={{
        filename: 'relatorio-atendimentos',
        columns: exportColumns,
        rows: neighborhoods,
        summary: [
          { label: 'Cadastros no recorte', value: String(rows.length) },
          { label: 'Ativos', value: String(counts.ativo ?? 0) },
          { label: 'Em acompanhamento', value: String(counts.acompanhamento ?? 0) },
          { label: 'Concluídos', value: String(counts.concluido ?? 0) },
        ],
        notes: ['Relatório agregado por bairro. Não contém dados pessoais identificáveis.'],
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Situação dos cadastros" description="Distribuição por situação de acompanhamento." unit="cadastros" period={periodText} source={SYSTEM} empty={rows.length === 0} altText={`Situação: ${statusData.map((s) => `${s.label} ${s.value}`).join(', ')}.`} tableRows={statusData.map((s) => ({ label: s.label, values: [{ header: 'Cadastros', value: String(s.value) }] }))} height={150}>
          <CompositionBar data={statusData} format={formatNumber} />
        </ChartCard>
        <ChartCard title="Faixa etária" description="Quantas crianças e adolescentes em cada faixa." unit="cadastros" period={periodText} source={SYSTEM} empty={rows.length === 0} altText={`Faixas etárias: ${ageData.map((a) => `${a.label} ${a.value}`).join(', ')}.`} tableRows={ageData.map((a) => ({ label: a.label, values: [{ header: 'Cadastros', value: String(a.value) }] }))} height={150}>
          <HorizontalBarChart data={ageData} format={formatNumber} labelWidth={80} valueLabel="Cadastros" />
        </ChartCard>
      </div>
      <ChartCard title="Entradas no acompanhamento por ano" description="Cadastros por ano da data de entrada." unit="cadastros" period={periodText} source={SYSTEM} empty={byYear.length === 0} altText={`Entradas por ano: ${byYear.map((y) => `${y.year}: ${y.entries}`).join('; ')}.`} tableRows={byYear.map((y) => ({ label: y.year, values: [{ header: 'Entradas', value: String(y.entries) }] }))} legend={<LegendItem color={CHART.cash} label="Entradas" />} height={200}>
        <TimeSeriesChart data={byYear} xKey="year" kind="bar" series={[{ key: 'entries', label: 'Entradas', color: CHART.cash }]} format={formatNumber} />
      </ChartCard>
      <section aria-labelledby="det">
        <h2 id="det" className="mb-2 text-sm font-semibold">Cadastros por bairro (agregado)</h2>
        <DataTable<NeighborhoodRow> id="report-service" caption="Cadastros por bairro" data={neighborhoods} columns={columns} getRowId={(r) => r.bairro} searchText={(r) => r.bairro} searchPlaceholder="Buscar bairro" initialSort={[{ id: 'total', desc: true }]} noun={['bairro', 'bairros']} empty={{ title: 'Sem cadastros no recorte' }} />
      </section>
    </ReportShell>
  )
}

/* ------------------------------- Atividades -------------------------------- */

export function ActivitiesReport() {
  const activities = useActivities()
  const { period, presets, setPreset, setCustom } = useReportPeriod('atividades', 'tudo')
  const [tipo, setTipo] = useSessionState<string | undefined>('report_atividades_tipo', undefined)
  const periodText = describePeriod(period)
  const rows = useMemo(() => activities.filter((a) => inPeriod(a.data, period) && (!tipo || a.tipo === tipo)), [activities, period, tipo])
  const types = useMemo(() => [...new Set(activities.map((a) => a.tipo))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [activities])
  const byYear = useMemo(() => activitiesByYear(rows), [rows])
  const byType = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of rows) m.set(a.tipo, (m.get(a.tipo) ?? 0) + a.participantes)
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [rows])
  const participants = rows.reduce((s, a) => s + a.participantes, 0)

  const columns = useMemo<ColumnDef<Activity, any>[]>(
    () => [
      { id: 'data', accessorFn: (a) => a.data, sortingFn: dateSort, meta: { title: 'Data' }, header: ({ column }) => <SortableHeader column={column} title="Data" />, cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span> },
      txtCol('titulo', 'Atividade', (a) => a.titulo),
      txtCol('tipo', 'Área', (a) => a.tipo),
      numCol('participantes', 'Participações', (a) => a.participantes),
    ],
    [],
  )
  const exportColumns: ExportColumn<Activity>[] = [
    { header: 'Data', value: (a) => formatDateBR(a.data) },
    { header: 'Atividade', value: (a) => a.titulo },
    { header: 'Área', value: (a) => a.tipo },
    { header: 'Participações', value: (a) => a.participantes, align: 'right' },
  ]
  const sorted = useMemo(() => [...rows].sort((a, b) => b.data.localeCompare(a.data)), [rows])

  return (
    <ReportShell<Activity>
      slug="atividades"
      title="Relatório de atividades"
      description="Ações e oficinas registradas, com participações por ano e por área."
      periodText={periodText}
      filtersApplied={[tipo ? `Área: ${tipo}` : ''].filter(Boolean)}
      controls={
        <>
          <ReportPeriodControl period={period} presets={presets} onPreset={setPreset} onCustom={setCustom} />
          <SelectFilterControl label="Área" value={tipo} onChange={setTipo} options={types.map((v) => ({ value: v, label: v }))} />
        </>
      }
      summary={
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Ações realizadas" value={formatNumber(rows.length)} scope="Atividades com data no período" />
          <Kpi label="Participações" value={formatNumber(participants)} scope="Soma de participantes por atividade" explanation="Uma mesma pessoa pode ter participado de várias atividades; o valor mede participações, não pessoas distintas." />
          <Kpi label="Participações por ação" value={rows.length ? (participants / rows.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'} scope="Média simples" />
        </div>
      }
      methodology={{
        sources: ['Registro de atividades do sistema (ações e oficinas).'],
        definitions: [
          { term: 'Ações realizadas', text: 'número de atividades registradas com data dentro do período.' },
          { term: 'Participações', text: 'soma do campo “participantes” de cada atividade; não elimina pessoas repetidas.' },
        ],
        notes: ['O sistema ainda não possui tela para cadastrar atividades; os registros vêm dos dados de demonstração.'],
      }}
      exportConfig={{ filename: 'relatorio-atividades', columns: exportColumns, rows: sorted, summary: [{ label: 'Ações realizadas', value: String(rows.length) }, { label: 'Participações', value: formatNumber(participants) }], notes: ['Participações não eliminam pessoas repetidas entre atividades.'] }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ações e participações por ano" description="Quantas atividades e participações em cada ano." unit="ações e participações" period={periodText} source={SYSTEM} empty={byYear.length === 0} altText={`Por ano: ${byYear.map((y) => `${y.year}: ${y.actions} ações, ${y.participants} participações`).join('; ')}.`} tableRows={byYear.map((y) => ({ label: y.year, values: [{ header: 'Ações', value: String(y.actions) }, { header: 'Participações', value: String(y.participants) }] }))} legend={<><LegendItem color={CHART.cash} label="Ações" /><LegendItem color={CHART.inKind} label="Participações" /></>} height={230}>
          <TimeSeriesChart data={byYear} xKey="year" kind="bar" series={[{ key: 'actions', label: 'Ações', color: CHART.cash }, { key: 'participants', label: 'Participações', color: CHART.inKind }]} format={formatNumber} />
        </ChartCard>
        <ChartCard title="Participações por área" description="Onde se concentram as participações." unit="participações" period={periodText} source={SYSTEM} empty={byType.length === 0} altText={`Participações por área: ${byType.map((b) => `${b.label} ${b.value}`).join('; ')}.`} tableRows={byType.map((b) => ({ label: b.label, values: [{ header: 'Participações', value: String(b.value) }] }))} height={230}>
          <HorizontalBarChart data={byType} format={formatNumber} color={CHART.inKind} labelWidth={110} valueLabel="Participações" />
        </ChartCard>
      </div>
      <section aria-labelledby="det">
        <h2 id="det" className="mb-2 text-sm font-semibold">Atividades do período</h2>
        <DataTable<Activity> id="report-activities" caption="Atividades do período" data={sorted} columns={columns} getRowId={(a) => a.id} searchText={(a) => `${a.titulo} ${a.tipo}`} searchPlaceholder="Buscar atividade" initialSort={[{ id: 'data', desc: true }]} noun={['atividade', 'atividades']} empty={{ title: 'Nenhuma atividade no recorte' }} />
      </section>
    </ReportShell>
  )
}

/* ------------------------------ Rede de apoio ------------------------------ */

interface SupportRow {
  id: string
  nome: string
  papel: HelperRole
  ativo: boolean
  doacoes: number
  dinheiro: number
  estimativa: number
}

export function SupportReport() {
  const helpers = useHelpers()
  const donations = useDonations()
  const { period, presets, setPreset, setCustom } = useReportPeriod('rede-de-apoio', 'ano')
  const [papel, setPapel] = useSessionState<string | undefined>('report_rede_papel', undefined)
  const periodText = describePeriod(period)

  const rows = useMemo<SupportRow[]>(
    () =>
      helpers
        .filter((h) => !papel || h.papel === papel)
        .map((h) => {
          const t = summarizeDonations(donationsOfHelper(h, donations).filter((d) => inPeriod(d.data, period)))
          return { id: h.id, nome: h.nome, papel: h.papel, ativo: h.ativo, doacoes: t.confirmedCount, dinheiro: t.cashReceived, estimativa: t.inKindEstimate }
        }),
    [helpers, donations, period, papel],
  )
  const filteredHelpers = helpers.filter((h) => !papel || h.papel === papel)
  const roleCounts = countBy(filteredHelpers, (h) => h.papel)
  const roleData = (Object.keys(ROLE_LABEL) as HelperRole[]).map((r) => ({ label: ROLE_LABEL[r], value: roleCounts[r] ?? 0, color: HELPER_ROLE_COLOR[r] }))
  const contributors = rows.filter((r) => r.doacoes > 0).length
  const cash = rows.reduce((s, r) => s + r.dinheiro, 0)
  const topDonors = [...rows].filter((r) => r.dinheiro > 0).sort((a, b) => b.dinheiro - a.dinheiro).slice(0, 8)
  const joinedByYear = useMemo(() => {
    const m = countBy(filteredHelpers, (h) => h.desde.slice(0, 4))
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([year, entries]) => ({ year, entries }))
  }, [filteredHelpers])

  const columns = useMemo<ColumnDef<SupportRow, any>[]>(
    () => [
      txtCol('nome', 'Nome', (r) => r.nome),
      txtCol('papel', 'Participação', (r) => ROLE_LABEL[r.papel]),
      txtCol('ativo', 'Situação', (r) => (r.ativo ? 'Ativo' : 'Inativo')),
      numCol('doacoes', 'Doações confirmadas', (r) => r.doacoes),
      numCol('dinheiro', 'Dinheiro recebido', (r) => r.dinheiro, formatBRL),
      numCol('estimativa', 'Estimativa de bens/serviços', (r) => r.estimativa, formatBRL),
    ],
    [],
  )
  const exportColumns: ExportColumn<SupportRow>[] = [
    { header: 'Nome', value: (r) => r.nome },
    { header: 'Participação', value: (r) => ROLE_LABEL[r.papel] },
    { header: 'Situação', value: (r) => (r.ativo ? 'Ativo' : 'Inativo') },
    { header: 'Doações confirmadas', value: (r) => r.doacoes, align: 'right' },
    { header: 'Dinheiro recebido (R$)', value: (r) => formatBRL(r.dinheiro), align: 'right' },
    { header: 'Estimativa bens/serviços (R$)', value: (r) => formatBRL(r.estimativa), align: 'right' },
  ]

  return (
    <ReportShell<SupportRow>
      slug="rede-de-apoio"
      title="Relatório da rede de apoio"
      description="Quem apoia o Instituto e quanto contribuiu no período. Sem e-mail nem telefone."
      periodText={periodText}
      filtersApplied={[papel ? `Participação: ${ROLE_LABEL[papel as HelperRole]}` : ''].filter(Boolean)}
      controls={
        <>
          <ReportPeriodControl period={period} presets={presets} onPreset={setPreset} onCustom={setCustom} />
          <SelectFilterControl label="Participação" value={papel} onChange={setPapel} options={(Object.keys(ROLE_LABEL) as HelperRole[]).map((v) => ({ value: v, label: ROLE_LABEL[v] }))} />
        </>
      }
      summary={
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Pessoas e organizações" value={formatNumber(filteredHelpers.length)} scope="Cadastros na rede (situação atual)" />
          <Kpi label="Ativas" value={formatNumber(filteredHelpers.filter((h) => h.ativo).length)} scope="Situação atual" />
          <Kpi label="Contribuíram no período" value={formatNumber(contributors)} scope="Com doação confirmada no período" />
          <Kpi label="Dinheiro recebido" value={formatBRL(cash)} scope="Doações financeiras confirmadas no período" />
        </div>
      }
      methodology={{
        sources: ['Cadastro da Rede de apoio.', 'Registro de doações, ligado ao doador pelo identificador do cadastro.'],
        definitions: [
          { term: 'Contribuíram no período', text: 'pessoas com ao menos uma doação confirmada com data no período.' },
          { term: 'Dinheiro recebido', text: 'doações financeiras confirmadas; estimativas de bens e serviços aparecem em coluna separada.' },
        ],
        notes: ['Doações cujo doador foi removido do cadastro não aparecem neste relatório por pessoa (mas contam no relatório de doações).'],
      }}
      exportConfig={{ filename: 'relatorio-rede-de-apoio', columns: exportColumns, rows, summary: [{ label: 'Pessoas e organizações', value: String(filteredHelpers.length) }, { label: 'Contribuíram no período', value: String(contributors) }, { label: 'Dinheiro recebido', value: formatBRL(cash) }], notes: ['Contatos (e-mail e telefone) não são exportados.'] }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Composição da rede" description="Quantidade por tipo de participação." unit="pessoas e organizações" period="Situação atual" source={SYSTEM} empty={filteredHelpers.length === 0} altText={`Composição: ${roleData.map((r) => `${r.label} ${r.value}`).join(', ')}.`} tableRows={roleData.map((r) => ({ label: r.label, values: [{ header: 'Quantidade', value: String(r.value) }] }))} height={150}>
          <CompositionBar data={roleData} format={formatNumber} />
        </ChartCard>
        <ChartCard title="Maiores contribuições em dinheiro" description="Doações financeiras confirmadas no período, por pessoa ou organização." unit="R$ (reais)" period={periodText} source={SYSTEM} empty={topDonors.length === 0} altText={`Maiores contribuições: ${topDonors.map((d) => `${d.nome} ${formatBRL(d.dinheiro)}`).join('; ')}.`} tableRows={topDonors.map((d) => ({ label: d.nome, values: [{ header: 'Dinheiro', value: formatBRL(d.dinheiro) }] }))} height={150}>
          <HorizontalBarChart data={topDonors.map((d) => ({ label: d.nome, value: d.dinheiro }))} format={formatBRLCompact} labelWidth={120} />
        </ChartCard>
      </div>
      <ChartCard title="Entradas na rede por ano" description="Quantas pessoas e organizações passaram a apoiar em cada ano." unit="cadastros" period="Todo o histórico" source={SYSTEM} empty={joinedByYear.length === 0} altText={`Entradas por ano: ${joinedByYear.map((y) => `${y.year}: ${y.entries}`).join('; ')}.`} tableRows={joinedByYear.map((y) => ({ label: y.year, values: [{ header: 'Entradas', value: String(y.entries) }] }))} height={180}>
        <TimeSeriesChart data={joinedByYear} xKey="year" kind="bar" series={[{ key: 'entries', label: 'Entradas', color: CHART.cash }]} format={formatNumber} />
      </ChartCard>
      <section aria-labelledby="det">
        <h2 id="det" className="mb-2 text-sm font-semibold">Contribuições por pessoa</h2>
        <DataTable<SupportRow> id="report-support" caption="Contribuições por pessoa no período" data={rows} columns={columns} getRowId={(r) => r.id} searchText={(r) => r.nome} searchPlaceholder="Buscar pessoa ou organização" initialSort={[{ id: 'dinheiro', desc: true }]} noun={['pessoa', 'pessoas']} empty={{ title: 'Ninguém na rede com esses filtros' }} />
      </section>
    </ReportShell>
  )
}

/* ------------------------------ Resumo institucional ----------------------- */

interface YearRow {
  year: string
  cash: number
  inKind: number
  actions: number
  participants: number
  children: number
  helpers: number
}

export function InstitutionalReport() {
  const donations = useDonations()
  const activities = useActivities()
  const children = useChildren()
  const helpers = useHelpers()
  const periodText = 'Todos os anos com registros'

  const rows = useMemo<YearRow[]>(() => {
    const years = new Set<string>()
    donations.forEach((d) => years.add(d.data.slice(0, 4)))
    activities.forEach((a) => years.add(a.data.slice(0, 4)))
    children.forEach((c) => years.add(c.dataEntrada.slice(0, 4)))
    helpers.forEach((h) => years.add(h.desde.slice(0, 4)))
    return [...years].sort().map((year) => {
      const t = summarizeDonations(donations.filter((d) => d.data.startsWith(year)))
      const acts = activities.filter((a) => a.data.startsWith(year))
      return {
        year,
        cash: t.cashReceived,
        inKind: t.inKindEstimate,
        actions: acts.length,
        participants: acts.reduce((s, a) => s + a.participantes, 0),
        children: children.filter((c) => c.dataEntrada.startsWith(year)).length,
        helpers: helpers.filter((h) => h.desde.startsWith(year)).length,
      }
    })
  }, [donations, activities, children, helpers])

  const totals = summarizeDonations(donations)
  const columns = useMemo<ColumnDef<YearRow, any>[]>(
    () => [
      txtCol('year', 'Ano', (r) => r.year),
      numCol('cash', 'Dinheiro recebido', (r) => r.cash, formatBRL),
      numCol('inKind', 'Estimativa bens/serviços', (r) => r.inKind, formatBRL),
      numCol('actions', 'Ações', (r) => r.actions),
      numCol('participants', 'Participações', (r) => r.participants),
      numCol('children', 'Novas entradas (crianças)', (r) => r.children),
      numCol('helpers', 'Novos apoiadores', (r) => r.helpers),
    ],
    [],
  )
  const exportColumns: ExportColumn<YearRow>[] = [
    { header: 'Ano', value: (r) => r.year },
    { header: 'Dinheiro recebido (R$)', value: (r) => formatBRL(r.cash), align: 'right' },
    { header: 'Estimativa bens/serviços (R$)', value: (r) => formatBRL(r.inKind), align: 'right' },
    { header: 'Ações', value: (r) => r.actions, align: 'right' },
    { header: 'Participações', value: (r) => r.participants, align: 'right' },
    { header: 'Novas entradas (crianças)', value: (r) => r.children, align: 'right' },
    { header: 'Novos apoiadores', value: (r) => r.helpers, align: 'right' },
  ]

  return (
    <ReportShell<YearRow>
      slug="institucional"
      title="Resumo institucional"
      description="Visão anual do Instituto: doações, ações, entradas de crianças e de apoiadores."
      periodText={periodText}
      filtersApplied={[]}
      controls={<p className="text-[13px] text-muted-foreground">Este resumo cobre todo o histórico, ano a ano, sem filtros.</p>}
      summary={
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Dinheiro recebido" value={formatBRL(totals.cashReceived)} scope="Todo o histórico · financeiras confirmadas" />
          <Kpi label="Bens e serviços (estimativa)" value={formatBRL(totals.inKindEstimate)} scope="Todo o histórico · não é caixa" />
          <Kpi label="Ações realizadas" value={formatNumber(activities.length)} scope="Todo o histórico" />
          <Kpi label="Cadastros de crianças" value={formatNumber(children.length)} scope="Histórico total de entradas" />
        </div>
      }
      methodology={{
        sources: ['Doações, atividades, cadastro de crianças e cadastro da rede de apoio do sistema.'],
        definitions: [
          { term: 'Ano', text: 'ano da data da doação, da atividade, da entrada da criança e da entrada do apoiador, respectivamente.' },
          { term: 'Dinheiro recebido', text: 'doações financeiras confirmadas.' },
        ],
        notes: ['Cada coluna tem uma base própria; elas não devem ser somadas entre si.'],
      }}
      exportConfig={{ filename: 'resumo-institucional', columns: exportColumns, rows, summary: [{ label: 'Dinheiro recebido', value: formatBRL(totals.cashReceived) }, { label: 'Bens/serviços (estimativa)', value: formatBRL(totals.inKindEstimate) }, { label: 'Ações', value: String(activities.length) }, { label: 'Cadastros de crianças', value: String(children.length) }] }}
    >
      <ChartCard title="Doações por ano" description="Dinheiro recebido e estimativa de bens e serviços, apenas doações confirmadas." unit="R$ (reais)" period={periodText} source={SYSTEM} empty={rows.length === 0} altText={`Doações por ano: ${rows.map((r) => `${r.year}: ${formatBRL(r.cash)} em dinheiro`).join('; ')}.`} tableRows={rows.map((r) => ({ label: r.year, values: [{ header: 'Dinheiro', value: formatBRL(r.cash) }, { header: 'Estimativa', value: formatBRL(r.inKind) }] }))} legend={<><LegendItem color={CHART.cash} label="Dinheiro recebido" /><LegendItem color={CHART.inKind} label="Bens e serviços (estimativa)" /></>}>
        <TimeSeriesChart data={rows} xKey="year" kind="bar" series={[{ key: 'cash', label: 'Dinheiro recebido', color: CHART.cash }, { key: 'inKind', label: 'Bens e serviços (estimativa)', color: CHART.inKind }]} format={formatBRL} tickFormat={formatBRLCompact} />
      </ChartCard>
      <section aria-labelledby="det">
        <h2 id="det" className="mb-2 text-sm font-semibold">Indicadores por ano</h2>
        <DataTable<YearRow> id="report-institutional" caption="Indicadores por ano" data={rows} columns={columns} getRowId={(r) => r.year} initialSort={[{ id: 'year', desc: true }]} pageSizes={[10, 25]} noun={['ano', 'anos']} empty={{ title: 'Sem registros' }} />
      </section>
    </ReportShell>
  )
}
