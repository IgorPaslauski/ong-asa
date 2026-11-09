/**
 * Exportações (CSV e PDF). Sempre recebem os dados JÁ filtrados e ordenados
 * pela tela e descrevem o escopo (período e filtros) no próprio arquivo.
 */
import { formatDateTimeBR } from './format'

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
  generatedAt?: Date
  /** Linhas de observação exibidas no fim (metodologia, dados demonstrativos...). */
  notes?: string[]
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
    lines.push(`${esc('Gerado em')};${esc(formatDateTimeBR(scope.generatedAt ?? new Date()))}`)
    lines.push(`${esc('Registros')};${esc(rows.length)}`)
    lines.push('')
  }
  lines.push(columns.map((c) => esc(c.header)).join(';'))
  for (const row of rows) lines.push(columns.map((c) => esc(c.value(row))).join(';'))
  // BOM para o Excel reconhecer UTF-8; separador ";" é o padrão do Excel em pt-BR.
  return `﻿${lines.join('\r\n')}\r\n`
}

export function exportCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[], scope?: ExportScope) {
  downloadBlob(new Blob([toCsv(rows, columns, scope)], { type: 'text/csv;charset=utf-8;' }), filename)
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
  orientation?: 'portrait' | 'landscape'
}

/** Gera e baixa o PDF. O gerador (jsPDF) é carregado sob demanda para não pesar no painel. */
export async function exportPdf<T>(opts: PdfOptions<T>): Promise<void> {
  const { buildPdf } = await import('./export-pdf')
  buildPdf(opts).save(opts.filename)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
