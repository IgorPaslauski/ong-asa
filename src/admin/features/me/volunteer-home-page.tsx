import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, CalendarDaysIcon, PaletteIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { PageHeader } from '@/admin/components/layout/page-header'
import { useActivities, useEvents } from '@/admin/data/store'
import { formatDateBR, todayISO } from '@/admin/lib/format'
import { useSessionUser } from '@/lib/auth'

function timeRange(start: string, end: string) {
  if (!start) return ''
  return end ? `${start}–${end}` : start
}

/** Início do voluntário: próximos eventos e últimas atividades. Sem dados de crianças nem financeiros. */
export default function VolunteerHomePage() {
  const user = useSessionUser()
  const events = useEvents()
  const activities = useActivities()
  const today = todayISO()

  const upcoming = useMemo(
    () => events.filter((e) => e.publicado && e.data >= today).sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio)).slice(0, 5),
    [events, today],
  )
  const recent = useMemo(() => [...activities].filter((a) => a.data <= today).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5), [activities, today])
  const first = user?.nome.split(' ')[0] ?? ''

  return (
    <div>
      <PageHeader title={first ? `Olá, ${first}!` : 'Início'} description="Obrigado por ajudar o Instituto A.S.A. Veja o que vem por aí." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDaysIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              Próximos eventos
            </CardTitle>
            <CardDescription>Os cinco mais próximos.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nenhum evento marcado por enquanto.</p>
            ) : (
              <ul className="divide-y">
                {upcoming.map((e) => (
                  <li key={e.id} className="py-2.5">
                    <p className="text-sm font-medium">{e.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(e.data)}
                      {e.horaInicio ? ` · ${timeRange(e.horaInicio, e.horaFim)}` : ''}
                      {e.local ? ` · ${e.local}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/painel/eventos" className="mt-3 inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
              Ver todos os eventos <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PaletteIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              Últimas atividades
            </CardTitle>
            <CardDescription>Oficinas e ações já realizadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Ainda não há atividades registradas.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((a) => (
                  <li key={a.id} className="py-2.5">
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(a.data)} · {a.tipo}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/painel/atividades" className="mt-3 inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
              Ver todas as atividades <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
