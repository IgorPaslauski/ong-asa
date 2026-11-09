import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, BabyIcon, BarChart3Icon, ClockIcon, HandHeartIcon, HeartHandshakeIcon, PlusIcon, UsersIcon } from 'lucide-react'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select'
import { Segmented } from '@/admin/components/ui/segmented'
import { ChartCard, LegendItem } from '@/admin/components/charts/chart-card'
import { CompositionBar, HorizontalBarChart, TimeSeriesChart } from '@/admin/components/charts/charts'
import { CHART, CHILD_STATUS_COLOR } from '@/admin/components/charts/palette'
import { Kpi } from '@/admin/components/charts/kpi'
import { PageHeader } from '@/admin/components/layout/page-header'
import {
  activitiesByYear,
  buildPeriodPresets,
  countBy,
  describePeriod,
  donationSeries,
  groupDonations,
  inPeriod,
  isFinancial,
  summarizeDonations,
  type Granularity,
} from '@/admin/data/domain'
import { useActivities, useChildren, useDonations, useHelpers } from '@/admin/data/store'
import { formatBRL, formatBRLCompact, formatDateBR, formatMonthLong, formatMonthShort, formatNumber } from '@/admin/lib/format'
import { usePersistentState } from '@/admin/lib/hooks'
import { STATUS_LABEL, type ChildStatus } from '@/data/mock'

const SOURCE = 'cadastros do sistema (dados de demonstração gravados neste navegador)'

type DestMode = 'cash' | 'inKind'

/** Atalho: abre a lista de doações já filtrada por situação. */
function linkWithTableFilter(table: string, filters: Record<string, unknown>) {
  try {
    sessionStorage.setItem(`asa_ui_session_table_${table}_f`, JSON.stringify(filters))
  } catch {
    /* noop */
  }
}

interface RecentEvent {
  id: string
  date: string
  icon: typeof HeartHandshakeIcon
  title: string
  detail: string
  to: string
}

