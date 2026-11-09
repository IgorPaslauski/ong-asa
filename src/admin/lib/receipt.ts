import { jsPDF } from 'jspdf'
import { DONATION_TYPE_LABEL, type Donation } from '@/data/mock'
import { ORG } from '@/data/org'
import { getSessionUser } from '@/lib/auth'
import { formatBRL, formatDateBR } from './format'
import { BRAND, drawFooter, drawLetterhead, preloadLogo } from './pdf-brand'

const INK = BRAND.ink
const MUTED = BRAND.muted

/** Só doações confirmadas geram recibo. */
export const canIssueReceipt = (d: Pick<Donation, 'status'>) => d.status === 'confirmada'

/** Número do recibo derivado do lançamento (estável: o mesmo lançamento sempre gera o mesmo número). */
export function receiptNumber(d: Pick<Donation, 'id' | 'data'>): string {
  return `${d.data.slice(0, 4)}-${d.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase()}`
}

export function buildReceipt(d: Donation, issuedAt: Date = new Date(), issuedBy: string | undefined = getSessionUser()?.nome): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()
  const m = 20
  const financial = d.tipo === 'financeira'

  drawLetterhead(doc, { margin: m })

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('RECIBO DE DOAÇÃO', m, 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(`Nº ${receiptNumber(d)}`, w - m, 48, { align: 'right' })

  const intro = financial
    ? `Recebemos de ${d.doadorNome} a importância de ${formatBRL(d.valor)}, doada ao ${ORG.name} em ${formatDateBR(d.data)}.`
    : `Recebemos de ${d.doadorNome} a doação descrita abaixo, entregue ao ${ORG.name} em ${formatDateBR(d.data)}. O valor indicado é uma estimativa atribuída ao bem ou serviço.`
  doc.setTextColor(...INK)
  doc.setFontSize(11)
  const introLines = doc.splitTextToSize(intro, w - m * 2) as string[]
  doc.text(introLines, m, 61)
  let y = 61 + introLines.length * 5.5 + 6

  const rows: [string, string][] = [
    ['Doador', d.doadorNome],
    ['Tipo', DONATION_TYPE_LABEL[d.tipo]],
    [financial ? 'Valor' : 'Valor estimado', formatBRL(d.valor)],
    ['Data', formatDateBR(d.data)],
    ['Destinação', d.destinacao || 'Geral'],
  ]
  if (d.descricao) rows.push(['Descrição', d.descricao])

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(label.toUpperCase(), m, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    const lines = doc.splitTextToSize(value, w - m * 2 - 40) as string[]
    doc.text(lines, m + 40, y)
    y += Math.max(lines.length, 1) * 5.5 + 3
    doc.setDrawColor(225, 230, 236)
    doc.line(m, y - 3.5, w - m, y - 3.5)
  }

  y += 14
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(`${ORG.city}/${ORG.state}, ${formatDateBR(issuedAt.toISOString().slice(0, 10))}.`, m, y)
  y += 24
  doc.setDrawColor(...INK)
  doc.line(m, y, m + 80, y)
  doc.setFontSize(10)
  doc.text(ORG.president, m, y + 5)
  doc.setTextColor(...MUTED)
  doc.setFontSize(9)
  doc.text(`Presidente · ${ORG.name}`, m, y + 9.5)

  drawFooter(doc, { label: `Recibo de doação Nº ${receiptNumber(d)} • documento emitido pelo sistema administrativo`, printedAt: issuedAt, printedBy: issuedBy, page: 1, total: 1, margin: m })
  return doc
}

export async function downloadReceipt(d: Donation) {
  await preloadLogo()
  buildReceipt(d).save(`recibo-${receiptNumber(d)}.pdf`)
}
