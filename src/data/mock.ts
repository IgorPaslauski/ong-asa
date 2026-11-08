export type ChildStatus = 'ativo' | 'acompanhamento' | 'concluido'
export type HelperRole = 'voluntario' | 'doador' | 'padrinho' | 'parceiro'
export type DonationType = 'financeira' | 'alimento' | 'roupa' | 'material' | 'servico'
export type DonationStatus = 'confirmada' | 'pendente' | 'cancelada'

export interface Child {
  id: string
  nome: string
  idade: number
  responsavel: string
  telefone: string
  bairro: string
  escola: string
  status: ChildStatus
  dataEntrada: string
  observacoes: string
}

export interface Helper {
  id: string
  nome: string
  email: string
  telefone: string
  papel: HelperRole
  cidade: string
  desde: string
  ativo: boolean
}

export interface Donation {
  id: string
  doadorId: string
  doadorNome: string
  tipo: DonationType
  valor: number
  descricao: string
  data: string
  status: DonationStatus
  destinacao: string
}

export interface Activity {
  id: string
  titulo: string
  data: string
  tipo: string
  participantes: number
}

export const ORG = {
  name: 'ASA',
  fullName: 'Ação Social e Acolhimento',
  tagline: 'Cada criança merece um lugar para crescer com dignidade.',
  email: 'contato@ongasa.org.br',
  phone: '(11) 3456-7890',
  address: 'Rua das Acácias, 120 — Vila Esperança, São Paulo',
  founded: 2014,
}

export const INITIAL_CHILDREN: Child[] = [
  {
    id: 'c1',
    nome: 'Ana Beatriz Souza',
    idade: 8,
    responsavel: 'Mariana Souza',
    telefone: '(11) 98811-2200',
    bairro: 'Vila Esperança',
    escola: 'EMEF Paulo Freire',
    status: 'ativo',
    dataEntrada: '2025-03-12',
    observacoes: 'Reforço escolar e kit merenda.',
  },
  {
    id: 'c2',
    nome: 'João Pedro Lima',
    idade: 11,
    responsavel: 'Carlos Lima',
    telefone: '(11) 97722-1103',
    bairro: 'Jardim das Flores',
    escola: 'EMEF Clarice Lispector',
    status: 'ativo',
    dataEntrada: '2024-08-01',
    observacoes: 'Esporte e acompanhamento psicológico.',
  },
  {
    id: 'c3',
    nome: 'Larissa Mendes',
    idade: 6,
    responsavel: 'Patrícia Mendes',
    telefone: '(11) 96655-4432',
    bairro: 'Vila Esperança',
    escola: 'CEI Sol Nascente',
    status: 'acompanhamento',
    dataEntrada: '2026-01-20',
    observacoes: 'Aguardando vaga no reforço de leitura.',
  },
  {
    id: 'c4',
    nome: 'Miguel Santos',
    idade: 13,
    responsavel: 'Helena Santos',
    telefone: '(11) 95544-7788',
    bairro: 'Parque Verde',
    escola: 'EE Professor José de Alencar',
    status: 'ativo',
    dataEntrada: '2023-11-05',
    observacoes: 'Oficina de informática e mentoria.',
  },
  {
    id: 'c5',
    nome: 'Sofia Oliveira',
    idade: 9,
    responsavel: 'Renata Oliveira',
    telefone: '(11) 94433-2211',
    bairro: 'Jardim das Flores',
    escola: 'EMEF Paulo Freire',
    status: 'concluido',
    dataEntrada: '2022-04-18',
    observacoes: 'Concluiu ciclo de reforço em 2026.',
  },
  {
    id: 'c6',
    nome: 'Gabriel Costa',
    idade: 7,
    responsavel: 'André Costa',
    telefone: '(11) 93322-1100',
    bairro: 'Vila Esperança',
    escola: 'CEI Sol Nascente',
    status: 'ativo',
    dataEntrada: '2025-09-10',
    observacoes: 'Cesta básica mensal e fardamento.',
  },
]

