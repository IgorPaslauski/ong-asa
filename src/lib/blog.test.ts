import { describe, expect, it } from 'vitest'
import { excerptOf, formatLongDate, parseBody, safeImageSrc, selectPublicPosts, slugify, uniqueSlug } from './blog'

const base = { id: 'p1', slug: 'ola', titulo: 'Olá', resumo: '', corpo: 'texto', capa: '', capaAlt: '', autor: 'A', autorId: 'u', categoria: 'Notícias', status: 'publicado', publicadoEm: '2026-01-10', criadoEm: '2026-01-09' }

describe('blog', () => {
  it('gera slugs sem acentos e únicos', () => {
    expect(slugify('Ação de Natal 2026!')).toBe('acao-de-natal-2026')
    expect(slugify('???')).toBe('post')
    expect(uniqueSlug('Olá', [{ id: 'x', slug: 'ola' }])).toBe('ola-2')
    expect(uniqueSlug('Olá', [{ id: 'x', slug: 'ola' }], 'x')).toBe('ola')
  })

  it('mostra no site só posts publicados e já na data', () => {
    const posts = [
      base,
      { ...base, id: 'p2', slug: 'rasc', status: 'rascunho' },
      { ...base, id: 'p3', slug: 'rev', status: 'revisao' },
      { ...base, id: 'p4', slug: 'futuro', publicadoEm: '2026-12-31' },
      { ...base, id: 'p5', slug: 'novo', publicadoEm: '2026-02-01' },
      { ...base, id: 'p6', slug: '', titulo: 'sem slug' },
      null,
    ]
    expect(selectPublicPosts(posts, '2026-03-01').map((p) => p.id)).toEqual(['p5', 'p1'])
    expect(selectPublicPosts('lixo')).toEqual([])
  })

  it('converte o texto em blocos sem HTML', () => {
    const blocks = parseBody('Primeira linha\ncontinua\n\n## Título\n\n- a\n- b\n\n<script>x</script>')
    expect(blocks).toEqual([
      { type: 'p', text: 'Primeira linha continua' },
      { type: 'h', text: 'Título' },
      { type: 'ul', items: ['a', 'b'] },
      { type: 'p', text: '<script>x</script>' },
    ])
  })

  it('resume e formata datas', () => {
    expect(excerptOf({ resumo: '', corpo: 'palavra '.repeat(60) }, 50).endsWith('…')).toBe(true)
    expect(excerptOf({ resumo: 'curto', corpo: 'longo' })).toBe('curto')
    expect(formatLongDate('2026-10-05')).toBe('5 de outubro de 2026')
  })

  it('aceita só imagens seguras', () => {
    expect(safeImageSrc('javascript:alert(1)')).toBe('')
    expect(safeImageSrc('https://x.com/a.jpg')).toBe('https://x.com/a.jpg')
    expect(safeImageSrc('data:image/jpeg;base64,AAAA')).toContain('data:image')
    expect(safeImageSrc('data:text/html;base64,AAAA')).toBe('')
  })
})

import { bodyToHtml, bodyToText, readingMinutes, sanitizeHtml } from './blog'

describe('blog — texto formatado', () => {
  it('remove scripts, eventos e links perigosos, mantém a formatação', () => {
    const out = sanitizeHtml('<p onclick="x()">Oi <strong>forte</strong> <em>itálico</em> <code>a</code><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">ruim</a> <a href="https://ok.com">bom</a></p>')
    expect(out).toContain('<strong>forte</strong>')
    expect(out).toContain('<em>itálico</em>')
    expect(out).toContain('<code>a</code>')
    expect(out).not.toMatch(/script|onclick|onerror|<img|javascript:/i)
    expect(out).toContain('href="https://ok.com"')
    expect(out).toContain('rel="noopener noreferrer nofollow"')
  })

  it('converte posts antigos em texto simples para HTML escapado', () => {
    expect(bodyToHtml('Olá\n\n## Título\n\n- a\n- b')).toBe('<p>Olá</p><h2>Título</h2><ul><li><p>a</p></li><li><p>b</p></li></ul>')
    expect(bodyToHtml('um & dois')).toBe('<p>um &amp; dois</p>')
  })

  it('extrai texto puro e calcula leitura', () => {
    expect(bodyToText('<p>Olá <strong>mundo</strong></p><p>fim</p>')).toBe('Olá mundo fim')
    expect(bodyToText('<p></p>')).toBe('')
    expect(readingMinutes('<p>poucas palavras</p>')).toBe(1)
  })
})
