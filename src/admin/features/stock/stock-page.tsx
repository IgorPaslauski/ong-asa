import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDownToLineIcon, ArrowUpFromLineIcon, HistoryIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/admin/components/ui/badge'
import { Button } from '@/admin/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/admin/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import { StatStrip } from '@/admin/components/charts/stat-strip'
import { DataTable, SortableHeader } from '@/admin/components/data-table/data-table'
import { numberSort, textSort } from '@/admin/components/data-table/columns'
import type { FilterDef, RowAction } from '@/admin/components/data-table/types'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'
import { NumberField, SelectField, TextField } from '@/admin/components/forms/fields'
import { FormSection, FormSheet } from '@/admin/components/forms/form-sheet'
import { PageHeader } from '@/admin/components/layout/page-header'
import { STOCK_CATEGORIES, isLowStock, stockBalance, stockItems, stockMoves, type StockItem } from '@/admin/data/modules'
import { formatDateBR, formatNumber, todayISO } from '@/admin/lib/format'

const itemSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do item.'),
  categoria: z.string().min(1, 'Escolha a categoria.'),
  unidade: z.string().trim().min(1, 'Informe a unidade (kg, un, pacote…).'),
  minimo: z.union([z.number().min(0, 'Não pode ser negativo.'), z.literal('')]),
})
type ItemForm = z.infer<typeof itemSchema>
const moveSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.'),
  quantidade: z.number({ error: 'Informe a quantidade.' }).positive('A quantidade precisa ser maior que zero.'),
  observacao: z.string().trim(),
})
type MoveForm = z.infer<typeof moveSchema>

interface Row extends StockItem {
  saldo: number
  baixo: boolean
}

const CATEGORY_OPTIONS = STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))

