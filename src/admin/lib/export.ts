/**
 * Exportações (CSV, PDF e impressão). Sempre recebem os dados JÁ filtrados e
 * ordenados pela tela e descrevem o escopo (período, filtros, emissão e usuário)
 * no próprio arquivo. PDF e impressão usam o mesmo documento (papel timbrado).
 */
import { getSessionUser } from '@/lib/auth'
import { formatPrintStamp } from './format'

export type ExportCell = string | number | null | undefined

export interface ExportColumn<T> {
  header: string
  value: (row: T) => ExportCell
  /** Alinhamento no PDF. */
  align?: 'left' | 'right' | 'center'
}

export interface ExportScope {
  title: string
  subtitle?: string
  period?: string
  filters?: string[]
  /** Data e hora da emissão (padrão: agora). */
  generatedAt?: Date
  /** Nome de quem emitiu (padrão: usuário logado). */
  printedBy?: string
  /** Linhas de observação exibidas no fim (metodologia, dados demonstrativos...). */
  notes?: string[]
}

export type Orientation = 'portrait' | 'landscape'
export type ExportKind = 'print' | 'pdf' | 'csv'

/** Completa emissão e usuário sem sobrescrever o que a tela já informou. */
export function withIssuer(scope: ExportScope): ExportScope & { generatedAt: Date } {
  return {
    ...scope,
    generatedAt: scope.generatedAt ?? new Date(),
    printedBy: scope.printedBy ?? getSessionUser()?.nome,
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Evita injeção de fórmulas em planilhas (=, +, -, @ no início da célula). */
export function sanitizeCsvCell(value: ExportCell): string {
  if (value == null) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`
  return text
}

export function toCsv<T>(rows: T[], columns: ExportColumn<T>[], scope?: ExportScope): string {
  const esc = (c: ExportCell) => `"${sanitizeCsvCell(c).replace(/"/g, '""')}"`
  const lines: string[] = []
  if (scope) {
    lines.push(esc(scope.title))
    if (scope.period) lines.push(`${esc('Período')};${esc(scope.period)}`)
    lines.push(`${esc('Filtros')};${esc(scope.filters?.length ? scope.filters.join(' | ') : 'Nenhum')}`)
    lines.push(`${esc('Gerado em')};${esc(formatPrintStamp(scope.generatedAt ?? new Date()))}`)
    if (scope.printedBy) lines.push(`${esc('Emitido por')};${esc(scope.printedBy)}`)
    lines.push(`${esc('Registros')};${esc(rows.length)}`)
    lines.push('')
  }
  lines.push(columns.map((c) => esc(c.header)).join(';'))
  for (const row of rows) lines.push(columns.map((c) => esc(c.value(row))).join(';'))
  // BOM para o Excel reconhecer UTF-8; separador ";" é o padrão do Excel em pt-BR.
  return `﻿${lines.join('\r\n')}\r\n`
}

export function exportCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[], scope?: ExportScope) {
  downloadBlob(new Blob([toCsv(rows, columns, scope && withIssuer(scope))], { type: 'text/csv;charset=utf-8;' }), filename)
}

export interface PdfSummaryItem {
  label: string
  value: string
  hint?: string
}

export interface PdfOptions<T> {
  filename: string
  scope: ExportScope
  columns: ExportColumn<T>[]
  rows: T[]
  summary?: PdfSummaryItem[]
  /** Sem valor, o PDF escolhe pelo número de colunas (mais de 6 → paisagem). */
  orientation?: Orientation
}

/** Gera e baixa o PDF. O gerador (jsPDF) é carregado sob demanda para não pesar no painel. */
export async function exportPdf<T>(opts: PdfOptions<T>): Promise<void> {
  const { buildPdf } = await import('./export-pdf')
  await (await import('./pdf-brand')).preloadLogo()
  buildPdf({ ...opts, scope: withIssuer(opts.scope) }).save(opts.filename)
}

/** Abre a caixa de impressão do navegador com o mesmo PDF (orientação já definida no documento). */
export async function printPdf<T>(opts: PdfOptions<T>): Promise<void> {
  const { buildPdf } = await import('./export-pdf')
  await (await import('./pdf-brand')).preloadLogo()
  const blob = buildPdf({ ...opts, scope: withIssuer(opts.scope) }).output('blob')
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  frame.src = url
  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch {
      // Navegador bloqueou a impressão embutida: abre o PDF em outra aba.
      window.open(url, '_blank')
    }
  }
  document.body.appendChild(frame)
  setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 5 * 60_000)
}

/** Ponto único de despacho usado por relatórios e listagens. */
export async function runExport<T>(kind: ExportKind, opts: PdfOptions<T> & { csvFilename: string }): Promise<void> {
  if (kind === 'csv') exportCsv(opts.csvFilename, opts.rows, opts.columns, opts.scope)
  else if (kind === 'pdf') await exportPdf(opts)
  else await printPdf(opts)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
