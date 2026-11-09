import { useState } from 'react'
import { CheckIcon, PhoneIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { PageHeader } from '@/admin/components/layout/page-header'
import { Badge, type BadgeVariant } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { helpersRepo } from '@/admin/data/store'
import { formatDateBR } from '@/admin/lib/format'
import { applicationsRepo, useApplications, type VolunteerApplication } from '@/lib/volunteers'

const STATUS_LABEL: Record<VolunteerApplication['status'], string> = {
  nova: 'Nova',
  contatada: 'Contatada',
  aprovada: 'Aprovada',
}
const STATUS_VARIANT: Record<VolunteerApplication['status'], BadgeVariant> = {
  nova: 'warning',
  contatada: 'info',
  aprovada: 'success',
}

/** Candidaturas recebidas pelo formulário público "Seja voluntário". */
export default function VolunteersPage() {
  const apps = useApplications()
  const [toDelete, setToDelete] = useState<VolunteerApplication | null>(null)

  const count = (s: VolunteerApplication['status']) => apps.filter((a) => a.status === s).length

  function approve(app: VolunteerApplication) {
    helpersRepo.save({
      nome: app.nome,
      email: '',
      telefone: app.telefone,
      papel: 'voluntario',
      cidade: 'Condor',
      desde: new Date().toISOString().slice(0, 10),
      ativo: true,
    })
    applicationsRepo.setStatus(app.id, 'aprovada')
    toast.success(`${app.nome} foi adicionado(a) à Rede de apoio como voluntário(a).`)
  }

  return (
    <div>
      <PageHeader
        title="Candidaturas de voluntários"
        description="Pessoas que se candidataram pelo formulário do site. Ao aprovar, a pessoa entra na Rede de apoio como voluntária."
      />

      <StatStrip
        label="Resumo das candidaturas"
        items={[
          ['Recebidas', apps.length],
          ['Novas', count('nova')],
          ['Contatadas', count('contatada')],
          ['Aprovadas', count('aprovada')],
        ]}
      />

      {apps.length === 0 ? (
        <Card className="items-center gap-1 px-4 py-10 text-center">
          <p className="font-medium">Nenhuma candidatura ainda</p>
          <p className="text-[13px] text-muted-foreground">
            Quando alguém preencher o formulário “Seja voluntário” no site, aparece aqui.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3" aria-label="Candidaturas">
          {apps.map((app) => (
            <li key={app.id}>
              <Card className="gap-3 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">{app.nome}</h2>
                    <p className="text-[13px] text-muted-foreground">
                      {app.profissao} · {app.telefone} · recebida em {formatDateBR(app.data)}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[app.status]}>{STATUS_LABEL[app.status]}</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {app.contribuicoes.map((c) => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>

                {app.disponibilidade.length > 0 ? (
                  <p className="text-[13px]">
                    <span className="text-muted-foreground">Disponibilidade:</span> {app.disponibilidade.join(', ')}
                  </p>
                ) : null}
                {app.mensagem ? <p className="text-[13px]">“{app.mensagem}”</p> : null}

                <div className="flex flex-wrap gap-2">
                  {app.status === 'nova' ? (
                    <Button size="sm" variant="outline" onClick={() => applicationsRepo.setStatus(app.id, 'contatada')}>
                      <PhoneIcon />
                      Marcar como contatada
                    </Button>
                  ) : null}
                  {app.status !== 'aprovada' ? (
                    <Button size="sm" onClick={() => approve(app)}>
                      <CheckIcon />
                      Aprovar e adicionar à rede
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(app)}>
                    <Trash2Icon />
                    Excluir
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir candidatura?"
        description={<>A candidatura de <strong>{toDelete?.nome}</strong> será removida. Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (toDelete) applicationsRepo.remove(toDelete.id)
          setToDelete(null)
        }}
      />
    </div>
  )
}
