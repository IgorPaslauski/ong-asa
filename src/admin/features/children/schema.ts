import { z } from 'zod'
import type { ChildStatus } from '@/data/mock'

/**
 * Regras preservadas do cadastro original: nome, idade (0–18) e responsável
 * obrigatórios. Acrescentado: data de entrada precisa ser uma data válida.
 */
export const childSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome completo.'),
  idade: z
    .number({ error: 'Informe a idade.' })
    .int('A idade deve ser um número inteiro.')
    .min(0, 'A idade mínima é 0.')
    .max(18, 'A idade máxima é 18 anos.'),
  responsavel: z.string().trim().min(1, 'Informe o responsável.'),
  telefone: z.string().trim(),
  bairro: z.string().trim(),
  escola: z.string().trim(),
  status: z.enum(['ativo', 'acompanhamento', 'concluido'] satisfies ChildStatus[]),
  dataEntrada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data de entrada válida.'),
  observacoes: z.string(),
})

export type ChildFormValues = z.infer<typeof childSchema>

export const AGE_BANDS = [
  { value: 'primeira-infancia', label: '0 a 5 anos', min: 0, max: 5 },
  { value: 'infancia', label: '6 a 11 anos', min: 6, max: 11 },
  { value: 'adolescencia-inicial', label: '12 a 14 anos', min: 12, max: 14 },
  { value: 'adolescencia', label: '15 a 18 anos', min: 15, max: 18 },
] as const

export function ageBandOf(idade: number): (typeof AGE_BANDS)[number]['value'] {
  return (AGE_BANDS.find((b) => idade >= b.min && idade <= b.max) ?? AGE_BANDS[3]).value
}
export function ageBandLabel(idade: number): string {
  return AGE_BANDS.find((b) => b.value === ageBandOf(idade))!.label
}

/** Tempo de acompanhamento desde a data de entrada (apenas cálculo, sem inferência). */
export function timeInProgram(entryISO: string, now = new Date()): string {
  const [y, m, d] = entryISO.split('-').map(Number)
  if (!y) return '—'
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
  if (now.getDate() < d) months -= 1
  if (months < 1) return 'menos de 1 mês'
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`)
  if (rest) parts.push(`${rest} ${rest === 1 ? 'mês' : 'meses'}`)
  return parts.join(' e ')
}
