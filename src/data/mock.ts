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

export { ORG } from './org'

export const INITIAL_CHILDREN: Child[] = [
  {
    id: 'c1',
    nome: 'Ana Beatriz Souza',
    idade: 8,
    responsavel: 'Mariana Souza',
    telefone: '(55) 99911-2200',
    bairro: 'Olaria',
    escola: 'Escola Municipal de Condor',
    status: 'ativo',
    dataEntrada: '2025-03-12',
    observacoes: 'Reforço escolar e oficina de informática.',
  },
  {
    id: 'c2',
    nome: 'João Pedro Lima',
    idade: 11,
    responsavel: 'Carlos Lima',
    telefone: '(55) 99922-1103',
    bairro: 'Centro',
    escola: 'Escola Estadual de Condor',
    status: 'ativo',
    dataEntrada: '2024-08-01',
    observacoes: 'Violão e reforço de matemática.',
  },
  {
    id: 'c3',
    nome: 'Larissa Mendes',
    idade: 6,
    responsavel: 'Patrícia Mendes',
    telefone: '(55) 99955-4432',
    bairro: 'Olaria',
    escola: 'Escola Municipal de Condor',
    status: 'acompanhamento',
    dataEntrada: '2026-01-20',
    observacoes: 'Aguardando vaga na turma de alfabetização digital.',
  },
  {
    id: 'c4',
    nome: 'Miguel Santos',
    idade: 14,
    responsavel: 'Helena Santos',
    telefone: '(55) 99944-7788',
    bairro: 'Interior',
    escola: 'Escola Estadual de Condor',
    status: 'ativo',
    dataEntrada: '2023-11-05',
    observacoes: 'Projeto Jovens Empreendedores e inclusão digital.',
  },
  {
    id: 'c5',
    nome: 'Sofia Oliveira',
    idade: 9,
    responsavel: 'Renata Oliveira',
    telefone: '(55) 99933-2211',
    bairro: 'Centro',
    escola: 'Escola Municipal de Condor',
    status: 'concluido',
    dataEntrada: '2022-04-18',
    observacoes: 'Concluiu ciclo de reforço e dança em 2026.',
  },
  {
    id: 'c6',
    nome: 'Gabriel Costa',
    idade: 7,
    responsavel: 'André Costa',
    telefone: '(55) 99922-1100',
    bairro: 'Olaria',
    escola: 'Escola Municipal de Condor',
    status: 'ativo',
    dataEntrada: '2025-09-10',
    observacoes: 'Cesta básica familiar e oficina de artesanato.',
  },
]

