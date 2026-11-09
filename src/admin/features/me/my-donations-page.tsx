import { useMemo } from 'react'
import { FileTextIcon, HeartHandshakeIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Card } from '@/admin/components/ui/card'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DonationStatusBadge, DonationTypeTag } from '@/admin/components/feedback/status-badge'
import { PageHeader } from '@/admin/components/layout/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import { summarizeDonations } from '@/admin/data/domain'
import { useDonations } from '@/admin/data/store'
import { formatBRL, formatDateBR } from '@/admin/lib/format'
import { useSessionUser } from '@/lib/auth'
import { Button } from '@/admin/components/ui/button'
import { canIssueReceipt, downloadReceipt } from '@/admin/lib/receipt'

/** Área do doador: só as doações ligadas ao cadastro dele (helperId). Nenhum dado de outras pessoas. */
export default function MyDonationsPage() {
  const user = useSessionUser()
  const donations = useDonations()
  const helperId = user?.helperId ?? ''
  const mine = useMemo(
    () => (helperId ? donations.filter((d) => d.doadorId === helperId).sort((a, b) => b.data.localeCompare(a.data)) : []),
    [donations, helperId],
  )
  const t = summarizeDonations(mine)

  return (
    <div>
      <PageHeader title="Minhas doações" description="Histórico das suas contribuições ao Instituto A.S.A. Obrigado por semear o amanhã com a gente." />
      {!helperId ? (
        <Alert variant="info">
          <AlertDescription>Sua conta ainda não está vinculada a um cadastro de doador. Peça à administração para fazer o vínculo.</AlertDescription>
        </Alert>
      ) : (
        <>
          <StatStrip
            label="Resumo das minhas doações"
            items={[
              ['Doações confirmadas', t.confirmedCount],
              ['Em dinheiro', formatBRL(t.cashReceived)],
              ['Bens e serviços (estimativa)', formatBRL(t.inKindEstimate)],
              ['Aguardando confirmação', t.pendingCount],
            ]}
          />
          {mine.length === 0 ? (
            <Card className="grid place-items-center gap-2 p-8 text-center">
              <HeartHandshakeIcon className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Nenhuma doação registrada ainda</p>
              <p className="text-[13px] text-muted-foreground">Quando a equipe registrar sua contribuição, ela aparece aqui.</p>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-md border bg-card">
              <Table>
                <caption className="sr-only">Minhas doações</caption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Destinação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Recibo</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mine.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="tabular">{formatDateBR(d.data)}</TableCell>
                      <TableCell><DonationTypeTag type={d.tipo} /></TableCell>
                      <TableCell>{d.descricao || '—'}</TableCell>
                      <TableCell>{d.destinacao || '—'}</TableCell>
                      <TableCell className="text-right tabular">
                        {formatBRL(d.valor)}
                        {d.tipo !== 'financeira' ? <span className="block text-[11px] text-muted-foreground">estimado</span> : null}
                      </TableCell>
                      <TableCell><DonationStatusBadge status={d.status} /></TableCell>
                      <TableCell className="text-right">
                        {canIssueReceipt(d) ? (
                          <Button variant="ghost" size="sm" onClick={() => downloadReceipt(d)} aria-label={`Baixar recibo da doação de ${formatDateBR(d.data)}`}>
                            <FileTextIcon />
                            Recibo
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
