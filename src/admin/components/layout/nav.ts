import type { LucideIcon } from 'lucide-react'
import { BabyIcon, BoxesIcon, CalendarCheckIcon, MegaphoneIcon, MessageCircleIcon, ReceiptIcon, TargetIcon, UsersRoundIcon, HouseIcon, BarChart3Icon, CalendarDaysIcon, GaugeIcon, HandHeartIcon, HeartHandshakeIcon, PaletteIcon, SettingsIcon, ShieldCheckIcon, UserPlusIcon } from 'lucide-react'
import { can, type Permission, type Role } from '@/lib/auth'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Permissão necessária para ver o item e abrir a rota. */
  perm: Permission
}
export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  { label: 'Visão geral', items: [{ to: '/painel/visao-geral', label: 'Dashboard', icon: GaugeIcon, end: true, perm: 'dashboard' }] },
  {
    label: 'Minha área',
    items: [
      { to: '/painel/inicio', label: 'Início', icon: HouseIcon, end: true, perm: 'inicio' },
      { to: '/painel/minha-escala', label: 'Minha escala', icon: CalendarCheckIcon, perm: 'minha-escala' },{ to: '/painel/minhas-doacoes', label: 'Minhas doações', icon: HeartHandshakeIcon, perm: 'minhas-doacoes' }],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/painel/criancas', label: 'Crianças e adolescentes', icon: BabyIcon, perm: 'criancas' },
      { to: '/painel/familias', label: 'Famílias', icon: UsersRoundIcon, perm: 'familias' },
      { to: '/painel/pessoas', label: 'Rede de apoio', icon: HandHeartIcon, perm: 'rede' },
      { to: '/painel/voluntarios', label: 'Candidaturas', icon: UserPlusIcon, perm: 'candidaturas' },
      { to: '/painel/doacoes', label: 'Doações', icon: HeartHandshakeIcon, perm: 'doacoes' },
      { to: '/painel/eventos', label: 'Eventos', icon: CalendarDaysIcon, perm: 'eventos.ver' },
      { to: '/painel/escala', label: 'Escala de voluntários', icon: CalendarCheckIcon, perm: 'escala' },
      { to: '/painel/estoque', label: 'Estoque', icon: BoxesIcon, perm: 'estoque' },
      { to: '/painel/atividades', label: 'Atividades', icon: PaletteIcon, perm: 'atividades' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/painel/despesas', label: 'Despesas e contas', icon: ReceiptIcon, perm: 'despesas' },
      { to: '/painel/campanhas', label: 'Campanhas', icon: MegaphoneIcon, perm: 'campanhas' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { to: '/painel/metas', label: 'Metas e indicadores', icon: TargetIcon, perm: 'metas' },
      { to: '/painel/relatorios', label: 'Relatórios', icon: BarChart3Icon, perm: 'relatorios' },
      { to: '/painel/comunicacao', label: 'Comunicação', icon: MessageCircleIcon, perm: 'comunicacao' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { to: '/painel/usuarios', label: 'Usuários e perfis', icon: ShieldCheckIcon, perm: 'usuarios' },
      { to: '/painel/configuracoes', label: 'Configurações', icon: SettingsIcon, perm: 'configuracoes' },
    ],
  },
]

/** Menu já filtrado pelo perfil (grupos sem itens somem). */
export function navFor(role: Role | null | undefined): NavGroup[] {
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(role, i.perm)) })).filter((g) => g.items.length > 0)
}

export function findNav(pathname: string): { group: NavGroup; item: NavItem } | null {
  let best: { group: NavGroup; item: NavItem } | null = null
  for (const group of NAV)
    for (const item of group.items)
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        if (!best || item.to.length > best.item.to.length) best = { group, item }
      }
  return best
}
