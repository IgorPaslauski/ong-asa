import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, EyeOffIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { ProgressBar } from '@/admin/components/ui/progress-bar'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { NumberField, SwitchField, TextareaField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { campaignRaised, campaigns, type Campaign } from '@/admin/data/modules'
import { useDonations } from '@/admin/data/store'
import { formatBRL, formatDateBR, todayISO } from '@/admin/lib/format'

const schema = z
  .object({
    titulo: z.string().trim().min(1, 'Dê um nome à campanha.'),
    descricao: z.string().trim().max(300, 'Use até 300 caracteres.'),
    meta: z.number({ error: 'Informe a meta.' }).positive('A meta precisa ser maior que zero.'),
    destinacao: z.string().trim().min(1, 'Informe a destinação que identifica as doações.'),
    inicio: z.string(),
    fim: z.string(),
    publicada: z.boolean(),
  })
  .refine((v) => !v.inicio || !v.fim || v.fim >= v.inicio, { path: ['fim'], message: 'O fim deve ser depois do início.' })
type Form = z.infer<typeof schema>
const emptyValues = (): Form => ({ titulo: '', descricao: '', meta: '' as unknown as number, destinacao: '', inicio: todayISO(), fim: '', publicada: false })

export default function CampaignsPage() {
  const list = campaigns.useAll()
  const donations = useDonations()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [toDelete, setToDelete] = useState<Campaign | null>(null)
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: emptyValues(), mode: 'onTouched' })
  const today = todayISO()

  const destinations = useMemo(() => [...new Set(donations.map((d) => d.destinacao).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [donations])

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(c: Campaign) {
    setEditing(c)
    form.reset({ ...c })
    setFormOpen(true)
  }
  function save(v: Form) {
    const saved = campaigns.save(v, editing?.id)
    toast.success(editing ? 'Campanha atualizada.' : v.publicada ? 'Campanha criada e publicada no site.' : 'Campanha salva como rascunho.', { description: saved.titulo })
    setFormOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Campanhas de arrecadação"
        description="Defina uma meta em dinheiro. As doações financeiras confirmadas com a mesma destinação contam automaticamente."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nova campanha
          </Button>
        }
      />
      {list.length === 0 ? (
        <Card className="grid place-items-center gap-2 p-8 text-center">
          <p className="text-sm font-medium">Nenhuma campanha criada</p>
          <p className="max-w-md text-[13px] text-muted-foreground">Ex.: “Material escolar 2027” com meta de R$ 5.000. Publicada, ela aparece no site com a barra de progresso.</p>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon />
            Nova campanha
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const raised = campaignRaised(c, donations)
            const pct = c.meta > 0 ? Math.min(100, Math.round((raised / c.meta) * 100)) : 0
            const ended = Boolean(c.fim) && c.fim < today
            return (
              <li key={c.id}>
                <Card className="h-full gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[15px] font-semibold">{c.titulo}</h2>
                    <Badge variant={ended ? 'muted' : c.publicada ? 'success' : 'warning'}>{ended ? 'Encerrada' : c.publicada ? 'No site' : 'Rascunho'}</Badge>
                  </div>
                  {c.descricao ? <p className="text-[13px] text-muted-foreground">{c.descricao}</p> : null}
                  <div>
                    <p className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="tabular font-medium">{formatBRL(raised)}</span>
                      <span className="text-muted-foreground tabular">meta {formatBRL(c.meta)} · {pct}%</span>
                    </p>
                    <ProgressBar value={pct} label={`Arrecadado na campanha ${c.titulo}`} tone={pct >= 100 ? 'success' : 'default'} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Destinação: {c.destinacao} · {c.inicio ? formatDateBR(c.inicio) : 'sem início'} a {c.fim ? formatDateBR(c.fim) : 'sem prazo'}
                  </p>
                  <div className="mt-auto flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => campaigns.save({ ...c, publicada: !c.publicada }, c.id)}>
                      {c.publicada ? <EyeOffIcon /> : <EyeIcon />}
                      {c.publicada ? 'Tirar do site' : 'Publicar'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <PencilIcon />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(c)} aria-label={`Remover campanha ${c.titulo}`}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <FormSheet open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Editar campanha' : 'Nova campanha'} description={editing ? editing.titulo : 'Meta de arrecadação em dinheiro.'} form={form} onSubmit={save} submitLabel={editing ? 'Salvar alterações' : 'Criar campanha'}>
        <FormSection title="A campanha">
          <TextField control={form.control} name="titulo" label="Nome" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <TextareaField control={form.control} name="descricao" label="Descrição" rows={3} className="sm:col-span-2" description="Aparece no site. Até 300 caracteres. Não inclua dados pessoais de crianças ou famílias." />
          <NumberField control={form.control} name="meta" label="Meta (R$)" required min={0} step="0.01" className="sm:col-span-2" />
        </FormSection>
        <FormSection title="Como contar as doações">
          <TextField
            control={form.control}
            name="destinacao"
            label="Destinação"
            required
            className="sm:col-span-2"
            autoComplete="off"
            list="campaign-destinations"
            description="Use o mesmo texto da destinação das doações (ex.: “Material escolar”). Só contam doações financeiras confirmadas."
          />
          <datalist id="campaign-destinations">
            {destinations.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <TextField control={form.control} name="inicio" label="Início" type="date" />
          <TextField control={form.control} name="fim" label="Fim (opcional)" type="date" />
        </FormSection>
        <FormSection title="Publicação">
          <SwitchField control={form.control} name="publicada" label="Mostrar no site" description="Publicada, a campanha aparece na página inicial com a meta e o quanto já foi arrecadado." className="sm:col-span-2" />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover esta campanha?"
        description={
          <p>
            <strong>{toDelete?.titulo}</strong> será removida do painel e do site. As doações não são alteradas. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover campanha"
        onConfirm={() => {
          if (!toDelete) return
          campaigns.remove(toDelete.id)
          toast.success('Campanha removida.', { description: toDelete.titulo })
          setToDelete(null)
        }}
      />
    </div>
  )
}
