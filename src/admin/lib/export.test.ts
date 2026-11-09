import { describe, expect, it } from 'vitest'
import { sanitizeCsvCell, slugify, toCsv } from './export'

describe('exportação CSV', () => {
  it('neutraliza injeção de fórmulas', () => {
    expect(sanitizeCsvCell('=SOMA(A1)')).toBe("'=SOMA(A1)")
    expect(sanitizeCsvCell('@cmd')).toBe("'@cmd")
    expect(sanitizeCsvCell('-5')).toBe('-5') // número legítimo
    expect(sanitizeCsvCell('Maria')).toBe('Maria')
    expect(sanitizeCsvCell(null)).toBe('')
  })

  it('inclui BOM, separador ; e descreve o escopo', () => {
    const csv = toCsv(
      [{ n: 'Ana "A"', v: 10 }],
      [
        { header: 'Nome', value: (r) => r.n },
        { header: 'Valor', value: (r) => r.v },
      ],
      { title: 'Teste', period: '01/01/2026 a 31/01/2026', filters: ['Tipo: Financeira'], generatedAt: new Date(2026, 0, 15, 10, 30) },
    )
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Período";"01/01/2026 a 31/01/2026"')
    expect(csv).toContain('"Filtros";"Tipo: Financeira"')
    expect(csv).toContain('"Registros";"1"')
    expect(csv).toContain('"Nome";"Valor"')
    expect(csv).toContain('"Ana ""A""";"10"')
  })

  it('indica ausência de filtros', () => {
    const csv = toCsv([], [{ header: 'A', value: () => '' }], { title: 'T' })
    expect(csv).toContain('"Filtros";"Nenhum"')
  })

  it('gera slugs sem acentos', () => {
    expect(slugify('Relatório de Doações 2026')).toBe('relatorio-de-doacoes-2026')
  })
})
