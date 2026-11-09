import { useMemo, useState } from 'react'
import { CopyIcon, MessageCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Button } from '@/admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { Textarea } from '@/admin/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import { PageHeader } from '@/admin/components/layout/page-header'
import { useHelpers } from '@/admin/data/store'
import { usePersistentState } from '@/admin/lib/hooks'
import { ROLE_LABEL } from '@/data/mock'
import { ORG } from '@/data/org'
import { useApplications } from '@/lib/volunteers'

export interface Contact {
  key: string
  nome: string
  telefone: string
  email: string
  grupo: string
}

/** Link do WhatsApp para um telefone brasileiro (DDD + número). Vazio se o número for inválido. */
export function whatsappLink(phone: string, message: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('55') && d.length > 11) d = d.slice(2)
  if (d.length !== 10 && d.length !== 11) return ''
  return `https://wa.me/55${d}?text=${encodeURIComponent(message)}`
}

/** Troca {nome} pelo primeiro nome do contato. */
export function personalize(template: string, nome: string): string {
  return template.replaceAll('{nome}', nome.trim().split(/\s+/)[0] ?? '')
}

const DEFAULT_MESSAGE = `Olá, {nome}! Aqui é do ${ORG.name}. `

export default function CommunicationPage() {
  const helpers = useHelpers()
  const apps = useApplications()
  const [group, setGroup] = useState<string>('todos')
  const [message, setMessage] = usePersistentState<string>('comm_message', DEFAULT_MESSAGE)

  const contacts = useMemo<Contact[]>(
    () => [
      ...helpers.filter((h) => h.ativo).map((h) => ({ key: h.id, nome: h.nome, telefone: h.telefone, email: h.email, grupo: ROLE_LABEL[h.papel] })),
      ...apps.filter((a) => a.status !== 'aprovada').map((a) => ({ key: `app-${a.id}`, nome: a.nome, telefone: a.telefone, email: '', grupo: 'Candidato a voluntário' })),
    ],
    [helpers, apps],
  )
  const groups = useMemo(() => [...new Set(contacts.map((c) => c.grupo))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [contacts])
  const shown = contacts.filter((c) => group === 'todos' || c.grupo === group).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const emails = [...new Set(shown.map((c) => c.email).filter(Boolean))]

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(emails.join(', '))
      toast.success('E-mails copiados.', { description: `${emails.length} endereço(s). Cole no campo “Cco” do seu e-mail.` })
    } catch {
      toast.error('Não foi possível copiar.', { description: 'Selecione e copie manualmente.' })
    }
  }

  return (
    <div>
      <PageHeader title="Comunicação" description="Contatos por grupo, com link de WhatsApp pronto e cópia de e-mails para envio em lote." />
      <Alert variant="info" className="mb-4">
        <AlertDescription>O sistema não envia mensagens: cada botão abre o WhatsApp com o texto pronto para você conferir e enviar. Use os e-mails em cópia oculta (Cco).</AlertDescription>
      </Alert>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Mensagem</CardTitle>
          <CardDescription>
            Use <code className="rounded bg-muted px-1">{'{nome}'}</code> para inserir o primeiro nome de cada pessoa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea aria-label="Texto da mensagem" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger aria-label="Grupo de contatos" className="h-9 w-auto min-w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os grupos</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={copyEmails} disabled={emails.length === 0}>
              <CopyIcon />
              Copiar e-mails ({emails.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-[13px] text-muted-foreground">Nenhum contato neste grupo.</p>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          <Table>
            <caption className="sr-only">Contatos</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">WhatsApp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((c) => {
                const link = whatsappLink(c.telefone, personalize(message, c.nome))
                return (
                  <TableRow key={c.key}>
                    <TableCell>
                      <span className="block font-medium">{c.nome}</span>
                      {c.email ? <span className="block text-xs text-muted-foreground">{c.email}</span> : null}
                    </TableCell>
                    <TableCell>{c.grupo}</TableCell>
                    <TableCell className="tabular">{c.telefone || '—'}</TableCell>
                    <TableCell className="text-right">
                      {link ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir WhatsApp com ${c.nome}`}>
                            <MessageCircleIcon />
                            Abrir
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem telefone válido</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
