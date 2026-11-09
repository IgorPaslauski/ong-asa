import type { LucideIcon } from 'lucide-react'
import { BabyIcon, BarChart3Icon, CalendarDaysIcon, GaugeIcon, HandHeartIcon, HeartHandshakeIcon, SettingsIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}
export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  { label: 'Visão geral', items: [{ to: '/painel/visao-geral', label: 'Dashboard', icon: GaugeIcon, end: true }] },
  {
    label: 'Gestão',
    items: [
      { to: '/painel/criancas', label: 'Crianças e adolescentes', icon: BabyIcon },
      { to: '/painel/pessoas', label: 'Rede de apoio', icon: HandHeartIcon },
      { to: '/painel/doacoes', label: 'Doações', icon: HeartHandshakeIcon },
      { to: '/painel/eventos', label: 'Eventos', icon: CalendarDaysIcon },
    ],
  },
  { label: 'Análise', items: [{ to: '/painel/relatorios', label: 'Relatórios', icon: BarChart3Icon }] },
  { label: 'Administração', items: [{ to: '/painel/configuracoes', label: 'Configurações', icon: SettingsIcon }] },
]

export function findNav(pathname: string): { group: NavGroup; item: NavItem } | null {
  let best: { group: NavGroup; item: NavItem } | null = null
  for (const group of NAV)
    for (const item of group.items)
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        if (!best || item.to.length > best.item.to.length) best = { group, item }
      }
  return best
}
