import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DatabaseZapIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/admin/components/ui/breadcrumb'
import { Badge } from '@/admin/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/admin/components/ui/tooltip'
import { findNav } from './nav'

export interface Crumb {
  label: string
  to?: string
}

/** Cabeçalho padrão de página: breadcrumb, título, descrição curta e ações contextuais. */
export function PageHeader({
  title,
  description,
  actions,
  trail,
}: {
  title: string
  description?: string
  actions?: ReactNode
  /** Migalhas adicionais entre a página-mãe e o título (ex.: relatório dentro de “Relatórios”). */
  trail?: Crumb[]
}) {
  const { pathname } = useLocation()
  const nav = findNav(pathname)

  useEffect(() => {
    document.title = `${title} — Instituto A.S.A.`
  }, [title])

  const crumbs: Crumb[] = []
  if (nav) {
    crumbs.push({ label: nav.group.label })
    if (nav.item.to !== pathname || trail?.length) crumbs.push({ label: nav.item.label, to: nav.item.to })
  }
  if (trail) crumbs.push(...trail)
  const shown = crumbs.filter((c) => c.label !== title)

  return (
    <header className="no-print mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 space-y-1.5">
        <Breadcrumb>
          <BreadcrumbList>
            {shown.map((c) => (
              <BreadcrumbItem key={c.label + (c.to ?? '')}>
                {c.to ? (
                  <BreadcrumbLink asChild>
                    <Link to={c.to}>{c.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{c.label}</span>
                )}
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <DemoBadge />
        </div>
        {description ? <p className="max-w-3xl text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

/** Sinaliza que os dados vêm do armazenamento local do navegador (MVP com dados de demonstração). */
export function DemoBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="warning" className="cursor-help">
          <DatabaseZapIcon />
          Dados de demonstração
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Este MVP usa dados de demonstração gravados apenas neste navegador (localStorage). Alterações não são enviadas a nenhum servidor.
      </TooltipContent>
    </Tooltip>
  )
}
