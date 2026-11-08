/** Dados públicos da LP e séries para dashboard (MVP mockado). */

export const PUBLIC_IMPACT = {
  yearLabel: '2026',
  childrenAccompanied: 126,
  activeVolunteers: 48,
  godparents: 22,
  partners: 9,
  donationsYear: 86420,
  donationsMonth: 5630,
  basketsDelivered: 920,
  schoolKits: 310,
  familiesHelped: 187,
  hoursVolunteered: 2140,
  actionsCompleted: 64,
  recurringDonors: 31,
}

export const MONTHLY_DONATIONS = [
  { month: 'Mai', label: 'Mai/26', value: 5200 },
  { month: 'Jun', label: 'Jun/26', value: 6100 },
  { month: 'Jul', label: 'Jul/26', value: 7800 },
  { month: 'Ago', label: 'Ago/26', value: 6900 },
  { month: 'Set', label: 'Set/26', value: 8450 },
  { month: 'Out', label: 'Out/26', value: 9630 },
]

export const DONATIONS_BY_TYPE = [
  { key: 'financeira', label: 'Financeira', value: 48200, count: 86 },
  { key: 'alimento', label: 'Alimentos', value: 21400, count: 42 },
  { key: 'material', label: 'Material escolar', value: 8600, count: 18 },
  { key: 'roupa', label: 'Roupas', value: 5200, count: 15 },
  { key: 'servico', label: 'Serviços', value: 3020, count: 27 },
]

export const DONATIONS_BY_DESTINATION = [
  { label: 'Reforço escolar', value: 24800 },
  { label: 'Famílias acolhidas', value: 22100 },
  { label: 'Apadrinhamento', value: 15600 },
  { label: 'Eventos', value: 9800 },
  { label: 'Kit vestuário', value: 7200 },
  { label: 'Outros', value: 6920 },
]

export const ACTIONS_TIMELINE = [
  {
    title: 'Mutirão de reforço escolar',
    date: '2026-10-22',
    type: 'Educação',
    result: '28 crianças atendidas',
    detail: 'Matemática e leitura com 12 voluntários.',
  },
  {
    title: 'Entrega de cestas — Outubro',
    date: '2026-10-12',
    type: 'Assistência',
    result: '80 cestas · 45 famílias',
    detail: 'Parceria com Mercado Bom Preço.',
  },
  {
    title: 'Campanha Dia das Crianças',
    date: '2026-10-01',
    type: 'Eventos',
    result: 'R$ 12,4 mil arrecadados',
    detail: 'Brinquedos, lanches e atividade cultural.',
  },
  {
    title: 'Oficina de artes',
    date: '2026-09-30',
    type: 'Cultura',
    result: '18 participantes',
    detail: 'Voluntários e crianças da Vila Esperança.',
  },
  {
    title: 'Kit volta às aulas',
    date: '2026-08-18',
    type: 'Educação',
    result: '30 kits entregues',
    detail: 'Cadernos, mochilas e uniformes.',
  },
  {
    title: 'Mutirão de cadastro familiar',
    date: '2026-08-05',
    type: 'Gestão',
    result: '37 famílias atualizadas',
    detail: 'Revisão de endereços e necessidades.',
  },
]

export const CHILDREN_BY_NEIGHBORHOOD = [
  { label: 'Vila Esperança', value: 48 },
  { label: 'Jardim das Flores', value: 34 },
  { label: 'Parque Verde', value: 27 },
  { label: 'Outros bairros', value: 17 },
]

export const SUPPORT_NETWORK = [
  { label: 'Voluntários', value: 48 },
  { label: 'Doadores', value: 36 },
  { label: 'Padrinhos', value: 22 },
  { label: 'Parceiros', value: 9 },
]