export const INITIAL_HELPERS: Helper[] = [
  {
    id: 'h1',
    nome: 'Camila Ferreira',
    email: 'camila.ferreira@email.com',
    telefone: '(55) 99123-4567',
    papel: 'voluntario',
    cidade: 'Condor',
    desde: '2024-02-14',
    ativo: true,
  },
  {
    id: 'h2',
    nome: 'Ricardo Almeida',
    email: 'ricardo.a@email.com',
    telefone: '(55) 99876-5432',
    papel: 'doador',
    cidade: 'Condor',
    desde: '2023-06-01',
    ativo: true,
  },
  {
    id: 'h3',
    nome: 'Juliana Prado',
    email: 'juliana.prado@email.com',
    telefone: '(55) 98765-4321',
    papel: 'padrinho',
    cidade: 'Panambi',
    desde: '2025-01-08',
    ativo: true,
  },
  {
    id: 'h4',
    nome: 'Parceiro local Condor',
    email: 'parceria@exemplo.com.br',
    telefone: '(55) 3379-1000',
    papel: 'parceiro',
    cidade: 'Condor',
    desde: '2022-09-20',
    ativo: true,
  },
  {
    id: 'h5',
    nome: 'Pedro Nogueira',
    email: 'pedro.n@email.com',
    telefone: '(55) 97654-3210',
    papel: 'voluntario',
    cidade: 'Condor',
    desde: '2026-03-03',
    ativo: false,
  },
  {
    id: 'h6',
    nome: 'Fernanda Ruiz',
    email: 'fernanda.ruiz@email.com',
    telefone: '(55) 96543-2109',
    papel: 'doador',
    cidade: 'Ijuí',
    desde: '2024-11-19',
    ativo: true,
  },
]

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'y21a',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 2200,
    descricao: 'Apoio às primeiras oficinas',
    data: '2021-06-10',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'y21b',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 3100,
    descricao: 'Cestas — segundo semestre',
    data: '2021-11-18',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'y22a',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 4800,
    descricao: 'Manutenção das oficinas',
    data: '2022-04-12',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'y22b',
    doadorId: 'h6',
    doadorNome: 'Fernanda Ruiz',
    tipo: 'material',
    valor: 2600,
    descricao: 'Violões e material cultural',
    data: '2022-09-08',
    status: 'confirmada',
    destinacao: 'Música e cultura',
  },
  {
    id: 'y23a',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 5400,
    descricao: 'Cestas do ano',
    data: '2023-03-22',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'y23b',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 7200,
    descricao: 'Laboratório de informática',
    data: '2023-08-16',
    status: 'confirmada',
    destinacao: 'Inclusão digital',
  },
  {
    id: 'y23c',
    doadorId: 'h3',
    doadorNome: 'Juliana Prado',
    tipo: 'financeira',
    valor: 1800,
    descricao: 'Apadrinhamentos',
    data: '2023-12-04',
    status: 'confirmada',
    destinacao: 'Apadrinhamento',
  },
  {
    id: 'y24a',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 8600,
    descricao: 'Oficinas e reforço',
    data: '2024-02-19',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'y24b',
    doadorId: 'h6',
    doadorNome: 'Fernanda Ruiz',
    tipo: 'material',
    valor: 6400,
    descricao: 'Equipamentos de inclusão digital',
    data: '2024-07-11',
    status: 'confirmada',
    destinacao: 'Inclusão digital',
  },
  {
    id: 'y24c',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 5100,
    descricao: 'Cestas — 2024',
    data: '2024-11-06',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'y25a',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 9800,
    descricao: 'Apoio anual',
    data: '2025-03-18',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'y25b',
    doadorId: 'h3',
    doadorNome: 'Juliana Prado',
    tipo: 'financeira',
    valor: 4200,
    descricao: 'Jovens Empreendedores',
    data: '2025-08-21',
    status: 'confirmada',
    destinacao: 'Jovens Empreendedores',
  },
  {
    id: 'y25c',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 7300,
    descricao: 'Cestas e lanches',
    data: '2025-12-03',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'd11',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 450,
    descricao: 'Doação mensal recorrente',
    data: '2026-05-05',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'd12',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 800,
    descricao: 'Cestas — maio',
    data: '2026-05-18',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'd13',
    doadorId: 'h6',
    doadorNome: 'Fernanda Ruiz',
    tipo: 'material',
    valor: 520,
    descricao: 'Material para oficinas',
    data: '2026-06-08',
    status: 'confirmada',
    destinacao: 'Inclusão digital',
  },
  {
    id: 'd14',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 500,
    descricao: 'Doação mensal recorrente',
    data: '2026-06-05',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'd15',
    doadorId: 'h3',
    doadorNome: 'Juliana Prado',
    tipo: 'financeira',
    valor: 250,
    descricao: 'Apadrinhamento',
    data: '2026-07-15',
    status: 'confirmada',
    destinacao: 'Apadrinhamento',
  },
  {
    id: 'd16',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 1100,
    descricao: 'Cestas — julho',
    data: '2026-07-20',
    status: 'confirmada',
    destinacao: 'Famílias acolhidas',
  },
  {
    id: 'd17',
    doadorId: 'h1',
    doadorNome: 'Camila Ferreira',
    tipo: 'servico',
    valor: 0,
    descricao: 'Oficina de reforço — julho',
    data: '2026-07-28',
    status: 'confirmada',
    destinacao: 'Educação',
  },
  {
    id: 'd1',
    doadorId: 'h2',
    doadorNome: 'Ricardo Almeida',
    tipo: 'financeira',
    valor: 500,
    descricao: 'Doação mensal recorrente',
    data: '2026-10-05',
    status: 'confirmada',
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'd2',
    doadorId: 'h4',
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 1200,
    descricao: 'Cestas básicas para famílias atendidas',
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
    destinacao: 'Oficinas e reforço',
  },
  {
    id: 'd7',
    doadorId: 'h6',
    doadorNome: 'Fernanda Ruiz',
    tipo: 'material',
    valor: 650,
    descricao: 'SSDs e material para lab. de informática',
    data: '2026-08-18',
    status: 'confirmada',
    destinacao: 'Inclusão digital',
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
    doadorNome: 'Parceiro local Condor',
    tipo: 'alimento',
    valor: 900,
    descricao: 'Cestas e lanches para oficinas',
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
    descricao: 'Apoio ao Projeto Jovens Empreendedores',
    data: '2026-10-01',
    status: 'confirmada',
    destinacao: 'Jovens Empreendedores',
  },
]

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'a21',
    titulo: 'Primeiras cestas e reforço escolar',
    data: '2021-08-12',
    tipo: 'Assistência',
    participantes: 18,
  },
  {
    id: 'a22',
    titulo: 'Início das aulas de violão',
    data: '2022-05-20',
    tipo: 'Cultura',
    participantes: 12,
  },
  {
    id: 'a23',
    titulo: 'Laboratório de inclusão digital',
    data: '2023-09-14',
    tipo: 'Inclusão digital',
    participantes: 20,
  },
  {
    id: 'a24',
    titulo: 'Jovens Empreendedores — turma piloto',
    data: '2024-06-18',
    tipo: 'Empreendedorismo',
    participantes: 11,
  },
  {
    id: 'a25',
    titulo: 'Ampliação do reforço escolar',
    data: '2025-04-09',
    tipo: 'Educação',
    participantes: 26,
  },
  {
    id: 'a1',
    titulo: 'Oficina de alfabetização digital',
    data: '2026-10-22',
    tipo: 'Inclusão digital',
    participantes: 24,
  },
  {
    id: 'a2',
    titulo: 'Entrega de cestas — Outubro',
    data: '2026-10-12',
    tipo: 'Assistência',
    participantes: 32,
  },
  {
    id: 'a3',
    titulo: 'Aulas de violão',
    data: '2026-10-01',
    tipo: 'Cultura',
    participantes: 18,
  },
  {
    id: 'a4',
    titulo: 'Projeto Jovens Empreendedores',
    data: '2026-09-26',
    tipo: 'Empreendedorismo',
    participantes: 14,
  },
  {
    id: 'a5',
    titulo: 'Reforço escolar e dança',
    data: '2026-08-15',
    tipo: 'Educação',
    participantes: 30,
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
