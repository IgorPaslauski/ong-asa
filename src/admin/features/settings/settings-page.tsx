import { useState } from 'react'
import { DownloadIcon, RotateCcwIcon, SlidersHorizontalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { PageHeader } from '@/admin/components/layout/page-header'
import { useActivities, useChildren, useDonations, useEvents, useHelpers } from '@/admin/data/store'
import { COLLECTIONS } from '@/admin/data/collections'
import { downloadBlob } from '@/admin/lib/export'
import { formatNumber, todayISO } from '@/admin/lib/format'
import { getActivities, getChildren, getDonations, getEvents, getHelpers, resetAllData } from '@/lib/storage'

function clearUiPreferences() {
  const clear = (store: Storage, prefix: string) => {
    const keys: string[] = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k?.startsWith(prefix)) keys.push(k)
    }
    keys.forEach((k) => store.removeItem(k))
  }
  try {
    clear(localStorage, 'asa_ui_')
    clear(sessionStorage, 'asa_ui_session_')
  } catch {
    /* noop */
  }
}

export default function SettingsPage() {
  const children = useChildren()
  const helpers = useHelpers()
  const donations = useDonations()
  const activities = useActivities()
  const events = useEvents()
  const [confirmReset, setConfirmReset] = useState(false)

  function exportBackup() {
    const payload = {
      app: 'asa-admin',
      version: 3,
      exportedAt: new Date().toISOString(),
      note: 'Backup completo dos dados locais. Contém dados pessoais de menores: guarde com segurança.',
      children: getChildren(),
      helpers: getHelpers(),
      donations: getDonations(),
      activities: getActivities(),
      events: getEvents(),
      modulos: Object.fromEntries(COLLECTIONS.map((c) => [c.key, c.read()])),
    }
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `asa-backup-${todayISO()}.json`)
    toast.success('Backup gerado.', { description: 'O arquivo contém dados pessoais. Guarde em local seguro.' })
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Dados locais, backup e preferências de exibição deste navegador." />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Dados armazenados neste navegador</CardTitle>
            <CardDescription>Este MVP não tem servidor: tudo é gravado em localStorage e some se os dados do navegador forem apagados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ['Crianças', children.length],
                ['Rede de apoio', helpers.length],
                ['Doações', donations.length],
                ['Atividades', activities.length],
                ['Eventos', events.length],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-md border px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{l}</dt>
                  <dd className="text-lg font-semibold tabular">{formatNumber(v as number)}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={exportBackup}>
                <DownloadIcon />
                Baixar backup (JSON)
              </Button>
              <p className="text-xs text-muted-foreground">Inclui dados pessoais de menores. Não envie por canais inseguros.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências de exibição</CardTitle>
            <CardDescription>Colunas visíveis, tamanho de página, período do dashboard, filtros e menu recolhido. Não altera nenhum dado cadastrado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                clearUiPreferences()
                toast.success('Preferências restauradas.', { description: 'Recarregue a página para ver o padrão.' })
              }}
            >
              <SlidersHorizontalIcon />
              Restaurar preferências de exibição
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#ecc4c4]">
          <CardHeader>
            <CardTitle>Restaurar dados de demonstração</CardTitle>
            <CardDescription>Substitui crianças, rede de apoio, doações e atividades pelos dados fictícios originais. Alterações feitas por você serão perdidas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcwIcon />
              Restaurar dados de demonstração
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Restaurar os dados de demonstração?"
        description={<p>Todos os cadastros e lançamentos atuais serão substituídos pelos dados fictícios originais. Baixe um backup antes se precisar manter o que existe hoje. Esta ação não pode ser desfeita.</p>}
        confirmLabel="Restaurar e substituir"
        onConfirm={() => {
          resetAllData()
          toast.success('Dados de demonstração restaurados.')
        }}
      />
    </div>
  )
}
