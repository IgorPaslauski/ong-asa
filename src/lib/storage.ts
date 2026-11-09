import {
  INITIAL_ACTIVITIES,
  INITIAL_CHILDREN,
  INITIAL_DONATIONS,
  INITIAL_HELPERS,
  type Activity,
  type Child,
  type Donation,
  type EventItem,
  type Helper,
} from '../data/mock'
import { INITIAL_POSTS } from '../data/blogMock'
import type { BlogPost } from './blog'

const KEYS = {
  events: 'asa_events_v1',
  blog: 'asa_blog_v1',
  volunteerApps: 'asa_volunteer_apps_v1',
  children: 'asa_children_v3',
  helpers: 'asa_helpers_v3',
  donations: 'asa_donations_v3',
  activities: 'asa_activities_v3',
} as const

export const STORAGE_KEYS = KEYS

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('asa:data-changed', { detail: { key } }))
}

export function getChildren(): Child[] {
  return read(KEYS.children, INITIAL_CHILDREN)
}

export function setChildren(items: Child[]) {
  write(KEYS.children, items)
}

export function getHelpers(): Helper[] {
  return read(KEYS.helpers, INITIAL_HELPERS)
}

export function setHelpers(items: Helper[]) {
  write(KEYS.helpers, items)
}

export function getDonations(): Donation[] {
  return read(KEYS.donations, INITIAL_DONATIONS)
}

export function setDonations(items: Donation[]) {
  write(KEYS.donations, items)
}

export function getActivities(): Activity[] {
  return read(KEYS.activities, INITIAL_ACTIVITIES)
}

export function setActivities(items: Activity[]) {
  write(KEYS.activities, items)
}

/** Eventos futuros: sem dados de demonstração (a agenda só mostra o que a equipe cadastrar). */
export function getEvents(): EventItem[] {
  return read<EventItem[]>(KEYS.events, [])
}

export function setEvents(items: EventItem[]) {
  write(KEYS.events, items)
}

/** Posts do blog: dados de demonstração até alguém cadastrar ou remover posts no painel. */
export function getPosts(): BlogPost[] {
  return read<BlogPost[]>(KEYS.blog, INITIAL_POSTS)
}

export function setPosts(items: BlogPost[]) {
  write(KEYS.blog, items)
}

export function resetAllData() {
  setChildren(INITIAL_CHILDREN)
  setHelpers(INITIAL_HELPERS)
  setDonations(INITIAL_DONATIONS)
  write(KEYS.activities, INITIAL_ACTIVITIES)
  setPosts(INITIAL_POSTS)
}