export default function StockPage() {
  const items = stockItems.useAll()
  const moves = stockMoves.useAll()
  const [itemOpen, setItemOpen] = useState(false)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [toDelete, setToDelete] = useState<StockItem | null>(null)
  const [moveFor, setMoveFor] = useState<{ item: StockItem; tipo: 'entrada' | 'saida' } | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)

  const itemForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema), defaultValues: { nome: '', categoria: '', unidade: 'un', minimo: '' }, mode: 'onTouched' })
  const moveForm = useForm<MoveForm>({ resolver: zodResolver(moveSchema), defaultValues: { data: todayISO(), quantidade: '' as unknown as number, observacao: '' }, mode: 'onTouched' })

  const rows = useMemo<Row[]>(
    () => items.map((i) => {
      const saldo = stockBalance(i.id, moves)
      return { ...i, saldo, baixo: isLowStock(i, saldo) }
    }),
    [items, moves],
  )
  const low = rows.filter((r) => r.baixo).length
  const history = moves.filter((m) => m.itemId === historyId).sort((a, b) => b.data.localeCompare(a.data))
  const historyItem = items.find((i) => i.id === historyId) ?? null

  function openCreate() {
    setEditing(null)
    itemForm.reset({ nome: '', categoria: '', unidade: 'un', minimo: '' })
    setItemOpen(true)
  }
  function openEdit(i: StockItem) {
    setEditing(i)
    itemForm.reset({ nome: i.nome, categoria: i.categoria, unidade: i.unidade, minimo: i.minimo })
    setItemOpen(true)
  }
  function saveItem(v: ItemForm) {
    const saved = stockItems.save({ ...v, minimo: v.minimo === '' ? 0 : v.minimo }, editing?.id)
    toast.success(editing ? 'Item atualizado.' : 'Item cadastrado.', { description: saved.nome })
    setItemOpen(false)
  }
  function openMove(item: StockItem, tipo: 'entrada' | 'saida') {
    moveForm.reset({ data: todayISO(), quantidade: '' as unknown as number, observacao: '' })
    setMoveFor({ item, tipo })
  }
  function saveMove(v: MoveForm) {
    if (!moveFor) return
    const { item, tipo } = moveFor
    if (tipo === 'saida' && v.quantidade > stockBalance(item.id, moves)) {
      moveForm.setError('quantidade', { message: 'Maior que o saldo em estoque.' })
      throw new Error('Saída maior que o saldo disponível.')
    }
    stockMoves.save({ itemId: item.id, tipo, ...v }, undefined)
    toast.success(tipo === 'entrada' ? 'Entrada registrada.' : 'Saída registrada.', { description: `${formatNumber(v.quantidade)} ${item.unidade} · ${item.nome}` })
    setMoveFor(null)
  }

  const columns = useMemo<ColumnDef<Row, any>[]>(
    () => [
      { id: 'nome', accessorFn: (r) => r.nome, sortingFn: textSort, meta: { title: 'Item' }, header: ({ column }) => <SortableHeader column={column} title="Item" />, cell: ({ row }) => (
        <div className="min-w-0">
          <span className="block truncate font-medium">{row.original.nome}</span>
          <span className="block truncate text-xs text-muted-foreground">{row.original.categoria}</span>
        </div>
      ) },
      { id: 'saldo', accessorFn: (r) => r.saldo, sortingFn: numberSort, meta: { title: 'Saldo', className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title="Saldo" align="right" />, cell: ({ row }) => <span className="tabular">{formatNumber(row.original.saldo)} {row.original.unidade}</span> },
      { id: 'minimo', accessorFn: (r) => r.minimo, sortingFn: numberSort, meta: { title: 'Mínimo', className: 'text-right' }, header: ({ column }) => <SortableHeader column={column} title="Mínimo" align="right" />, cell: ({ row }) => <span className="tabular">{formatNumber(row.original.minimo)} {row.original.unidade}</span> },
      { id: 'situacao', accessorFn: (r) => (r.baixo ? 0 : 1), sortingFn: numberSort, meta: { title: 'Situação' }, header: ({ column }) => <SortableHeader column={column} title="Situação" />, cell: ({ row }) => <Badge variant={row.original.baixo ? 'warning' : 'success'}>{row.original.saldo <= 0 ? 'Acabou' : row.original.baixo ? 'Estoque baixo' : 'Em dia'}</Badge> },
    ],
    [],
  )
  const filters = useMemo<FilterDef<Row>[]>(
    () => [
      { id: 'categoria', type: 'select', label: 'Categoria', options: CATEGORY_OPTIONS, match: (r, v) => r.categoria === v },
      { id: 'situacao', type: 'select', label: 'Situação', options: [{ value: 'baixo', label: 'Estoque baixo' }, { value: 'ok', label: 'Em dia' }], match: (r, v) => (v === 'baixo' ? r.baixo : !r.baixo) },
    ],
    [],
  )

  const rowActions = (): RowAction<Row>[] => [
    { id: 'entrada', label: 'Registrar entrada', icon: <ArrowDownToLineIcon />, onSelect: (r) => openMove(r, 'entrada') },
    { id: 'saida', label: 'Registrar saída', icon: <ArrowUpFromLineIcon />, onSelect: (r) => openMove(r, 'saida') },
    { id: 'historico', label: 'Ver movimentos', icon: <HistoryIcon />, onSelect: (r) => setHistoryId(r.id) },
    { id: 'editar', label: 'Editar item', icon: <PencilIcon />, onSelect: openEdit },
    { id: 'remover', label: 'Remover item', icon: <Trash2Icon />, destructive: true, onSelect: setToDelete },
  ]

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Alimentos, roupas, material e higiene recebidos em doação. O saldo é a soma das entradas menos as saídas."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Novo item
          </Button>
        }
      />
      <StatStrip label="Resumo do estoque" items={[['Itens', items.length], ['Com estoque baixo', low], ['Movimentos', moves.length]]} />
      <DataTable<Row>
        id="stock"
        caption="Estoque"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchText={(r) => `${r.nome} ${r.categoria}`}
        searchPlaceholder="Buscar item ou categoria"
        filters={filters}
        initialSort={[{ id: 'situacao', desc: false }]}
        rowActions={rowActions}
        noun={['item', 'itens']}
        empty={{
          title: 'Nenhum item no estoque',
          description: 'Cadastre os itens que o Instituto recebe e registre as entradas e saídas.',
          action: (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon />
              Novo item
            </Button>
          ),
        }}
      />

      <FormSheet open={itemOpen} onOpenChange={setItemOpen} title={editing ? 'Editar item' : 'Novo item'} description={editing ? editing.nome : 'Algo que o Instituto guarda em estoque.'} form={itemForm} onSubmit={saveItem} submitLabel={editing ? 'Salvar alterações' : 'Cadastrar item'}>
        <FormSection title="O item">
          <TextField control={itemForm.control} name="nome" label="Nome" required autoFocus className="sm:col-span-2" autoComplete="off" placeholder="Ex.: Arroz 5 kg" />
          <SelectField control={itemForm.control} name="categoria" label="Categoria" required options={CATEGORY_OPTIONS} />
          <TextField control={itemForm.control} name="unidade" label="Unidade" required autoComplete="off" placeholder="kg, un, pacote" />
          <NumberField control={itemForm.control} name="minimo" label="Estoque mínimo" min={0} className="sm:col-span-2" description="Quando o saldo chegar a este valor, o item aparece como estoque baixo." />
        </FormSection>
      </FormSheet>

      <FormSheet
        open={Boolean(moveFor)}
        onOpenChange={(o) => !o && setMoveFor(null)}
        title={moveFor?.tipo === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}
        description={moveFor ? `${moveFor.item.nome} · saldo atual ${formatNumber(stockBalance(moveFor.item.id, moves))} ${moveFor.item.unidade}` : undefined}
        form={moveForm}
        onSubmit={saveMove}
        submitLabel="Registrar"
      >
        <FormSection title="Movimento">
          <NumberField control={moveForm.control} name="quantidade" label={`Quantidade (${moveFor?.item.unidade ?? ''})`} required min={0} step="any" autoFocus />
          <TextField control={moveForm.control} name="data" label="Data" type="date" required />
          <TextField control={moveForm.control} name="observacao" label="Observação" className="sm:col-span-2" autoComplete="off" placeholder={moveFor?.tipo === 'entrada' ? 'Ex.: doação da Maria' : 'Ex.: cestas de dezembro'} />
        </FormSection>
      </FormSheet>

      <Sheet open={Boolean(historyItem)} onOpenChange={(o) => !o && setHistoryId(null)}>
        <SheetContent>
          {historyItem ? (
            <>
              <SheetHeader>
                <SheetTitle>Movimentos</SheetTitle>
                <SheetDescription>{historyItem.nome}</SheetDescription>
              </SheetHeader>
              <SheetBody>
                {history.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nenhum movimento registrado.</p>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Qtd.</TableHead>
                          <TableHead>Obs.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="tabular">{formatDateBR(m.data)}</TableCell>
                            <TableCell>{m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</TableCell>
                            <TableCell className="text-right tabular">{m.tipo === 'entrada' ? '+' : '−'}{formatNumber(m.quantidade)}</TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">{m.observacao || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SheetBody>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover este item?"
        description={
          <p>
            <strong>{toDelete?.nome}</strong> e todo o histórico de movimentos dele serão removidos. Esta ação não pode ser desfeita.
          </p>
        }
        confirmLabel="Remover item"
        onConfirm={() => {
          if (!toDelete) return
          for (const m of moves.filter((x) => x.itemId === toDelete.id)) stockMoves.remove(m.id)
          stockItems.remove(toDelete.id)
          toast.success('Item removido.', { description: toDelete.nome })
          setToDelete(null)
        }}
      />
    </div>
  )
}
