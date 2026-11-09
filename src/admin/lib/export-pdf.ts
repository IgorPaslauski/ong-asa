import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { formatPrintStamp } from './format'
import { BRAND, PDF_LAYOUT, UNKNOWN_USER, decoratePages, drawLetterhead } from './pdf-brand'
import type { PdfOptions } from './export'

/** Documento padrão: papel timbrado, ficha do relatório, resumo, tabela e observações. */
export function buildPdf<T>(opts: PdfOptions<T>): jsPDF {
  const { scope, columns, rows, summary } = opts
  const orientation = opts.orientation ?? (columns.length > 6 ? 'landscape' : 'portrait')
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const { margin } = PDF_LAYOUT
  const contentW = pageW - margin * 2
  const printedAt = scope.generatedAt ?? new Date()
  const printedBy = scope.printedBy?.trim() || UNKNOWN_USER
  const bottomLimit = pageH - PDF_LAYOUT.footer

  let y = drawLetterhead(doc, { margin }) + 7

  // Título e descrição
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...BRAND.ink)
  doc.text(scope.title, margin, y, { maxWidth: contentW })
  y += 6
  if (scope.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.muted)
    const lines = doc.splitTextToSize(scope.subtitle, contentW) as string[]
    doc.text(lines, margin, y)
    y += lines.length * 4.2
  }
  y += 2

  // Ficha do relatório: período, emissão, emitente, registros e filtros
  const cells: [string, string][] = [
    ['PERÍODO', scope.period || 'Todo o histórico'],
    ['EMITIDO EM', formatPrintStamp(printedAt)],
    ['EMITIDO POR', printedBy],
    ['REGISTROS', String(rows.length)],
  ]
  const colW = contentW / cells.length
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  const wrapped = cells.map(([, v]) => (doc.splitTextToSize(v, colW - 6) as string[]).slice(0, 2))
  const valueLines = Math.max(...wrapped.map((l) => l.length))
  const filtersText = scope.filters?.length ? scope.filters.join('  |  ') : 'Nenhum'
  doc.setFont('helvetica', 'normal')
  const filterLines = doc.splitTextToSize(filtersText, contentW - 6) as string[]
  const rowH = 6 + valueLines * 4
  const boxH = rowH + 5.5 + filterLines.length * 4 + 2.5
  doc.setFillColor(...BRAND.soft)
  doc.setDrawColor(...BRAND.line)
  doc.roundedRect(margin, y, contentW, boxH, 1.5, 1.5, 'FD')
  cells.forEach(([label], i) => {
    const x = margin + i * colW + 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(...BRAND.blue)
    doc.text(label, x, y + 4.6)
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.ink)
    doc.text(wrapped[i], x, y + 9)
  })
  const fy = y + rowH + 1
  doc.setDrawColor(...BRAND.line)
  doc.line(margin + 3, fy, pageW - margin - 3, fy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...BRAND.blue)
  doc.text('FILTROS APLICADOS', margin + 3, fy + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.ink)
  doc.text(filterLines, margin + 3, fy + 8)
  y += boxH + 5

  // Resumo em cartões
  if (summary?.length) {
    const perRow = Math.min(summary.length, 4)
    const cw = contentW / perRow
    summary.forEach((item, i) => {
      const col = i % perRow
      const row = Math.floor(i / perRow)
      const x = margin + col * cw
      const yy = y + row * 18
      doc.setDrawColor(...BRAND.line)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x, yy, cw - 3, 16, 1.2, 1.2, 'FD')
      doc.setFillColor(...BRAND.blue)
      doc.rect(x, yy + 1.5, 0.9, 13, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...BRAND.muted)
      doc.text(item.label, x + 3.5, yy + 5, { maxWidth: cw - 9 })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...BRAND.ink)
      doc.text(item.value, x + 3.5, yy + 10.5, { maxWidth: cw - 9 })
      if (item.hint) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...BRAND.muted)
        doc.text(item.hint, x + 3.5, yy + 14, { maxWidth: cw - 9 })
      }
    })
    y += Math.ceil(summary.length / perRow) * 18 + 3
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: PDF_LAYOUT.headerCompact + 4, bottom: PDF_LAYOUT.footer + 2 },
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(c.value(r) ?? ''))),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: BRAND.ink, lineColor: BRAND.line, lineWidth: 0.1, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND.blue, textColor: [255, 255, 255], fontStyle: 'bold', lineColor: BRAND.blue },
    alternateRowStyles: { fillColor: BRAND.soft },
    columnStyles: Object.fromEntries(columns.map((c, i) => [i, { halign: c.align ?? 'left' }])),
    rowPageBreak: 'avoid',
    showHead: 'everyPage',
  })

  if (scope.notes?.length) {
    // @ts-expect-error lastAutoTable é adicionado pelo plugin
    let ny: number = (doc.lastAutoTable?.finalY ?? y) + 7
    const need = (n: number) => {
      if (ny + n > bottomLimit) {
        doc.addPage()
        ny = PDF_LAYOUT.headerCompact + 6
      }
    }
    need(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.blue)
    doc.text('OBSERVAÇÕES', margin, ny)
    ny += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.muted)
    for (const note of scope.notes) {
      const lines = doc.splitTextToSize(note, contentW - 4) as string[]
      need(lines.length * 3.6 + 1.5)
      doc.text('•', margin, ny)
      doc.text(lines, margin + 4, ny)
      ny += lines.length * 3.6 + 1.5
    }
  }

  decoratePages(doc, {
    title: scope.title,
    footerLabel: `${scope.title}${scope.period ? ` • ${scope.period}` : ''}`,
    printedAt,
    printedBy,
    margin,
  })
  return doc
}
