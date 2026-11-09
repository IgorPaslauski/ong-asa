/**
 * Blog / notícias do Instituto. Mesmo contrato dos eventos: fica no localStorage,
 * o painel grava e o site público lê com tolerância a registros incompletos.
 */
import DOMPurify from 'dompurify'
import { getPosts } from './storage'

export type PostStatus = 'rascunho' | 'revisao' | 'publicado'

export const POST_STATUS: PostStatus[] = ['rascunho', 'revisao', 'publicado']
export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  rascunho: 'Rascunho',
  revisao: 'Em revisão',
  publicado: 'Publicado',
}

export const POST_CATEGORIES = ['Notícias', 'Atividades', 'Eventos', 'Voluntariado', 'Doações', 'Transparência'] as const

export interface BlogPost {
  id: string
  /** Parte da URL (`#/blog/<slug>`). Gerado na criação e mantido estável nas edições. */
  slug: string
  titulo: string
  /** Texto curto exibido nos cartões e nas prévias. */
  resumo: string
  /** HTML do editor visual (sempre passa por `sanitizeHtml`). Posts antigos podem ter texto simples: `bodyToHtml` converte. */
  corpo: string
  /** URL (ou imagem reduzida em data URL) da foto de capa. Opcional. */
  capa: string
  capaAlt: string
  autor: string
  /** Id do usuário do painel que criou o post (voluntários só editam os próprios). */
  autorId: string
  categoria: string
  status: PostStatus
  /** AAAA-MM-DD. Posts publicados com data futura ficam agendados. */
  publicadoEm: string
  criadoEm: string
}

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

export function normalizePost(r: Record<string, unknown>): BlogPost {
  return {
    id: str(r.id),
    slug: str(r.slug),
    titulo: str(r.titulo),
    resumo: str(r.resumo),
    corpo: str(r.corpo),
    capa: str(r.capa),
    capaAlt: str(r.capaAlt),
    autor: str(r.autor),
    autorId: str(r.autorId),
    categoria: str(r.categoria) || 'Notícias',
    status: (POST_STATUS as string[]).includes(str(r.status)) ? (r.status as PostStatus) : 'rascunho',
    publicadoEm: str(r.publicadoEm),
    criadoEm: str(r.criadoEm),
  }
}

export function todayLocalISO(now = new Date()) {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** "Ação de Natal 2026!" -> "acao-de-natal-2026" */
export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'post'
  )
}

/** Slug livre entre os posts existentes (acrescenta -2, -3… se precisar). */
export function uniqueSlug(titulo: string, existing: readonly Pick<BlogPost, 'slug' | 'id'>[], selfId?: string): string {
  const base = slugify(titulo)
  const taken = new Set(existing.filter((p) => p.id !== selfId).map((p) => p.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** Posts visíveis no site: publicados, com título, slug e data já chegada; mais recentes primeiro. */
export function selectPublicPosts(posts: unknown, today = todayLocalISO()): BlogPost[] {
  if (!Array.isArray(posts)) return []
  return posts
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map(normalizePost)
    .filter((p) => p.status === 'publicado' && p.titulo.trim() !== '' && p.slug !== '' && /^\d{4}-\d{2}-\d{2}$/.test(p.publicadoEm) && p.publicadoEm <= today)
    .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm) || b.criadoEm.localeCompare(a.criadoEm))
}

export function getPublicPosts(): BlogPost[] {
  return selectPublicPosts(getPosts())
}

export type BodyBlock = { type: 'p'; text: string } | { type: 'h'; text: string } | { type: 'ul'; items: string[] }

/** Converte o texto do editor em blocos. O site renderiza os blocos como texto (nunca HTML). */
export function parseBody(corpo: string): BodyBlock[] {
  const blocks: BodyBlock[] = []
  for (const chunk of corpo.replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    let list: string[] | null = null
    let para: string[] = []
    const flushPara = () => {
      if (para.length) blocks.push({ type: 'p', text: para.join(' ') })
      para = []
    }
    const flushList = () => {
      if (list) blocks.push({ type: 'ul', items: list })
      list = null
    }
    for (const line of lines) {
      if (line.startsWith('## ')) {
        flushPara()
        flushList()
        blocks.push({ type: 'h', text: line.slice(3).trim() })
      } else if (/^[-•] /.test(line)) {
        flushPara()
        ;(list ??= []).push(line.slice(2).trim())
      } else {
        flushList()
        para.push(line)
      }
    }
    flushPara()
    flushList()
  }
  return blocks
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a']
let hooked = false

/** Deixa passar só a formatação do editor (nada de scripts, imagens externas, estilos ou eventos). */
export function sanitizeHtml(html: string): string {
  if (!hooked) {
    hooked = true
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer nofollow')
      }
    })
  }
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['href'], ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i })
}

const looksLikeHtml = (corpo: string) => /^\s*</.test(corpo)

/** HTML seguro do corpo. Converte o formato antigo (texto simples com `## ` e `- `) quando preciso. */
export function bodyToHtml(corpo: string): string {
  if (looksLikeHtml(corpo)) return sanitizeHtml(corpo)
  return parseBody(corpo)
    .map((b) => (b.type === 'h' ? `<h2>${esc(b.text)}</h2>` : b.type === 'ul' ? `<ul>${b.items.map((i) => `<li><p>${esc(i)}</p></li>`).join('')}</ul>` : `<p>${esc(b.text)}</p>`))
    .join('')
}

/** Texto puro do corpo (para resumos, tempo de leitura e validação de "vazio"). */
export function bodyToText(corpo: string): string {
  if (!looksLikeHtml(corpo)) return parseBody(corpo).map((b) => (b.type === 'ul' ? b.items.join(' ') : b.text)).join(' ')
  const spaced = corpo.replace(/<\/(p|h\d|li|blockquote|pre)>|<br\s*\/?>/gi, ' ')
  return (new DOMParser().parseFromString(spaced, 'text/html').body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Resumo para cartões: usa o resumo informado ou corta o começo do texto. */
export function excerptOf(p: Pick<BlogPost, 'resumo' | 'corpo'>, max = 160): string {
  const base = p.resumo.trim() || bodyToText(p.corpo)
  if (base.length <= max) return base
  return `${base.slice(0, max).replace(/\s+\S*$/, '')}…`
}

export function readingMinutes(corpo: string): number {
  const words = bodyToText(corpo).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
/** "2026-10-05" -> "5 de outubro de 2026" (sem passar por Date: evita deslocamento de fuso). */
export function formatLongDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  return `${Number(iso.slice(8, 10))} de ${MONTHS_LONG[Number(iso.slice(5, 7)) - 1]} de ${iso.slice(0, 4)}`
}

/** Só aceita http(s), caminhos relativos e imagens embutidas; descarta o resto (ex.: javascript:). */
export function safeImageSrc(src: string): string {
  const s = src.trim()
  if (/^(https?:\/\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(s)) return s
  if (/^(\.\/|\/)[^:]*$/.test(s)) return s
  return ''
}
