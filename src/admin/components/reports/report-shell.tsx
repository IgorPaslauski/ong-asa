import { useMemo, useState, type ReactNode } from 'react'
import { CalendarIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon, InfoIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Calendar } from '@/admin/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/admin/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/admin/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select'
import { PageHeader } from '@/admin/components/layout/page-header'
import { buildPeriodPresets, describePeriod, type Period } from '@/admin/data/domain'
import { exportCsv, exportPdf, slugify, type ExportColumn, type PdfSummaryItem } from '@/admin/lib/export'
import { formatDateBR, formatDateTimeBR, todayISO } from '@/admin/lib/format'
import { useSessionState } from '@/admin/lib/hooks'
import type { DateRange } from 'react-day-picker'

/* ------------------------------ Período do relatório ----------------------- */

interface StoredPeriod {
  id: string
  from?: string | null
  to?: string | null
}

export function useReportPeriod(slug: string, defaultId = 'ano'): {
  period: Period
  presets: Period[]
  setPreset: (id: string) => void
  setCustom: (from: string | null, to: string | null) => void
} {
  const presets = useMemo(() => buildPeriodPresets(), [])
  const [stored, setStored] = useSessionState<StoredPeriod>(`report_${slug}_period`, { id: defaultId })
  const period = useMemo<Period>(() => {
    if (stored.id === 'custom') return { id: 'custom', label: 'Personalizado', from: stored.from ?? null, to: stored.to ?? null }
    return presets.find((p) => p.id === stored.id) ?? presets[0]
  }, [stored, presets])
  return {
    period,
    presets,
    setPreset: (id) => setStored({ id }),
    setCustom: (from, to) => setStored({ id: 'custom', from, to }),
  }
}

function toDate(iso?: string | null) {
  if (!iso) return undefined
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toIso(d?: Date) {
  return d ? todayISO(d) : null
}

export function ReportPeriodControl({
  period,
  presets,
  onPreset,
  onCustom,
}: {
  period: Period
  presets: Period[]
  onPreset: (id: string) => void
  onCustom: (from: string | null, to: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const range: DateRange | undefined = period.id === 'custom' ? { from: toDate(period.from), to: toDate(period.to) } : undefined
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={period.id === 'custom' ? 'custom' : period.id} onValueChange={(v) => (v === 'custom' ? setOpen(true) : onPreset(v))}>
        <SelectTrigger aria-label="Período do relatório" className="h-9 w-auto min-w-44 gap-2">
          <span className="text-muted-foreground">Período:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Personalizado…</SelectItem>
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 px-3 font-normal">
            <CalendarIcon className="text-muted-foreground" />
            <span className="sr-only">Datas do período:</span>
            <span className="tabular">{describePeriod(period)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <Calendar
            mode="range"
            selected={range}
            defaultMonth={range?.from ?? toDate(period.to) ?? new Date()}
            onSelect={(r) => {
              if (r?.from || r?.to) onCustom(toIso(r.from), toIso(r.to))
            }}
          />
          <div className="flex justify-end gap-2 border-t pt-2">
            <Button variant="ghost" size="sm" onClick={() => { onPreset('tudo'); setOpen(false) }}>
              <XIcon />
              Todo o histórico
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>Aplicar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ------------------------------ Estrutura padrão --------------------------- */

export interface Methodology {
  sources: string[]
  definitions: { term: string; text: string }[]
  notes?: string[]
}

export interface ReportExportConfig<T> {
  filename: string
  columns: ExportColumn<T>[]
  rows: T[]
  summary?: PdfSummaryItem[]
  notes?: string[]
}

function ReportExportMenu<T>({ title, description, periodText, filtersApplied, generatedAt, config }: { title: string; description: string; periodText: string; filtersApplied: string[]; generatedAt: Date; config: ReportExportConfig<T> }) {
  const scope = { title, subtitle: description, period: periodText, filters: filtersApplied, generatedAt, notes: config.notes }
  const name = `${slugify(config.filename)}-${todayISO(generatedAt)}`
  const disabled = config.rows.length === 0
  function run(kind: 'csv' | 'pdf') {
    try {
      if (kind === 'csv') exportCsv(`${name}.csv`, config.rows, config.columns, scope)
      else exportPdf({ filename: `${name}.pdf`, scope, columns: config.columns, rows: config.rows, summary: config.summary })
      toast.success(`${kind.toUpperCase()} gerado.`, { description: `${config.rows.length} linhas · ${periodText}` })
    } catch (e) {
      toast.error('Não foi possível gerar a exportação.', { description: e instanceof Error ? e.message : undefined })
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled} title={disabled ? 'Sem dados no período para exportar' : undefined}>
          <DownloadIcon />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Escopo: {config.rows.length} linhas, {periodText}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => run('pdf')}>
          <FileTextIcon />
          PDF (para impressão)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run('csv')}>
          <FileSpreadsheetIcon />
          CSV (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Estrutura única de todo relatório: cabeçalho (nome, descrição, período,
 * data de geração, filtros), resumo, visualizações, tabela detalhada,
 * metodologia e exportações (CSV/PDF) que respeitam os filtros ativos.
 */
export function ReportShell<T>({
  slug,
  title,
  description,
  periodText,
  controls,
  filtersApplied,
  summary,
  children,
  methodology,
  exportConfig,
}: {
  slug: string
  title: string
  description: string
  periodText: string
  controls: ReactNode
  filtersApplied: string[]
  summary: ReactNode
  children: ReactNode
  methodology: Methodology
  exportConfig: ReportExportConfig<T>
}) {
  const generatedAt = useMemo(() => new Date(), [])
  return (
    <div data-report={slug}>
      <PageHeader
        title={title}
        description={description}
        trail={[]}
        actions={<ReportExportMenu title={title} description={description} periodText={periodText} filtersApplied={filtersApplied} generatedAt={generatedAt} config={exportConfig} />}
      />

      <Card className="mb-4 gap-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">{controls}</div>
        <dl className="grid gap-x-6 gap-y-2 p-3 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Período analisado</dt>
            <dd className="font-medium tabular">{periodText}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gerado em</dt>
            <dd className="font-medium tabular">{formatDateTimeBR(generatedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Filtros aplicados</dt>
            <dd className="flex flex-wrap gap-1">
              {filtersApplied.length ? filtersApplied.map((f) => <Badge key={f} variant="outline">{f}</Badge>) : <span className="font-medium">Nenhum</span>}
            </dd>
          </div>
        </dl>
      </Card>

      <section aria-label="Resumo" className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">Resumo</h2>
        {summary}
      </section>

      <div className="space-y-4">{children}</div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            Metodologia
          </CardTitle>
          <CardDescription>Como os números deste relatório foram obtidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 text-[13px] md:grid-cols-2">
          <div>
            <h3 className="mb-1 font-semibold">Origem dos dados</h3>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {methodology.sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1 font-semibold">Definições dos indicadores</h3>
            <dl className="space-y-1.5">
              {methodology.definitions.map((d) => (
                <div key={d.term}>
                  <dt className="inline font-medium">{d.term}: </dt>
                  <dd className="inline text-muted-foreground">{d.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:col-span-2">
            <h3 className="mb-1 font-semibold">Observações</h3>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              <li><strong className="text-foreground">Dados de demonstração:</strong> o sistema é um MVP com dados fictícios gravados no navegador. Não use estes números como prestação de contas oficial.</li>
              {methodology.notes?.map((n) => <li key={n}>{n}</li>)}
              <li>Exportações refletem exatamente o período e os filtros exibidos acima ({formatDateBR(todayISO())}).</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
