import type { ChildStatus, DonationStatus, DonationType, HelperRole } from '@/data/mock'

/**
 * Paleta semântica de dados. O mesmo significado usa a MESMA cor em todas as telas:
 *  - verde: dinheiro recebido / situação regular (ativo, confirmado)
 *  - azul: bens e serviços (valores estimados)
 *  - âmbar: atenção (pendente, em acompanhamento)
 *  - cinza-azulado: neutro/encerrado
 */
export const CHART = {
  cash: '#116B56',
  inKind: '#3978B6',
  warning: '#D99626',
  error: '#C04D4D',
  neutral: '#94A3B8',
  purple: '#7A6A9E',
  lightBlue: '#7DA6CF',
  grid: '#E5E7EB',
  axis: '#5B6778',
} as const

export const DONATION_TYPE_COLOR: Record<DonationType, string> = {
  financeira: CHART.cash,
  alimento: CHART.inKind,
  roupa: CHART.lightBlue,
  material: CHART.purple,
  servico: CHART.neutral,
}

export const DONATION_STATUS_COLOR: Record<DonationStatus, string> = {
  confirmada: CHART.cash,
  pendente: CHART.warning,
  cancelada: CHART.neutral,
}

export const CHILD_STATUS_COLOR: Record<ChildStatus, string> = {
  ativo: CHART.cash,
  acompanhamento: CHART.warning,
  concluido: CHART.neutral,
}

export const HELPER_ROLE_COLOR: Record<HelperRole, string> = {
  voluntario: CHART.cash,
  doador: CHART.inKind,
  padrinho: CHART.purple,
  parceiro: CHART.neutral,
}

/** Cor para categorias sem significado semântico fixo (destinações, bairros): tons de uma mesma família. */
export const CATEGORY_RAMP = ['#116B56', '#3978B6', '#7A6A9E', '#7DA6CF', '#5E9C8A', '#94A3B8']
