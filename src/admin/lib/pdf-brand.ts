/**
 * Identidade visual dos documentos impressos (relatórios, listagens e recibos):
 * papel timbrado (logo + dados da instituição) e rodapé (emissão, usuário, página).
 * Fonte única: qualquer PDF do painel desenha cabeçalho e rodapé por aqui.
 */
import type { jsPDF } from 'jspdf'
import logoUrl from '@/assets/logo-asa-symbol.png'
import { ORG } from '@/data/org'
import { formatPrintStamp } from './format'

export type RGB = [number, number, number]

/** Cores extraídas da logo oficial (azul e verde-água) + neutros de leitura em papel. */
export const BRAND = {
  blue: [4, 106, 229] as RGB,
  teal: [35, 148, 164] as RGB,
  ink: [16, 32, 56] as RGB,
  muted: [88, 100, 118] as RGB,
  line: [221, 226, 234] as RGB,
  soft: [245, 248, 252] as RGB,
}

export const PDF_LAYOUT = {
  margin: 14,
  /** Altura ocupada pelo timbrado completo (1ª página). */
  headerFull: 27,
  /** Altura ocupada pelo timbrado compacto (demais páginas). */
  headerCompact: 16,
  /** Espaço reservado ao rodapé. */
  footer: 17,
}

let logoData: string | null = null

/** Carrega a logo como data URL (jsPDF precisa dos bytes). Chame antes de montar o PDF; falha vira PDF sem logo. */
export async function preloadLogo(): Promise<void> {
  if (logoData) return
  try {
    const blob = await (await fetch(logoUrl)).blob()
    if (!blob.type.startsWith('image/png')) return
    logoData = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => reject(r.error)
      r.readAsDataURL(blob)
    })
  } catch {
    /* sem logo: o documento ainda é gerado */
  }
}

const LOGO_RATIO = 360 / 279

export interface Letterhead {
  /** Timbrado reduzido, para páginas de continuação. */
  compact?: boolean
  /** Título do documento (exibido no timbrado compacto). */
  title?: string
  margin?: number
}

/** Desenha o cabeçalho no topo da página atual. Retorna o Y onde o conteúdo pode começar. */
export function drawLetterhead(doc: jsPDF, { compact = false, title, margin = PDF_LAYOUT.margin }: Letterhead = {}): number {
  const w = doc.internal.pageSize.getWidth()

  // Faixa bicolor da marca
  doc.setFillColor(...BRAND.blue)
  doc.rect(0, 0, w * 0.72, 2.2, 'F')
  doc.setFillColor(...BRAND.teal)
  doc.rect(w * 0.72, 0, w * 0.28, 2.2, 'F')

  const logoH = compact ? 8.5 : 15.5
  const logoW = logoH * LOGO_RATIO
  const top = compact ? 5 : 6.5
  if (logoData) doc.addImage(logoData, 'PNG', margin, top, logoW, logoH)
  const tx = margin + logoW + 3.5

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.blue)
  if (compact) {
    doc.setFontSize(9.5)
    doc.text(ORG.name.toUpperCase(), tx, top + 5.3)
    if (title) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...BRAND.muted)
      doc.text(title, w - margin, top + 5.3, { align: 'right', maxWidth: w - margin * 2 - logoW - 60 })
    }
    doc.setDrawColor(...BRAND.line)
    doc.setLineWidth(0.2)
    doc.line(margin, PDF_LAYOUT.headerCompact - 1.5, w - margin, PDF_LAYOUT.headerCompact - 1.5)
    return PDF_LAYOUT.headerCompact
  }

  doc.setFontSize(14)
  doc.text(ORG.name.toUpperCase(), tx, top + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...BRAND.ink)
  doc.text(ORG.legalName, tx, top + 9.6)
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.muted)
  doc.text(`CNPJ ${ORG.cnpj}  •  ${ORG.address}  •  ${ORG.city}/${ORG.state}  •  CEP ${ORG.cep}`, tx, top + 13.6)

  // Contato à direita
  doc.setFontSize(7.5)
  doc.text(ORG.email, w - margin, top + 5, { align: 'right' })
  doc.text(`${ORG.phone}  •  ${ORG.phoneAlt}`, w - margin, top + 9.2, { align: 'right' })

  doc.setDrawColor(...BRAND.blue)
  doc.setLineWidth(0.5)
  doc.line(margin, PDF_LAYOUT.headerFull - 2.5, w - margin, PDF_LAYOUT.headerFull - 2.5)
  doc.setLineWidth(0.2)
  return PDF_LAYOUT.headerFull
}

export interface FooterInfo {
  /** Descrição curta do documento, à esquerda (ex.: título e período). */
  label: string
  printedAt: Date
  printedBy?: string
  page: number
  total: number
  margin?: number
}

export const UNKNOWN_USER = 'usuário não identificado'

/** Desenha o rodapé da página atual: emissão, usuário e numeração. */
export function drawFooter(doc: jsPDF, { label, printedAt, printedBy, page, total, margin = PDF_LAYOUT.margin }: FooterInfo): void {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...BRAND.line)
  doc.setLineWidth(0.2)
  doc.line(margin, h - 14, w - margin, h - 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND.muted)
  const pageText = `Página ${page} de ${total}`
  const maxW = w - margin * 2 - doc.getTextWidth(pageText) - 6
  doc.text(label, margin, h - 9.5, { maxWidth: maxW })
  doc.text(`Impresso em ${formatPrintStamp(printedAt)} por ${printedBy?.trim() || UNKNOWN_USER}`, margin, h - 5.5, { maxWidth: maxW })

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.ink)
  doc.text(pageText, w - margin, h - 9.5, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.muted)
  doc.text(ORG.name, w - margin, h - 5.5, { align: 'right' })
}

/** Aplica timbrado + rodapé em todas as páginas já geradas. */
export function decoratePages(doc: jsPDF, opts: { title: string; footerLabel: string; printedAt: Date; printedBy?: string; margin?: number }): void {
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    drawLetterhead(doc, { compact: p > 1, title: opts.title, margin: opts.margin })
    drawFooter(doc, { label: opts.footerLabel, printedAt: opts.printedAt, printedBy: opts.printedBy, page: p, total, margin: opts.margin })
  }
}
