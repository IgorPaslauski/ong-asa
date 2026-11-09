import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { formatDateTimeBR } from './format'
import type { PdfOptions } from './export'

const GREEN: [number, number, number] = [17, 107, 86]
const INK: [number, number, number] = [24, 33, 43]
const MUTED: [number, number, number] = [91, 103, 120]

export function buildPdf<T>(opts: PdfOptions<T>): jsPDF {
  const { scope, columns, rows, summary } = opts
  const orientation = opts.orientation ?? (columns.length > 6 ? 'landscape' : 'portrait')
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const generated = formatDateTimeBR(scope.generatedAt ?? new Date())

  // Cabeçalho institucional
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageW, 3, 'F')
  doc.setTextColor(...GREEN)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('INSTITUTO A.S.A.', margin, 12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.setFontSize(8.5)
  doc.text('Associação Semeando o Amanhã - Condor/RS', margin, 16.5)

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(scope.title, margin, 27)
  let y = 32
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  if (scope.subtitle) {
    const lines = doc.splitTextToSize(scope.subtitle, pageW - margin * 2) as string[]
    doc.text(lines, margin, y)
    y += lines.length * 4.2
  }
  const meta: string[] = []
  if (scope.period) meta.push(`Período: ${scope.period}`)
  meta.push(`Gerado em: ${generated}`)
  meta.push(`Registros: ${rows.length}`)
  doc.text(meta.join('   •   '), margin, y)
  y += 4.5
  const filtersText = `Filtros aplicados: ${scope.filters?.length ? scope.filters.join(' | ') : 'nenhum'}`
  const fl = doc.splitTextToSize(filtersText, pageW - margin * 2) as string[]
  doc.text(fl, margin, y)
  y += fl.length * 4.2 + 2

  // Resumo
  if (summary?.length) {
    const colW = (pageW - margin * 2) / Math.min(summary.length, 4)
    summary.forEach((item, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = margin + col * colW
      const yy = y + row * 17
      doc.setDrawColor(229, 231, 235)
      doc.setFillColor(248, 249, 250)
      doc.roundedRect(x, yy, colW - 3, 15, 1.2, 1.2, 'FD')
      doc.setFontSize(7.5)
      doc.setTextColor(...MUTED)
      doc.text(item.label, x + 3, yy + 5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11.5)
      doc.setTextColor(...INK)
      doc.text(item.value, x + 3, yy + 10.5)
      if (item.hint) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...MUTED)
        doc.text(item.hint, x + 3, yy + 13.6, { maxWidth: colW - 8 })
      }
      doc.setFont('helvetica', 'normal')
    })
    y += Math.ceil(summary.length / 4) * 17 + 2
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: 18, bottom: 16 },
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(c.value(r) ?? ''))),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: INK, lineColor: [229, 231, 235], lineWidth: 0.1, overflow: 'linebreak' },
    headStyles: { fillColor: [241, 243, 245], textColor: INK, fontStyle: 'bold', lineColor: [229, 231, 235] },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: Object.fromEntries(columns.map((c, i) => [i, { halign: c.align ?? 'left' }])),
    rowPageBreak: 'avoid',
    showHead: 'everyPage',
  })

  if (scope.notes?.length) {
    // @ts-expect-error lastAutoTable é adicionado pelo plugin
    let ny: number = (doc.lastAutoTable?.finalY ?? y) + 6
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    for (const note of scope.notes) {
      const lines = doc.splitTextToSize(note, pageW - margin * 2) as string[]
      if (ny + lines.length * 3.6 > pageH - 16) {
        doc.addPage()
        ny = 20
      }
      doc.text(lines, margin, ny)
      ny += lines.length * 3.6 + 1.5
    }
  }

  // Rodapé com paginação em todas as páginas
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setDrawColor(229, 231, 235)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`Instituto A.S.A. • ${scope.title}${scope.period ? ` • ${scope.period}` : ''}`, margin, pageH - 7.5)
    doc.text(`Página ${p} de ${total}`, pageW - margin, pageH - 7.5, { align: 'right' })
  }
  return doc
}

