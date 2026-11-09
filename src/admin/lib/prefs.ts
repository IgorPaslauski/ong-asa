/**
 * Preferências visuais (por navegador). Ficam em chaves próprias `asa_ui_*`,
 * separadas dos dados de negócio (`asa_*_v3`).
 */
const PREFIX = 'asa_ui_'

export function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writePref<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível: preferência vale só nesta sessão */
  }
}

export function removePref(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* noop */
  }
}
