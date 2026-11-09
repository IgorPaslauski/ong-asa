import type { EventItem } from '../data/mock'
import { getEvents } from './storage'

function todayLocalISO(now = new Date()) {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/**
 * Eventos exibidos no site: apenas os publicados, de hoje em diante, em ordem de data e hora.
 * Rascunhos e eventos já realizados nunca saem do painel. Lê com tolerância a registros incompletos.
 */
export function selectPublicEvents(events: unknown, today = todayLocalISO()): EventItem[] {
  if (!Array.isArray(events)) return []
  return events
    .filter((e): e is EventItem => !!e && typeof e === 'object')
    .filter((e) => e.publicado === true && typeof e.titulo === 'string' && e.titulo.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(e.data ?? '') && e.data >= today)
    .sort((a, b) => `${a.data}${a.horaInicio ?? ''}`.localeCompare(`${b.data}${b.horaInicio ?? ''}`))
}

export function getPublicEvents(): EventItem[] {
  return selectPublicEvents(getEvents())
}

/** "14:00 às 17:00", "a partir das 14:00" ou "" quando não há horário. */
export function formatEventTime(e: Pick<EventItem, 'horaInicio' | 'horaFim'>): string {
  const a = e.horaInicio?.trim()
  const b = e.horaFim?.trim()
  if (a && b) return `${a} às ${b}`
  if (a) return `a partir das ${a}`
  return ''
}
