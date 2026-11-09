/** Utilitários de interpolação para animações vinculadas ao progresso do scroll. */

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Progresso (0–1) de `p` dentro do intervalo [a, b]. */
export const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a))

/** Easing suave (derivada zero nas pontas): bom para entradas e saídas isoladas. */
export const smooth = (t: number) => t * t * (3 - 2 * t)

/** Easing ainda mais suave que `smooth` (aceleração também contínua). */
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Interpolação cúbica monotônica (Fritsch–Carlson) por canal.
 * Passa por todos os keyframes com velocidade contínua — sem parar a cada keyframe
 * (como aconteceria ao aplicar easing por trecho) e sem ultrapassar os valores (sem "overshoot").
 */
function monotone(xs: number[], ys: number[], p: number): number {
  const n = xs.length
  if (p <= xs[0]) return ys[0]
  if (p >= xs[n - 1]) return ys[n - 1]

  const h: number[] = []
  const d: number[] = []
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i]
    d[i] = (ys[i + 1] - ys[i]) / h[i]
  }
  const m: number[] = new Array(n)
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0
    } else {
      const w1 = 2 * h[i] + h[i - 1]
      const w2 = h[i] + 2 * h[i - 1]
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    }
  }

  let k = 0
  while (p > xs[k + 1]) k++
  const t = (p - xs[k]) / h[k]
  const t2 = t * t
  const t3 = t2 * t
  return (
    (2 * t3 - 3 * t2 + 1) * ys[k] +
    (t3 - 2 * t2 + t) * h[k] * m[k] +
    (-2 * t3 + 3 * t2) * ys[k + 1] +
    (t3 - t2) * h[k] * m[k + 1]
  )
}

/**
 * Valores `[v1, v2, ...]` em `p` a partir de keyframes `[p, v1, v2, ...]` (p crescente).
 */
export function sample(keys: number[][], p: number): number[] {
  const xs = keys.map((key) => key[0])
  const channels = keys[0].length - 1
  return Array.from({ length: channels }, (_, c) =>
    monotone(
      xs,
      keys.map((key) => key[c + 1]),
      p,
    ),
  )
}
