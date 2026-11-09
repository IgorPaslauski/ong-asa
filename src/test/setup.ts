import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Polyfills de APIs de navegador ausentes no jsdom e exigidas pelo Radix UI.
const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>
proto.hasPointerCapture ??= () => false
proto.setPointerCapture ??= () => {}
proto.releasePointerCapture ??= () => {}
proto.scrollIntoView ??= () => {}
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as Record<string, unknown>).ResizeObserver ??= ResizeObserverStub
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