export default function DashboardPage() {
  const children = useChildren()
  const helpers = useHelpers()
  const donations = useDonations()
  const activities = useActivities()

  const presets = useMemo(() => buildPeriodPresets(), [])
  const [periodId, setPeriodId] = usePersistentState<string>('dash_period', '12m')
  const period = presets.find((p) => p.id === periodId) ?? presets[1]
  const [granularity, setGranularity] = usePersistentState<Granularity>('dash_granularity', 'month')
  const [destMode, setDestMode] = useState<DestMode>('cash')

  const periodText = describePeriod(period)
  const inRange = useMemo(() => donations.filter((d) => inPeriod(d.data, period)), [donations, period])
  const totals = useMemo(() => summarizeDonations(inRange), [inRange])
  const allPending = useMemo(() => donations.filter((d) => d.status === 'pendente'), [donations])

  const childCounts = useMemo(() => countBy(children, (c) => c.status), [children])
  const activeHelpers = helpers.filter((h) => h.ativo).length
  const periodActivities = useMemo(() => activities.filter((a) => inPeriod(a.data, period)), [activities, period])

  const series = useMemo(() => donationSeries(donations, granularity, period), [donations, granularity, period])
  const seriesRows = series.map((p) => ({ key: p.key, cash: p.cash, inKind: p.inKind }))
  const fmtKey = (k: string) => (granularity === 'month' ? formatMonthShort(k) : k)

  const destinations = useMemo(() => {
    const confirmed = inRange.filter((d) => d.status === 'confirmada' && (destMode === 'cash' ? isFinancial(d) : !isFinancial(d)))
    return groupDonations(confirmed, (d) => d.destinacao || 'Sem destinação').slice(0, 7)
  }, [inRange, destMode])

  const statusData = (Object.keys(STATUS_LABEL) as ChildStatus[]).map((s) => ({ label: STATUS_LABEL[s], value: childCounts[s] ?? 0, color: CHILD_STATUS_COLOR[s] }))
  const byNeighborhood = useMemo(() => {
    const counts = countBy(children.filter((c) => c.status !== 'concluido'), (c) => c.bairro || 'Não informado')
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value, color: CHART.cash }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [children])

  const actionsYears = useMemo(() => activitiesByYear(periodActivities), [periodActivities])

  const recent = useMemo<RecentEvent[]>(() => {
    const events: RecentEvent[] = [
      ...donations.map((d) => ({
        id: `d${d.id}`,
        date: d.data,
        icon: HeartHandshakeIcon,
        title: `${d.doadorNome} — ${formatBRL(d.valor)}${isFinancial(d) ? '' : ' (estimado)'}`,
        detail: `Doação ${d.status === 'confirmada' ? 'confirmada' : d.status === 'pendente' ? 'pendente' : 'cancelada'} · ${d.destinacao}`,
        to: '/painel/doacoes',
      })),
      ...activities.map((a) => ({
        id: `a${a.id}`,
        date: a.data,
        icon: UsersIcon,
        title: a.titulo,
        detail: `${a.tipo} · ${formatNumber(a.participantes)} participantes`,
        to: '/painel/relatorios/atividades',
      })),
      ...children.map((c) => ({ id: `c${c.id}`, date: c.dataEntrada, icon: BabyIcon, title: 'Nova entrada no acompanhamento', detail: `Código ${c.id} · ${c.bairro || 'bairro não informado'}`, to: '/painel/criancas' })),
      ...helpers.map((h) => ({ id: `h${h.id}`, date: h.desde, icon: HandHeartIcon, title: `${h.nome} entrou na rede de apoio`, detail: 'Cadastro na rede de apoio', to: '/painel/pessoas' })),
    ]
    // Só registros com data até hoje; mais recentes primeiro.
    const today = new Date().toISOString().slice(0, 10)
    return events.filter((e) => e.date <= today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  }, [donations, activities, children, helpers])

  const attention = childCounts.acompanhamento ?? 0

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Como está o Instituto: doações, acompanhamento e o que precisa de atenção."
        actions={
          <div className="flex items-center gap-2">
            <span id="periodo-label" className="text-[13px] text-muted-foreground">Período</span>
            <Select value={period.id} onValueChange={setPeriodId}>
              <SelectTrigger aria-labelledby="periodo-label" className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <section aria-label="Indicadores principais" className="mb-4">
        <h2 className="sr-only">Indicadores principais</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi
            label="Dinheiro recebido"
            value={formatBRL(totals.cashReceived)}
            scope={`No período · ${periodText}`}
            explanation="Soma das doações financeiras com situação Confirmada, com data dentro do período selecionado."
          />
          <Kpi
            label="Bens e serviços (estimativa)"
            value={formatBRL(totals.inKindEstimate)}
            scope="No período · valor estimado, não é caixa"
            explanation="Soma dos valores estimados de alimentos, roupas, materiais e serviços confirmados no período. Não é somado ao dinheiro recebido."
          />
          <Kpi
            label="Crianças e adolescentes ativos"
            value={formatNumber(childCounts.ativo ?? 0)}
            scope={`Situação atual · ${formatNumber(children.length)} cadastros no total`}
            explanation="Cadastros com situação Ativo hoje. Não depende do período selecionado."
          />
          <Kpi
            label="Rede de apoio ativa"
            value={formatNumber(activeHelpers)}
            scope={`Situação atual · ${formatNumber(helpers.length)} pessoas e organizações`}
            explanation="Doadores, voluntários, padrinhos e parceiros marcados como ativos hoje. Não depende do período selecionado."
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <ChartCard
            title="Evolução das doações"
            description="Dinheiro recebido e estimativa de bens e serviços, ao longo do tempo (apenas doações confirmadas)."
            unit="R$ (reais)"
            period={periodText}
            source={SOURCE}
            empty={series.length === 0}
            altText={`Gráfico de barras com ${series.length} ${granularity === 'month' ? 'meses' : 'anos'}. Dinheiro recebido total ${formatBRL(totals.cashReceived)}; estimativa de bens e serviços ${formatBRL(totals.inKindEstimate)}.`}
            tableRows={series.map((p) => ({ label: fmtKey(p.key), values: [{ header: 'Dinheiro', value: formatBRL(p.cash) }, { header: 'Estimativa', value: formatBRL(p.inKind) }] }))}
            legend={
              <>
                <LegendItem color={CHART.cash} label="Dinheiro recebido" />
                <LegendItem color={CHART.inKind} label="Bens e serviços (estimativa)" />
              </>
            }
            controls={
              <Segmented label="Granularidade" value={granularity} onValueChange={setGranularity} options={[{ value: 'month', label: 'Mensal' }, { value: 'year', label: 'Anual' }]} />
            }
            height={280}
          >
            <TimeSeriesChart
              data={seriesRows}
              xKey="key"
              kind="bar"
              series={[
                { key: 'cash', label: 'Dinheiro recebido', color: CHART.cash },
                { key: 'inKind', label: 'Bens e serviços (estimativa)', color: CHART.inKind },
              ]}
              format={formatBRL}
              tickFormat={formatBRLCompact}
              labelFormat={(k) => (granularity === 'month' ? formatMonthLong(k) : k)}
              xTick={fmtKey}
            />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Doações por destinação"
              description="Para onde foram os recursos confirmados no período."
              unit="R$ (reais)"
              period={periodText}
              source={SOURCE}
              empty={destinations.length === 0}
              altText={`Barras horizontais com as ${destinations.length} principais destinações.`}
              tableRows={destinations.map((d) => ({ label: d.label, values: [{ header: 'Valor', value: formatBRL(d.value) }, { header: 'Doações', value: String(d.count) }] }))}
              controls={
                <Segmented label="Natureza do valor" value={destMode} onValueChange={setDestMode} options={[{ value: 'cash', label: 'Dinheiro' }, { value: 'inKind', label: 'Estimativa' }]} />
              }
              height={250}
            >
              <HorizontalBarChart data={destinations.map((d) => ({ label: d.label, value: d.value }))} format={formatBRLCompact} color={destMode === 'cash' ? CHART.cash : CHART.inKind} valueLabel={destMode === 'cash' ? 'Dinheiro recebido' : 'Estimativa'} labelWidth={118} />
            </ChartCard>

            <ChartCard
              title="Acompanhamento das crianças"
              description="Cadastros por situação e bairros com mais crianças em atendimento."
              unit="cadastros"
              period="Situação atual (não depende do período)"
              source={SOURCE}
              empty={children.length === 0}
              altText={`${children.length} cadastros: ${statusData.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')}.`}
              tableRows={statusData.map((s) => ({ label: s.label, values: [{ header: 'Cadastros', value: String(s.value) }] }))}
              height={250}
            >
              <div className="flex h-full flex-col gap-4">
                <div className="min-h-0 flex-1 pt-1">
                  <CompositionBar data={statusData} format={(v) => formatNumber(v)} />
                </div>
                <div className="h-28 shrink-0">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Em atendimento por bairro</p>
                  <div className="h-24">
                    <HorizontalBarChart data={byNeighborhood.slice(0, 4)} format={(v) => formatNumber(v)} labelWidth={80} valueLabel="Crianças" />
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          <ChartCard
            title="Ações e participações por ano"
            description="Atividades registradas e participações nelas (uma pessoa pode participar de mais de uma atividade)."
            unit="ações e participações"
            period={periodText}
            source="registro de atividades do sistema (dados de demonstração)"
            empty={actionsYears.length === 0}
            emptyMessage="Nenhuma atividade registrada no período selecionado."
            altText={`Atividades por ano: ${actionsYears.map((y) => `${y.year}: ${y.actions} ações, ${y.participants} participações`).join('; ')}.`}
            tableRows={actionsYears.map((y) => ({ label: y.year, values: [{ header: 'Ações', value: String(y.actions) }, { header: 'Participações', value: formatNumber(y.participants) }] }))}
            legend={<><LegendItem color={CHART.cash} label="Ações realizadas" /><LegendItem color={CHART.inKind} label="Participações" /></>}
            height={200}
          >
            <TimeSeriesChart
              data={actionsYears.map((y) => ({ year: y.year, actions: y.actions, participants: y.participants }))}
              xKey="year"
              kind="bar"
              series={[
                { key: 'actions', label: 'Ações realizadas', color: CHART.cash },
                { key: 'participants', label: 'Participações', color: CHART.inKind },
              ]}
              format={formatNumber}
            />
          </ChartCard>
        </div>

        <aside className="space-y-4" aria-label="Atenção e atalhos">
          <Card>
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
              <CardDescription>Atalhos para o que a equipe faz com frequência.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild className="h-auto flex-col items-start gap-1 py-2.5">
                <Link to="/painel/doacoes?novo=1"><PlusIcon />Nova doação</Link>
              </Button>
              <Button variant="outline" asChild className="h-auto flex-col items-start gap-1 py-2.5">
                <Link to="/painel/criancas?novo=1"><BabyIcon />Nova criança</Link>
              </Button>
              <Button variant="outline" asChild className="h-auto flex-col items-start gap-1 py-2.5">
                <Link to="/painel/pessoas?novo=1"><HandHeartIcon />Nova pessoa</Link>
              </Button>
              <Button variant="outline" asChild className="h-auto flex-col items-start gap-1 py-2.5">
                <Link to="/painel/relatorios"><BarChart3Icon />Relatórios</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pendências</CardTitle>
              <CardDescription>Registros que aguardam uma decisão da equipe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {allPending.length === 0 && attention === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nenhuma pendência. Tudo em dia.</p>
              ) : null}
              {allPending.length > 0 ? (
                <Link
                  to="/painel/doacoes"
                  onClick={() => linkWithTableFilter('donations', { status: 'pendente' })}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{allPending.length} {allPending.length === 1 ? 'doação aguardando' : 'doações aguardando'} confirmação</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatBRL(allPending.filter(isFinancial).reduce((s, d) => s + d.valor, 0))} em dinheiro ainda não confirmado
                    </span>
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ) : null}
              {attention > 0 ? (
                <Link
                  to="/painel/criancas"
                  onClick={() => linkWithTableFilter('children', { status: 'acompanhamento' })}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{attention} {attention === 1 ? 'cadastro em acompanhamento' : 'cadastros em acompanhamento'}</span>
                    <span className="block text-xs text-muted-foreground">Situação “Em acompanhamento” no cadastro</span>
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
              <CardDescription>Últimos registros do sistema, pela data do evento.</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Ainda não há registros.</p>
              ) : (
                <ol className="divide-y">
                  {recent.map((e) => (
                    <li key={e.id}>
                      <Link to={e.to} className="flex gap-3 py-2.5 transition-colors hover:bg-accent/50">
                        <e.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{e.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{e.detail}</span>
                        </span>
                        <Badge variant="muted" className="h-fit shrink-0 tabular">
                          <ClockIcon />
                          {formatDateBR(e.date)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
