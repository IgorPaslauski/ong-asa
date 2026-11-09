import {
  INITIAL_ACTIVITIES,
  INITIAL_CHILDREN,
  INITIAL_DONATIONS,
  INITIAL_HELPERS,
  type Activity,
  type Child,
  type Donation,
  type Helper,
} from '../data/mock'

const KEYS = {
  children: 'asa_children_v2',
  helpers: 'asa_helpers_v2',
  donations: 'asa_donations_v2',
  activities: 'asa_activities_v2',
  session: 'asa_session_v1',
} as const

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

export function isAuthenticated() {
  return localStorage.getItem(KEYS.session) === '1'
}

export function login(email: string, password: string) {
  // MVP demo credentials — any non-empty also accepted for presentation
  const ok =
    (email.trim().toLowerCase() === 'admin@asa-condor.org.br' && password === 'asa2025') ||
    (email.trim().toLowerCase() === 'admin@ongasa.org.br' && password === 'asa2025') ||
    (email.trim().length > 3 && password.trim().length >= 4)
  if (ok) {
    localStorage.setItem(KEYS.session, '1')
    localStorage.setItem('asa_user_email', email.trim())
  }
  return ok
}

export function logout() {
  localStorage.removeItem(KEYS.session)
}

export function currentUserEmail() {
  return localStorage.getItem('asa_user_email') || 'admin@asa-condor.org.br'
}

export function resetAllData() {
  setChildren(INITIAL_CHILDREN)
  setHelpers(INITIAL_HELPERS)
  setDonations(INITIAL_DONATIONS)
  write(KEYS.activities, INITIAL_ACTIVITIES)
}
