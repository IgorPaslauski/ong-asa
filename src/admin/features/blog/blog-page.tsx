import { useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLinkIcon, EyeIcon, EyeOffIcon, ImageIcon, PencilIcon, PlusIcon, SendIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge, type BadgeVariant } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { dateSort, enumSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { SelectField, TextField, TextareaField } from '@/admin/components/forms/fields'
import { RichTextField } from '@/admin/components/forms/rich-text-field'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { postsRepo, usePosts } from '@/admin/data/store'
import type { ExportColumn } from '@/admin/lib/export'
import { formatDateBR, todayISO } from '@/admin/lib/format'
import { resizeImageToDataUrl } from '@/admin/lib/image'
import { can, useSessionUser } from '@/lib/auth'
import { POST_CATEGORIES, POST_STATUS, POST_STATUS_LABEL, bodyToHtml, bodyToText, excerptOf, sanitizeHtml, safeImageSrc, type BlogPost, type PostStatus } from '@/lib/blog'

const STATUS_VARIANT: Record<PostStatus, BadgeVariant> = { rascunho: 'warning', revisao: 'info', publicado: 'success' }

const postSchema = z.object({
  titulo: z.string().trim().min(1, 'Informe o título.').max(120, 'Use até 120 caracteres.'),
  categoria: z.string().min(1, 'Escolha uma categoria.'),
  resumo: z.string().trim().max(240, 'Use até 240 caracteres.'),
  corpo: z.string().max(100000, 'Texto muito longo.').refine((v) => bodyToText(v).length > 0, 'Escreva o texto da notícia.'),
  capa: z.string().max(400000, 'Imagem muito grande.'),
  capaAlt: z.string().trim().max(160, 'Use até 160 caracteres.'),
  autor: z.string().trim().min(1, 'Informe quem assina o texto.').max(80, 'Use até 80 caracteres.'),
  publicadoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.'),
  status: z.enum(['rascunho', 'revisao', 'publicado']),
})
type PostForm = z.infer<typeof postSchema>

interface Row extends BlogPost {
  /** Publicado com data futura. */
  agendado: boolean
}

export default function BlogPage() {
  const posts = usePosts()
  const user = useSessionUser()
  const canPublish = can(user?.perfil, 'blog.publicar')
  const today = todayISO()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [toDelete, setToDelete] = useState<BlogPost | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const emptyValues = (): PostForm => ({
    titulo: '',
    categoria: 'Notícias',
    resumo: '',
    corpo: '',
    capa: '',
    capaAlt: '',
    autor: user?.nome ?? '',
    publicadoEm: today,
    status: canPublish ? 'publicado' : 'rascunho',
  })
  const form = useForm<PostForm>({ resolver: zodResolver(postSchema), defaultValues: emptyValues(), mode: 'onTouched' })
  const capa = useWatch({ control: form.control, name: 'capa' })

  // Voluntário vê e edita só o que escreveu; a equipe vê tudo.
  const mine = (p: BlogPost) => canPublish || (!!user && p.autorId === user.id)
  const rows = useMemo<Row[]>(
    () => posts.filter(mine).map((p) => ({ ...p, agendado: p.status === 'publicado' && p.publicadoEm > today })),
    // eslint-disable-next-line
    [posts, today, canPublish, user?.id],
  )
  const canEditPost = (p: BlogPost) => mine(p) && (canPublish || p.status !== 'publicado')

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues())
    setFormOpen(true)
  }
  function openEdit(p: BlogPost) {
    if (!canEditPost(p)) return
    setEditing(p)
    form.reset({ titulo: p.titulo, categoria: p.categoria, resumo: p.resumo, corpo: bodyToHtml(p.corpo), capa: p.capa, capaAlt: p.capaAlt, autor: p.autor, publicadoEm: p.publicadoEm || today, status: p.status })
    setFormOpen(true)
  }

  function save(values: PostForm) {
    // Quem não publica nunca grava como publicado, mesmo editando o formulário na mão.
    const status: PostStatus = canPublish ? values.status : values.status === 'publicado' ? 'revisao' : values.status
    try {
      const saved = postsRepo.save({ ...values, corpo: sanitizeHtml(values.corpo), status, autorId: editing?.autorId || user?.id || '' }, editing?.id)
      toast.success(
        status === 'publicado' ? (saved.publicadoEm > today ? 'Post agendado.' : 'Post publicado no blog.') : status === 'revisao' ? 'Post enviado para revisão.' : 'Rascunho salvo.',
        { description: saved.titulo },
      )
      setFormOpen(false)
    } catch {
      toast.error('Não foi possível salvar: o armazenamento do navegador está cheio. Use uma imagem menor ou remova posts antigos.')
    }
  }

  async function pickImage(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      form.setValue('capa', await resizeImageToDataUrl(file), { shouldDirty: true, shouldValidate: true })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const counts = useMemo(() => {
    const c = { total: rows.length, publicado: 0, revisao: 0, rascunho: 0 }
    for (const r of rows) c[r.status] += 1
    return c
  }, [rows])

  const columns = useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        id: 'titulo',
        accessorFn: (p) => p.titulo,
        sortingFn: textSort,
        meta: { title: 'Post' },
        header: ({ column }) => <SortableHeader column={column} title="Post" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block max-w-md truncate font-medium">{row.original.titulo}</span>
            <span className="block max-w-md truncate text-xs text-muted-foreground">{excerptOf(row.original, 90)}</span>
          </div>
        ),
      },
      {
        id: 'categoria',
        accessorFn: (p) => p.categoria,
        sortingFn: textSort,
        meta: { title: 'Categoria' },
        header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
      },
      { id: 'autor', accessorFn: (p) => p.autor, sortingFn: textSort, meta: { title: 'Autor' }, header: ({ column }) => <SortableHeader column={column} title="Autor" />, cell: ({ getValue }) => getValue<string>() || '—' },
      {
        id: 'data',
        accessorFn: (p) => p.publicadoEm,
        sortingFn: dateSort,
        meta: { title: 'Data' },
        header: ({ column }) => <SortableHeader column={column} title="Data" />,
        cell: ({ getValue }) => <span className="tabular">{formatDateBR(getValue<string>())}</span>,
      },
      {
        id: 'status',
        accessorFn: (p) => p.status,
        sortingFn: enumSort(POST_STATUS),
        meta: { title: 'Situação' },
        header: ({ column }) => <SortableHeader column={column} title="Situação" />,
        cell: ({ row }) =>
          row.original.agendado ? <Badge variant="info">Agendado</Badge> : <Badge variant={STATUS_VARIANT[row.original.status]}>{POST_STATUS_LABEL[row.original.status]}</Badge>,
      },
    ],
    [],
  )

  const filters = useMemo<FilterDef<Row>[]>(
    () => [
      { id: 'status', type: 'select', label: 'Situação', options: POST_STATUS.map((v) => ({ value: v, label: POST_STATUS_LABEL[v] })), match: (p, v) => p.status === v },
      { id: 'categoria', type: 'select', label: 'Categoria', options: POST_CATEGORIES.map((v) => ({ value: v, label: v })), match: (p, v) => p.categoria === v },
    ],
    [],
  )

  const rowActions = useMemo(
    () =>
      (p: Row): RowAction<Row>[] => [
        { id: 'editar', label: 'Editar post', icon: <PencilIcon />, hidden: !canEditPost(p), onSelect: openEdit },
        {
          id: 'ver',
          label: 'Ver no site',
          icon: <ExternalLinkIcon />,
          hidden: p.status !== 'publicado' || p.agendado,
          onSelect: (x) => window.open(`${window.location.pathname}#/blog/${x.slug}`, '_blank', 'noopener'),
        },
        {
          id: 'enviar',
          label: 'Enviar para revisão',
          icon: <SendIcon />,
          hidden: canPublish || p.status !== 'rascunho',
          onSelect: (x) => {
            postsRepo.setStatus(x.id, 'revisao')
            toast.success('Enviado para revisão da equipe.', { description: x.titulo })
          },
        },
        {
          id: 'toggle',
          label: p.status === 'publicado' ? 'Tirar do blog (voltar a rascunho)' : 'Publicar agora',
          icon: p.status === 'publicado' ? <EyeOffIcon /> : <EyeIcon />,
          hidden: !canPublish,
          onSelect: (x) => {
            postsRepo.setStatus(x.id, x.status === 'publicado' ? 'rascunho' : 'publicado')
            toast.success(x.status === 'publicado' ? 'Post retirado do blog.' : 'Post publicado no blog.', { description: x.titulo })
          },
        },
        { id: 'remover', label: 'Remover post', icon: <Trash2Icon />, destructive: true, hidden: !canEditPost(p), onSelect: setToDelete },
      ],
    // eslint-disable-next-line
    [canPublish, user?.id],
  )

  const exportColumns: ExportColumn<Row>[] = [
    { header: 'Título', value: (p) => p.titulo },
    { header: 'Categoria', value: (p) => p.categoria },
    { header: 'Autor', value: (p) => p.autor },
    { header: 'Data', value: (p) => formatDateBR(p.publicadoEm) },
    { header: 'Situação', value: (p) => (p.agendado ? 'Agendado' : POST_STATUS_LABEL[p.status]) },
  ]

  const statusOptions = (canPublish ? POST_STATUS : (['rascunho', 'revisao'] as PostStatus[])).map((v) => ({ value: v, label: v === 'publicado' ? 'Publicado no blog' : POST_STATUS_LABEL[v] }))
  const capaSrc = safeImageSrc(capa)

  return (
    <div>
      <PageHeader
        title="Blog e notícias"
        description={
          canPublish
            ? 'Textos e novidades do Instituto. Os publicados aparecem na aba Blog do site; textos enviados por voluntários chegam como “Em revisão”.'
            : 'Escreva notícias e relatos. Envie para revisão e a equipe publica no blog do site. Aqui você vê só os seus textos.'
        }
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Novo post
          </Button>
        }
      />

      <StatStrip label="Resumo do blog" items={[['Posts', counts.total], ['Publicados', counts.publicado], ['Em revisão', counts.revisao], ['Rascunhos', counts.rascunho]]} />

      <DataTable<Row>
        id="blog"
        caption="Posts do blog"
        data={rows}
        columns={columns}
        getRowId={(p) => p.id}
        searchText={(p) => `${p.titulo} ${p.resumo} ${p.autor} ${p.categoria}`}
        searchPlaceholder="Buscar por título, autor ou categoria"
        filters={filters}
        initialSort={[{ id: 'data', desc: true }]}
        rowActions={rowActions}
        noun={['post', 'posts']}
        empty={{
          title: 'Nenhum post ainda',
          description: 'Escreva a primeira notícia do Instituto. Ela aparece na aba Blog do site assim que for publicada.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Novo post
            </Button>
          ),
        }}
        exportConfig={{ filename: 'blog', title: 'Blog e notícias', subtitle: 'Posts do blog do Instituto A.S.A.', columns: exportColumns }}
        exportPeriod="Todo o histórico"
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar post' : 'Novo post'}
        description={editing ? editing.titulo : 'Conte o que aconteceu. Tudo o que for publicado fica visível ao público.'}
        form={form}
        onSubmit={save}
        submitLabel={editing ? 'Salvar alterações' : 'Salvar post'}
      >
        <FormSection title="O texto">
          <TextField control={form.control} name="titulo" label="Título" required autoFocus className="sm:col-span-2" autoComplete="off" />
          <SelectField control={form.control} name="categoria" label="Categoria" required options={POST_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <TextField control={form.control} name="autor" label="Assinado por" required autoComplete="off" />
          <TextareaField control={form.control} name="resumo" label="Resumo" rows={2} className="sm:col-span-2" description="Aparece na lista de posts (até 240 caracteres). Se ficar vazio, usamos o começo do texto." />
          <RichTextField
            control={form.control}
            name="corpo"
            label="Texto da notícia"
            required
            className="sm:col-span-2"
            description="Selecione um trecho e use a barra para negrito, itálico, código, listas, títulos e links."
          />
        </FormSection>
        <FormSection title="Foto de capa" description="Opcional. Use fotos em que as crianças possam aparecer apenas com autorização da família.">
          <div className="space-y-2 sm:col-span-2">
            {capaSrc ? (
              <div className="relative overflow-hidden rounded-md border">
                <img src={capaSrc} alt="" className="aspect-[16/9] w-full object-cover" />
                <Button type="button" size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => form.setValue('capa', '', { shouldDirty: true })}>
                  <XIcon />
                  Remover foto
                </Button>
              </div>
            ) : null}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="blog-capa-file" onChange={(e) => void pickImage(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <ImageIcon />
              {uploading ? 'Processando…' : capaSrc ? 'Trocar foto' : 'Escolher foto'}
            </Button>
          </div>
          <TextField control={form.control} name="capaAlt" label="Descrição da foto" className="sm:col-span-2" autoComplete="off" description="Para quem usa leitor de tela. Ex.: “Crianças na oficina de pintura”." />
        </FormSection>
        <FormSection title="Publicação">
          <SelectField control={form.control} name="status" label="Situação" required options={statusOptions} description={canPublish ? undefined : 'A equipe revisa e publica o seu texto.'} />
          <TextField control={form.control} name="publicadoEm" label="Data de publicação" type="date" required description={canPublish ? 'Data no futuro agenda o post.' : undefined} />
        </FormSection>
      </FormSheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este post?"
        description={
          <p>
            <strong>{toDelete?.titulo}</strong> será removido do painel e do blog neste navegador. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover post"
        onConfirm={() => {
          if (!toDelete) return
          postsRepo.remove(toDelete.id)
          toast.success('Post removido.', { description: toDelete.titulo })
          setToDelete(null)
        }}
      />
    </div>
  )
}
