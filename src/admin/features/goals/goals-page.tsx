import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { ProgressBar } from '@/admin/components/ui/progress-bar'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { NumberField, SelectField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { GOAL_METRICS, GOAL_METRIC_KEYS, goalPercent, goalProgress, goals, type Goal, type GoalMetric } from '@/admin/data/modules'
import { useActivities, useChildren, useDonations, useHelpers } from '@/admin/data/store'
import { formatBRL, formatDateBR, formatNumber } from '@/admin/lib/format'

const schema = z
  .object({
    titulo: z.string().trim().min(1, 'Dê um nome à meta.'),
    origem: z.string().trim(),
    metrica: z.enum(['criancas_ativas', 'atividades', 'participacoes', 'dinheiro', 'voluntarios', 'manual']),
    alvo: z.number({ error: 'Informe o alvo.' }).positive('O alvo precisa ser maior que zero.'),
    valorManual: z.union([z.number().min(0, 'Não pode ser negativo.'), z.literal('')]),
    inicio: z.string(),
    fim: z.string(),
  })
  .refine((v) => !v.inicio || !v.fim || v.fim >= v.inicio, { path: ['fim'], message: 'O fim deve ser depois do início.' })
type Form = z.infer<typeof schema>
const emptyValues = (): Form => ({ titulo: '', origem: '', metrica: 'criancas_ativas', alvo: '' as unknown as number, valorManual: '', inicio: '', fim: '' })
const METRIC_OPTIONS = GOAL_METRIC_KEYS.map((k) => ({ value: k, label: GOAL_METRICS[k] }))
const fmt = (m: GoalMetric, v: number) => (m === 'dinheiro' ? formatBRL(v) : formatNumber(v))
/** Métricas que dependem do período informado. */
const USES_PERIOD: GoalMetric[] = ['atividades', 'participacoes', 'dinheiro']

export default function GoalsPage() {
  const list = goals.useAll()
  const children = useChildren()
  const activities = useActivities()
  const donations = useDonations()
  const helpers = useHelpers()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [toDelete, setToDelete] = useState<Goal | null>(null)
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: emptyValues(), mode: 'onTouched' })
  const metrica = form.watch('metrica')

  const data = useMemo(() => ({ children, activities, donations, helpers }), [children, activities, donations, helpers])

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(g: Goal) {
    setEditing(g)
    form.reset({ ...g, valorManual: g.valorManual || '' })
    setFormOpen(true)
  }
  function save(v: Form) {
    const saved = goals.save({ ...v, valorManual: v.valorManual === '' ? 0 : v.valorManual }, editing?.id)
    toast.success(editing ? 'Meta atualizada.' : 'Meta criada.', { description: saved.titulo })
    setFormOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Metas e indicadores"
        description="Acompanhe o que foi combinado em editais e projetos. O progresso é calculado com os dados do sistema."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nova meta
          </Button>
        }
      />

      {list.length === 0 ? (
        <Card className="grid place-items-center gap-2 p-8 text-center">
          <p className="text-sm font-medium">Nenhuma meta cadastrada</p>
          <p className="max-w-md text-[13px] text-muted-foreground">Ex.: “Atender 80 crianças” ou “Realizar 40 oficinas em 2026”. Escolha o indicador e o alvo, e o sistema acompanha sozinho.</p>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon />
            Nova meta
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((g) => {
            const value = goalProgress(g, data)
            const pct = goalPercent(value, g.alvo)
            const done = value >= g.alvo
            return (
              <li key={g.id}>
                <Card className="h-full gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold">{g.titulo}</h2>
                      <p className="text-xs text-muted-foreground">{g.origem || 'Sem edital informado'}</p>
                    </div>
                    <Badge variant={done ? 'success' : 'muted'}>{done ? 'Atingida' : `${pct}%`}</Badge>
                  </div>
                  <div>
                    <p className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="text-muted-foreground">{GOAL_METRICS[g.metrica]}</span>
                      <span className="tabular font-medium">
                        {fmt(g.metrica, value)} de {fmt(g.metrica, g.alvo)}
                      </span>
                    </p>
                    <ProgressBar value={pct} label={`Progresso da meta ${g.titulo}`} tone={done ? 'success' : 'default'} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {USES_PERIOD.includes(g.metrica) ? (g.inicio || g.fim ? `Período: ${g.inicio ? formatDateBR(g.inicio) : 'início'} a ${g.fim ? formatDateBR(g.fim) : 'hoje'}` : 'Todo o histórico') : g.metrica === 'manual' ? 'Atualizado manualmente' : 'Situação atual do cadastro'}
                  </p>
                  <div className="mt-auto flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>
                      <PencilIcon />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(g)} aria-label={`Remover meta ${g.titulo}`}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <FormSheet open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Editar meta' : 'Nova meta'} description={editing ? editing.titulo : 'O que o Instituto quer alcançar.'} form={form} onSubmit={save} submitLabel={editing ? 'Salvar alterações' : 'Criar meta'}>
        <FormSection title="A meta">
          <TextField control={form.control} name="titulo" label="Nome da meta" required autoFocus className="sm:col-span-2" autoComplete="off" placeholder="Ex.: Atender 80 crianças" />
          <TextField control={form.control} name="origem" label="Edital ou projeto" className="sm:col-span-2" autoComplete="off" placeholder="Ex.: Edital 003/2026 — Prefeitura de Condor" />
          <SelectField control={form.control} name="metrica" label="Indicador" required options={METRIC_OPTIONS} className="sm:col-span-2" />
          <NumberField control={form.control} name="alvo" label={metrica === 'dinheiro' ? 'Alvo (R$)' : 'Alvo'} required min={0} step="any" />
          {metrica === 'manual' ? <NumberField control={form.control} name="valorManual" label="Valor atual" min={0} step="any" /> : null}
        </FormSection>
        {USES_PERIOD.includes(metrica) ? (
          <FormSection title="Período" description="Conta só o que aconteceu dentro das datas. Deixe em branco para todo o histórico.">
            <TextField control={form.control} name="inicio" label="Início" type="date" />
            <TextField control={form.control} name="fim" label="Fim" type="date" />
          </FormSection>
        ) : null}
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover esta meta?"
        description={
          <p>
            A meta <strong>{toDelete?.titulo}</strong> será removida. Os dados que ela acompanha não são alterados.
          </p>
        }
        confirmLabel="Remover meta"
        onConfirm={() => {
          if (!toDelete) return
          goals.remove(toDelete.id)
          toast.success('Meta removida.', { description: toDelete.titulo })
          setToDelete(null)
        }}
      />
    </div>
  )
}
