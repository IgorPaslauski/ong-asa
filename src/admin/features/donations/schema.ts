import { z } from 'zod'

/**
 * Regras do cadastro original: valor ≥ 0 e doador obrigatório (o formulário
 * antigo sempre selecionava um doador). Acrescentado: data válida.
 */
export const donationSchema = z.object({
  doadorId: z.string().min(1, 'Selecione o doador.'),
  tipo: z.enum(['financeira', 'alimento', 'roupa', 'material', 'servico']),
  valor: z.number({ error: 'Informe o valor.' }).min(0, 'O valor não pode ser negativo.').max(100_000_000, 'Valor acima do limite permitido.'),
  descricao: z.string(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  status: z.enum(['confirmada', 'pendente', 'cancelada']),
  destinacao: z.string().trim().min(1, 'Informe a destinação (ex.: Geral).'),
})

export type DonationFormValues = z.infer<typeof donationSchema>

export const DESTINATION_SUGGESTIONS = [
  'Oficinas e reforço',
  'Famílias acolhidas',
  'Inclusão digital',
  'Música e cultura',
  'Jovens Empreendedores',
  'Apadrinhamento',
  'Kit vestuário',
  'Geral',
]
