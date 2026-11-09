import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { clamp } from '../lib/motion'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Composições com sticky e cenas longas: só em telas largas e sem redução de movimento. */
export const useEnhancedMotion = () =>
  useMediaQuery('(min-width: 901px) and (prefers-reduced-motion: no-preference)')

/** Efeitos leves (revelação de texto, escala de foto): qualquer tela, se o usuário permitir movimento. */
export const useMotionAllowed = () => useMediaQuery('(prefers-reduced-motion: no-preference)')

type Mode = 'track' | 'view' | 'read'

/**
 * Vincula o progresso do scroll (0–1) a um elemento, sem re-render do React.
 *  - `track`: progresso ao atravessar um bloco alto (contêiner de 200vh com filho sticky).
 *  - `view`: progresso enquanto o elemento cruza a viewport (entra por baixo, sai por cima).
 *  - `read`: como `view`, mas completa mais cedo (para texto: 100% quando a base chega a ~60% da tela).
 *
 * O progresso entregue a `onUpdate` é SUAVIZADO: persegue o alvo com um filtro exponencial
 * de constante de tempo `tau` (s), o que dá uma leve inércia sem atrasar a interface.
 * É a única camada de suavização — por isso os elementos animados não devem ter `transition` CSS
 * nas propriedades controladas. `onUpdate` só escreve estilos (transform/opacity) em refs;
 * `onReset` limpa esses estilos quando o efeito é desativado.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onUpdate: (progress: number) => void,
  mode: Mode = 'track',
  onReset?: () => void,
  tau = 0.14,
) {
  const update = useRef(onUpdate)
  const reset = useRef(onReset)

  useEffect(() => {
    update.current = onUpdate
    reset.current = onReset
  })

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return

    const measure = () => {
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight
      if (mode === 'track') {
        const total = rect.height - viewport
        return total > 0 ? clamp(-rect.top / total) : 0
      }
      if (mode === 'read') return clamp((viewport * 0.92 - rect.top) / (viewport * 0.3 + rect.height))
      return clamp((viewport * 0.9 - rect.top) / (viewport * 0.45 + rect.height))
    }

    let frame = 0
    let last = 0
    let target = measure()
    let current = target

    const tick = (now: number) => {
      target = measure()
      // filtro dependente do tempo real: quadros lentos alcançam o alvo em vez de arrastar o movimento
      const dt = Math.min(0.25, (now - last) / 1000 || 0.016)
      last = now
      current += (target - current) * (1 - Math.exp(-dt / tau))
      const settled = Math.abs(target - current) < 0.0003
      if (settled) current = target
      update.current(current)
      frame = settled ? 0 : requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }
    const onResize = () => {
      current = target = measure()
      update.current(current)
      kick()
    }

    update.current(current)
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
      reset.current?.()
    }
  }, [ref, enabled, mode, tau])
}