export const INITIAL_HELPERS: Helper[] = [
  {
    id: 'h1',
    nome: 'Camila Ferreira',
    email: 'camila.ferreira@email.com',
    telefone: '(11) 91234-5678',
    papel: 'voluntario',
    cidade: 'São Paulo',
    desde: '2024-02-14',
    ativo: true,
  },
  {
    id: 'h2',
    nome: 'Ricardo Almeida',
    email: 'ricardo.a@email.com',
    telefone: '(11) 99876-5432',
    papel: 'doador',
    cidade: 'São Paulo',
    desde: '2023-06-01',
    ativo: true,
  },
  {
    id: 'h3',
    nome: 'Juliana Prado',
    email: 'juliana.prado@email.com',
    telefone: '(11) 98765-4321',
    papel: 'padrinho',
    cidade: 'Guarulhos',
    desde: '2025-01-08',
    ativo: true,
  },
  {
    id: 'h4',
    nome: 'Mercado Bom Preço',
    email: 'contato@bompreco.com.br',
    telefone: '(11) 3456-1000',
    papel: 'parceiro',
    cidade: 'São Paulo',
    desde: '2022-09-20',
    ativo: true,
  },
  {
    id: 'h5',
    nome: 'Pedro Nogueira',
    email: 'pedro.n@email.com',
    telefone: '(11) 97654-3210',
    papel: 'voluntario',
    cidade: 'Osasco',
    desde: '2026-03-03',
    ativo: false,
  },
  {
    id: 'h6',
    nome: 'Fernanda Ruiz',
    email: 'fernanda.ruiz@email.com',
    telefone: '(11) 96543-2109',
    papel: 'doador',
    cidade: 'São Paulo',
    desde: '2024-11-19',
    ativo: true,
  },
]

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'd1',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 500,
    descricao: 'Doação mensal recorrente',
    data: '2026-10-05',
    status: 'confirmada',
    destinacao: 'Reforço escolar',
  },
  {
    id: 'd2',
    doadorId: 'h4',
    doadorNome: 'Mercado Bom Preço',
    tipo: 'alimento',
    valor: 1200,
    descricao: '80 cestas básicas',
    data: '2026-10-12',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'd3',
    doadorId: 'h3',
    doadorNome: 'Juliana Prado',
    tipo: 'financeira',
    valor: 250,
    descricao: 'Apadrinhamento — João Pedro',
    data: '2026-10-15',
    status: 'confirmada',
    destinacao: 'Apadrinhamento',
  },
  {
    id: 'd4',
    doadorId: 'h6',
    doadorNome: 'Fernanda Ruiz',
    tipo: 'roupa',
    valor: 380,
    descricao: 'Roupas de inverno (infantil)',
    data: '2026-09-28',
    status: 'confirmada',
    destinacao: 'Kit vestuário',
  },
  {
    id: 'd5',
    doadorId: 'h1',
    doadorNome: 'Camila Ferreira',
    tipo: 'servico',
    valor: 0,
    descricao: '16h de reforço de matemática',
    data: '2026-10-20',
    status: 'confirmada',
    destinacao: 'Educação',
  },
  {
    id: 'd6',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 500,
    descricao: 'Doação mensal recorrente',
    data: '2026-09-05',
    status: 'confirmada',
    destinacao: 'Reforço escolar',
  },
  {
    id: 'd7',
    doadorId: 'h6',
    doadorNome: 'Fernanda Ruiz',
    tipo: 'material',
    valor: 650,
    descricao: 'Material escolar para 30 crianças',
    data: '2026-08-18',
    status: 'confirmada',
    destinacao: 'Volta às aulas',
  },
  {
    id: 'd8',
    doadorId: 'h3',
    doadorNome: 'Juliana Prado',
    tipo: 'financeira',
    valor: 250,
    descricao: 'Apadrinhamento — João Pedro',
    data: '2026-09-15',
    status: 'pendente',
    destinacao: 'Apadrinhamento',
  },
  {
    id: 'd9',
    doadorId: 'h4',
    doadorNome: 'Mercado Bom Preço',
    tipo: 'alimento',
    valor: 900,
    descricao: '60 cestas básicas',
    data: '2026-08-10',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'd10',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 1000,
    descricao: 'Campanha Dia das Crianças',
    data: '2026-10-01',
    status: 'confirmada',
    destinacao: 'Eventos',
  },
]

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    titulo: 'Mutirão de reforço escolar',
    data: '2026-10-22',
    tipo: 'Educação',
    participantes: 28,
  },
  {
    id: 'a2',
    titulo: 'Entrega de cestas — Outubro',
    data: '2026-10-12',
    tipo: 'Assistência',
    participantes: 45,
  },
  {
    id: 'a3',
    titulo: 'Oficina de artes com voluntários',
    data: '2026-09-30',
    tipo: 'Cultura',
    participantes: 18,
  },
]

export const STATUS_LABEL: Record<ChildStatus, string> = {
  ativo: 'Ativo',
  acompanhamento: 'Em acompanhamento',
  concluido: 'Concluído',
}

export const ROLE_LABEL: Record<HelperRole, string> = {
  voluntario: 'Voluntário',
  doador: 'Doador',
  padrinho: 'Padrinho/Madrinha',
  parceiro: 'Parceiro',
}

export const DONATION_TYPE_LABEL: Record<DonationType, string> = {
  financeira: 'Financeira',
  alimento: 'Alimento',
  roupa: 'Roupa',
  material: 'Material',
  servico: 'Serviço',
}

export const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  confirmada: 'Confirmada',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
