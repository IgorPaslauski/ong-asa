import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronsUpDownIcon, ExternalLinkIcon, LogOutIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { Button } from '@/admin/components/ui/button'
import { ErrorBoundary } from '@/admin/components/feedback/error-boundary'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/admin/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/admin/components/ui/sheet'
import { Toaster } from '@/admin/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/admin/components/ui/tooltip'
import { usePersistentState, useMediaQuery } from '@/admin/lib/hooks'
import { cn } from '@/admin/lib/utils'
import { currentUserEmail, isAuthenticated, logout } from '@/lib/storage'
import { NAV } from './nav'

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/painel/visao-geral" className="flex items-center gap-2.5 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-bold tracking-wide text-primary-foreground">ASA</span>
      {collapsed ? <span className="sr-only">Instituto A.S.A. — Dashboard</span> : (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold">Instituto A.S.A.</span>
          <span className="block truncate text-xs text-muted-foreground">Sistema administrativo</span>
        </span>
      )}
    </Link>
  )
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
      {NAV.map((group) => (
        <div key={group.label}>
          {collapsed ? <div className="mx-2 mb-1.5 h-px bg-border" aria-hidden="true" /> : <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const link = (
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                                    className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-foreground/80 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                      isActive && 'bg-sidebar-accent text-primary hover:bg-sidebar-accent',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </NavLink>
              )
              return (
                <li key={item.to}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function UserMenu({ collapsed, onLogout }: { collapsed?: boolean; onLogout: () => void }) {
  const email = currentUserEmail()
  const initials = email.slice(0, 2).toUpperCase()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn('flex w-full items-center gap-2.5 rounded-md p-1.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring', collapsed && 'justify-center')}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{initials}</span>
          {collapsed ? <span className="sr-only">Menu do usuário: {email}</span> : (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium">{email}</span>
                <span className="block text-xs text-muted-foreground">Administrador</span>
              </span>
              <ChevronsUpDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/">
            <ExternalLinkIcon />
            Ver site público
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [collapsed, setCollapsed] = usePersistentState<boolean>('sidebar_collapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.setAttribute('data-admin', '')
    return () => document.body.removeAttribute('data-admin')
  }, [])
  useEffect(() => setMobileOpen(false), [location.pathname])

  if (!isAuthenticated()) return <Navigate to="/sistema" replace />

  function handleLogout() {
    logout()
    navigate('/sistema')
  }

  const isCollapsed = isDesktop && collapsed

  return (
    <TooltipProvider>
      <div data-slot="admin-shell" className="admin-root flex h-dvh min-h-0 w-full bg-background">
        <a href="#conteudo" className="sr-only z-[80] rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Ir para o conteúdo
        </a>
        {isDesktop ? (
          <aside
            aria-label="Menu lateral"
            className={cn('no-print flex shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200', isCollapsed ? 'w-[60px]' : 'w-60')}
          >
            <div className={cn('flex h-14 items-center border-b px-3', isCollapsed && 'justify-center px-0')}>
              <Brand collapsed={isCollapsed} />
            </div>
            <NavList collapsed={isCollapsed} />
            <div className="space-y-1 border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn('w-full justify-start text-muted-foreground', isCollapsed && 'justify-center px-0')}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                aria-pressed={isCollapsed}
              >
                {isCollapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
                {isCollapsed ? null : 'Recolher menu'}
              </Button>
              <UserMenu collapsed={isCollapsed} onLogout={handleLogout} />
            </div>
          </aside>
        ) : (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="gap-0 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navegação do sistema administrativo</SheetDescription>
              <div className="flex h-14 items-center border-b px-3">
                <Brand />
              </div>
              <NavList onNavigate={() => setMobileOpen(false)} />
              <div className="border-t p-2">
                <UserMenu onLogout={handleLogout} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {!isDesktop ? (
            <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3">
              <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </Button>
              <Brand />
            </header>
          ) : null}
          <main id="conteudo" tabIndex={-1} data-slot="admin-main" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 outline-none sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px]">
              <ErrorBoundary resetKey={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
