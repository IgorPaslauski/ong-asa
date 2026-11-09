import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon, PlusIcon, PowerIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { booleanSort, dateSort, enumSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { ActiveBadge } from '@/admin/components/feedback/status-badge'
import { SelectField, SwitchField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { useHelpers } from '@/admin/data/store'
import { formatDateBR } from '@/admin/lib/format'
import { MIN_PASSWORD, ROLES, ROLE_NAME, ROLE_SUMMARY, USER_ERROR_MESSAGE, usersRepo, useSessionUser, useUsers, type AppUser, type Role } from '@/lib/auth'

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_NAME[r] }))
const NO_LINK = '__none'

const userSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('Informe um e-mail válido.')),
  perfil: z.enum(['admin', 'administrativo', 'voluntario', 'doador']),
  helperId: z.string(),
  ativo: z.boolean(),
  senha: z.string(),
})
type UserForm = z.infer<typeof userSchema>

const emptyValues = (): UserForm => ({ nome: '', email: '', perfil: 'voluntario', helperId: NO_LINK, ativo: true, senha: '' })

export default function UsersPage() {
  const users = useUsers()
  const helpers = useHelpers()
  const me = useSessionUser()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [toDelete, setToDelete] = useState<AppUser | null>(null)

  const form = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: emptyValues(), mode: 'onTouched' })
  const perfil = form.watch('perfil')

  const helperOptions = useMemo(
    () => [{ value: NO_LINK, label: 'Sem vínculo' }, ...helpers.map((h) => ({ value: h.id, label: `${h.nome} — ${h.email}` }))],
    [helpers],
  )

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(u: AppUser) {
    setEditing(u)
    form.reset({ nome: u.nome, email: u.email, perfil: u.perfil, helperId: u.helperId || NO_LINK, ativo: u.ativo, senha: '' })
    setFormOpen(true)
  }

  // Erros lançados aqui são exibidos pelo FormSheet (toast "Não foi possível salvar").
  function save(values: UserForm) {
    const tooShort = values.senha.length < MIN_PASSWORD
    if ((!editing && tooShort) || (editing && values.senha && tooShort)) {
      form.setError('senha', { message: `Use pelo menos ${MIN_PASSWORD} caracteres.` })
      throw new Error(USER_ERROR_MESSAGE['senha-curta'])
    }
    const result = usersRepo.save({ ...values, helperId: values.helperId === NO_LINK ? '' : values.helperId }, editing?.id)
    if (!result.ok) {
      if (result.error === 'email-duplicado') form.setError('email', { message: USER_ERROR_MESSAGE[result.error] })
      throw new Error(USER_ERROR_MESSAGE[result.error])
    }
    toast.success(editing ? 'Usuário atualizado.' : 'Usuário cadastrado.', { description: result.user.nome })
    setFormOpen(false)
  }

  const counts = useMemo(() => {
    const c = { total: users.length, ativos: 0, admin: 0, outros: 0 }
    for (const u of users) {
      if (u.ativo) c.ativos += 1
      if (u.perfil === 'admin') c.admin += 1
      else c.outros += 1
    }
    return c
  }, [users])

  const columns = useMemo<ColumnDef<AppUser, any>[]>(
    () => [
      {
        id: 'nome',
        accessorFn: (u) => u.nome,
        sortingFn: textSort,
        meta: { title: 'Usuário' },
        header: ({ column }) => <SortableHeader column={column} title="Usuário" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{row.original.nome}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        id: 'perfil',
        accessorFn: (u) => u.perfil,
        sortingFn: enumSort(ROLES),
        meta: { title: 'Perfil' },
        header: ({ column }) => <SortableHeader column={column} title="Perfil" />,
        cell: ({ getValue }) => <Badge variant={getValue<Role>() === 'admin' ? 'default' : 'muted'}>{ROLE_NAME[getValue<Role>()]}</Badge>,
      },
      {
        id: 'vinculo',
        accessorFn: (u) => helpers.find((h) => h.id === u.helperId)?.nome ?? '',
        sortingFn: textSort,
        meta: { title: 'Vinculado a' },
        header: ({ column }) => <SortableHeader column={column} title="Vinculado a" />,
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'ultimoAcesso',
        accessorFn: (u) => u.ultimoAcesso.slice(0, 10),
        sortingFn: dateSort,
        meta: { title: 'Último acesso' },
        header: ({ column }) => <SortableHeader column={column} title="Último acesso" />,
        cell: ({ getValue }) => <span className="tabular">{getValue<string>() ? formatDateBR(getValue<string>()) : 'Nunca'}</span>,
      },
      {
        id: 'ativo',
        accessorFn: (u) => u.ativo,
        sortingFn: booleanSort,
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
      },
    ],
    [helpers],
  )

  const filters = useMemo<FilterDef<AppUser>[]>(
    () => [
      { id: 'perfil', type: 'select', label: 'Perfil', options: ROLE_OPTIONS, match: (u, v) => u.perfil === v },
      { id: 'ativo', type: 'select', label: 'Situação', options: [{ value: 'ativo', label: 'Ativos' }, { value: 'inativo', label: 'Inativos' }], match: (u, v) => (v === 'ativo' ? u.ativo : !u.ativo) },
    ],
    [],
  )

  function toggleActive(u: AppUser) {
    const r = usersRepo.setActive(u.id, !u.ativo)
    if (!r.ok) return void toast.error('Não foi possível alterar.', { description: USER_ERROR_MESSAGE[r.error] })
    toast.success(u.ativo ? 'Usuário desativado.' : 'Usuário reativado.', { description: u.nome })
  }

  const rowActions = (u: AppUser): RowAction<AppUser>[] => [
    { id: 'editar', label: 'Editar / redefinir senha', icon: <PencilIcon />, onSelect: openEdit },
    { id: 'toggle', label: u.ativo ? 'Desativar acesso' : 'Reativar acesso', icon: <PowerIcon />, hidden: u.id === me?.id, onSelect: toggleActive },
    { id: 'remover', label: 'Remover usuário', icon: <Trash2Icon />, destructive: true, hidden: u.id === me?.id, onSelect: setToDelete },
  ]

  return (
    <div>
      <PageHeader
        title="Usuários e perfis"
        description="Quem pode entrar no sistema e o que cada perfil enxerga."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Novo usuário
          </Button>
        }
      />

      <Alert variant="info" className="mb-4">
        <AlertDescription>
          Versão de demonstração: o controle de acesso organiza o que cada perfil vê, mas os dados ficam neste navegador e <strong>não são protegidos contra quem tiver acesso ao computador</strong>. Para uso real com dados de crianças, a autenticação precisa ir para um servidor.
        </AlertDescription>
      </Alert>

      <StatStrip label="Resumo dos usuários" items={[['Usuários', counts.total], ['Ativos', counts.ativos], ['Administradores', counts.admin], ['Outros perfis', counts.outros]]} />

      <DataTable<AppUser>
        id="users"
        caption="Usuários do sistema"
        data={users}
        columns={columns}
        getRowId={(u) => u.id}
        searchText={(u) => `${u.nome} ${u.email} ${ROLE_NAME[u.perfil]}`}
        searchPlaceholder="Buscar por nome ou e-mail"
        filters={filters}
        initialSort={[{ id: 'perfil', desc: false }]}
        rowActions={rowActions}
        noun={['usuário', 'usuários']}
        empty={{
          title: 'Nenhum usuário cadastrado',
          description: 'Cadastre quem vai acessar o sistema.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Novo usuário
            </Button>
          ),
        }}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            O que cada perfil acessa
          </CardTitle>
          <CardDescription>Resumo das permissões aplicadas ao menu e às telas.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => (
              <div key={r}>
                <dt className="text-[13px] font-semibold">{ROLE_NAME[r]}</dt>
                <dd className="text-[13px] text-muted-foreground">{ROLE_SUMMARY[r]}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        description={editing ? editing.email : 'Defina o perfil de acesso e uma senha inicial.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Cadastrar usuário'}
      >
        <FormSection title="Identificação">
          <TextField control={form.control} name="nome" label="Nome" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <TextField control={form.control} name="email" label="E-mail (login)" type="email" required className="sm:col-span-2" autoComplete="off" />
        </FormSection>
        <FormSection title="Acesso" description={ROLE_SUMMARY[perfil]}>
          <SelectField control={form.control} name="perfil" label="Perfil" required options={ROLE_OPTIONS} className="sm:col-span-2" />
          {perfil === 'doador' || perfil === 'voluntario' ? (
            <SelectField
              control={form.control}
              name="helperId"
              label="Vincular ao cadastro da rede de apoio"
              options={helperOptions}
              className="sm:col-span-2"
              description={perfil === 'doador' ? 'É por este vínculo que o doador vê as próprias doações.' : 'Opcional.'}
            />
          ) : null}
          <TextField
            control={form.control}
            name="senha"
            label={editing ? 'Nova senha' : 'Senha inicial'}
            type="password"
            required={!editing}
            autoComplete="new-password"
            className="sm:col-span-2"
            description={editing ? 'Deixe em branco para manter a senha atual.' : `Mínimo de ${MIN_PASSWORD} caracteres. Informe a senha à pessoa por um canal seguro.`}
          />
          <SwitchField control={form.control} name="ativo" label="Acesso ativo" description="Desative para impedir o login sem apagar o cadastro." className="sm:col-span-2" />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este usuário?"
        description={
          <p>
            <strong>{toDelete?.nome}</strong> perderá o acesso ao sistema. Esta ação não pode ser desfeita. Para apenas bloquear o acesso, prefira desativar.
          </p>
        }
        confirmLabel="Remover usuário"
        onConfirm={() => {
          if (!toDelete) return
          const r = usersRepo.remove(toDelete.id)
          if (!r.ok) toast.error('Não foi possível remover.', { description: USER_ERROR_MESSAGE[r.error] })
          else toast.success('Usuário removido.', { description: toDelete.nome })
          setToDelete(null)
        }}
      />
    </div>
  )
}
