import { describe, expect, it } from 'vitest'
import { buildPdf } from './export-pdf'
import type { ExportColumn, ExportScope } from './export'

type Row = { a: string; b: string }
const columns: ExportColumn<Row>[] = [
  { header: 'A', value: (r) => r.a },
  { header: 'B', value: (r) => r.b },
]
const rows: Row[] = Array.from({ length: 80 }, (_, i) => ({ a: `linha ${i}`, b: 'x' }))
const scope: ExportScope = { title: 'Relatório de teste', period: '2026', generatedAt: new Date(2026, 10, 9, 14, 32), printedBy: 'Maria' }

function text(doc: ReturnType<typeof buildPdf>, page: number): string {
  // jsPDF guarda o conteúdo de cada página como string de operadores PDF.
  return String((doc.internal as unknown as { pages: string[][] }).pages[page].join('\n'))
}

describe('PDF padrão', () => {
  it('respeita a orientação escolhida', () => {
    const portrait = buildPdf({ filename: 'a', scope, columns, rows: rows.slice(0, 3), orientation: 'portrait' })
    const landscape = buildPdf({ filename: 'a', scope, columns, rows: rows.slice(0, 3), orientation: 'landscape' })
    expect(portrait.internal.pageSize.getWidth()).toBeLessThan(portrait.internal.pageSize.getHeight())
    expect(landscape.internal.pageSize.getWidth()).toBeGreaterThan(landscape.internal.pageSize.getHeight())
  })

  it('sem escolha, decide pelo número de colunas', () => {
    const wide = Array.from({ length: 8 }, (_, i): ExportColumn<Row> => ({ header: `C${i}`, value: (r) => r.a }))
    expect(buildPdf({ filename: 'a', scope, columns, rows: [] }).internal.pageSize.getWidth()).toBeLessThan(210.1)
    expect(buildPdf({ filename: 'a', scope, columns: wide, rows: [] }).internal.pageSize.getWidth()).toBeGreaterThan(290)
  })

  it('repete rodapé com emissão, usuário e paginação em todas as páginas', () => {
    const doc = buildPdf({ filename: 'a', scope, columns, rows, orientation: 'portrait' })
    const total = doc.getNumberOfPages()
    expect(total).toBeGreaterThan(1)
    for (let p = 1; p <= total; p++) {
      const t = text(doc, p)
      expect(t).toContain('Impresso em 09/11/2026 às 14:32 por Maria')
      expect(t).toContain(`Página ${p} de ${total}`)
    }
  })

  it('identifica a falta de usuário em vez de omitir', () => {
    const doc = buildPdf({ filename: 'a', scope: { ...scope, printedBy: undefined }, columns, rows: [], orientation: 'portrait' })
    expect(text(doc, 1)).toContain('usuário não identificado')
  })
})
