import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  InboxIcon,
  MoreHorizontalIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/admin/components/ui/alert'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/admin/components/ui/dropdown-menu'
import { Input } from '@/admin/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select'
import { Skeleton } from '@/admin/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/components/ui/table'
import {
  ComboboxFilterControl,
  DateRangeControl,
  SelectFilterControl,
} from '@/admin/components/filters/filter-controls'
import { exportCsv, exportPdf, slugify } from '@/admin/lib/export'
import { formatNumber, normalize, todayISO } from '@/admin/lib/format'
import { usePersistentState, useMediaQuery, useSessionState, useDebounced } from '@/admin/lib/hooks'
import { cn } from '@/admin/lib/utils'
import type { DataTableProps, DateRangeValue, FilterDef, FilterState } from './types'

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100]

interface TablePrefs {
  pageSize: number
  visibility: VisibilityState
}

/** Cabeçalho de coluna ordenável: botão com indicador de direção e aria-sort. */
export function SortableHeader<T>({ column, title, align }: { column: Column<T, unknown>; title: string; align?: 'right' }) {
  if (!column.getCanSort()) return <span>{title}</span>
  const dir = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-2.5 h-7 gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground', align === 'right' && 'ml-auto -mr-2.5')}
      onClick={() => column.toggleSorting(dir === 'asc')}
      aria-label={`Ordenar por ${title}${dir === 'asc' ? ' (crescente, clique para decrescente)' : dir === 'desc' ? ' (decrescente, clique para crescente)' : ''}`}
    >
      {title}
      {dir === 'asc' ? (
        <ArrowUpIcon className="size-3.5 text-foreground" />
      ) : dir === 'desc' ? (
        <ArrowDownIcon className="size-3.5 text-foreground" />
      ) : (
        <ArrowUpDownIcon className="size-3.5 opacity-50" />
      )}
    </Button>
  )
}

function ariaSort(dir: false | 'asc' | 'desc'): 'ascending' | 'descending' | 'none' {
  return dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
}

function columnTitle<T>(col: ColumnDef<T, any>): string {
  return (col.meta as { title?: string } | undefined)?.title ?? (typeof col.header === 'string' ? col.header : String(col.id ?? ''))
}

function describeFilters<T>(filters: FilterDef<T>[] | undefined, state: FilterState, query: string): string[] {
  const out: string[] = []
  if (query.trim()) out.push(`Busca: “${query.trim()}”`)
  for (const f of filters ?? []) {
    const v = state[f.id]
    if (v == null) continue
    if (f.type === 'date-range') {
      const r = v as DateRangeValue
      if (r.from || r.to) out.push(`${f.label}: ${r.from ?? '…'} a ${r.to ?? '…'}`)
    } else {
      out.push(`${f.label}: ${f.options.find((o) => o.value === v)?.label ?? String(v)}`)
    }
  }
  return out
}

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    id,
    data,
    columns,
    getRowId,
    searchText,
    searchPlaceholder = 'Buscar…',
    searchLabel = 'Buscar na tabela',
    filters,
    initialSort,
    pageSizes = DEFAULT_PAGE_SIZES,
    rowActions,
    onRowOpen,
    primaryAction,
    toolbarExtra,
    exportConfig,
    exportPeriod,
    loading,
    error,
    onRetry,
    empty,
    noun = ['registro', 'registros'],
    caption,
    mobileCard,
    onFilteredRowsChange,
    defaultColumnVisibility,
  } = props

  const isMobile = useMediaQuery('(max-width: 767px)')
  const [prefs, setPrefs] = usePersistentState<TablePrefs>(`table_${id}`, { pageSize: pageSizes[0], visibility: defaultColumnVisibility ?? {} })
  const [query, setQuery] = useSessionState<string>(`table_${id}_q`, '')
  const [filterState, setFilterState] = useSessionState<FilterState>(`table_${id}_f`, {})
  const [sorting, setSorting] = useState<SortingState>(initialSort ?? [])
  const [pageIndex, setPageIndex] = useState(0)
  const debouncedQuery = useDebounced(query, 150)
  // searchText costuma ser uma função inline: guardamos em ref para não invalidar o cálculo a cada render.
  const searchRef = useRef(searchText)
  searchRef.current = searchText
  const hasSearch = Boolean(searchText)

  // 1) busca + filtros -> 2) ordenação (TanStack) -> 3) paginação (TanStack)
  const filtered = useMemo(() => {
    const q = normalize(debouncedQuery.trim())
    return data.filter((row) => {
      if (q && searchRef.current && !normalize(searchRef.current(row)).includes(q)) return false
      for (const f of filters ?? []) {
        const v = filterState[f.id]
        if (v == null) continue
        if (!f.match(row, v)) return false
      }
      return true
    })
  }, [data, debouncedQuery, filterState, filters, hasSearch])

  const actionColumn = useMemo<ColumnDef<T, any>[]>(
    () =>
      rowActions
        ? [{ id: '__actions', enableSorting: false, enableHiding: false, header: () => <span className="sr-only">Ações</span>, meta: { title: 'Ações', className: 'w-10 text-right' }, cell: () => null }]
        : [],
    [rowActions],
  )
  const allColumns = useMemo(() => [...columns, ...actionColumn], [columns, actionColumn])

  const table = useReactTable({
    data: filtered,
    columns: allColumns,
    getRowId,
    state: { sorting, columnVisibility: prefs.visibility, pagination: { pageIndex, pageSize: prefs.pageSize } },
    onSortingChange: (updater) => {
      setSorting(updater)
      setPageIndex(0)
    },
    onColumnVisibilityChange: (updater) =>
      setPrefs((p) => ({ ...p, visibility: typeof updater === 'function' ? updater(p.visibility) : updater })),
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: prefs.pageSize }) : updater
      setPageIndex(next.pageIndex)
      if (next.pageSize !== prefs.pageSize) setPrefs((p) => ({ ...p, pageSize: next.pageSize }))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    enableSortingRemoval: false,
  })

  const total = data.length
  const totalFiltered = filtered.length
  const pageCount = Math.max(1, table.getPageCount())
  const safePage = Math.min(pageIndex, pageCount - 1)
  if (safePage !== pageIndex) queueMicrotask(() => setPageIndex(safePage))

  const rows = table.getRowModel().rows
  const sortedFiltered = table.getPrePaginationRowModel().rows
  useEffect(() => {
    onFilteredRowsChange?.(sortedFiltered.map((r) => r.original))
    // eslint-disable-next-line
  }, [sortedFiltered])
  const hasFilters = Boolean(query.trim()) || Object.values(filterState).some((v) => v != null)
  const startRow = totalFiltered === 0 ? 0 : safePage * prefs.pageSize + 1
  const endRow = Math.min(totalFiltered, (safePage + 1) * prefs.pageSize)
  const hideableColumns = table.getAllLeafColumns().filter((c) => c.getCanHide())
  const visibleCount = table.getVisibleLeafColumns().length

  function clearAll() {
    setQuery('')
    setFilterState({})
    setPageIndex(0)
  }

  function setFilter(fid: string, value: unknown) {
    setFilterState((prev) => {
      const next = { ...prev }
      if (value == null) delete next[fid]
      else next[fid] = value
      return next
    })
    setPageIndex(0)
  }

  function runExport(kind: 'csv' | 'pdf') {
    if (!exportConfig) return
    const exportRows = table.getPrePaginationRowModel().rows.map((r) => r.original)
    if (!exportRows.length) {
      toast.warning('Não há registros para exportar com os filtros atuais.')
      return
    }
    const scope = {
      title: exportConfig.title,
      subtitle: exportConfig.subtitle,
      period: exportPeriod,
      filters: describeFilters(filters, filterState, query),
      notes: exportConfig.notes,
    }
    const name = `${slugify(exportConfig.filename)}-${todayISO()}`
    try {
      if (kind === 'csv') exportCsv(`${name}.csv`, exportRows, exportConfig.columns, scope)
      else exportPdf({ filename: `${name}.pdf`, scope, columns: exportConfig.columns, rows: exportRows })
      toast.success(`${kind.toUpperCase()} gerado com ${formatNumber(exportRows.length)} ${exportRows.length === 1 ? noun[0] : noun[1]}.`)
    } catch (e) {
      toast.error('Não foi possível gerar a exportação.', { description: e instanceof Error ? e.message : undefined })
    }
  }

  function renderActions(row: T): ReactNode {
    const actions = rowActions?.(row).filter((a) => !a.hidden) ?? []
    if (!actions.length) return null
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Abrir ações da linha">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          {actions.map((a, i) => (
            <div key={a.id}>
              {a.destructive && i > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem destructive={a.destructive} onSelect={() => a.onSelect(row)}>
                {a.icon}
                {a.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const toolbar = (
    <div className="no-print flex flex-col gap-2 border-b p-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchText ? (
          <div className="relative min-w-52 flex-1 basis-64 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label={searchLabel}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPageIndex(0)
              }}
              className="pl-8"
            />
          </div>
        ) : null}
        {filters?.map((f) => {
          const v = filterState[f.id]
          if (f.type === 'date-range')
            return <DateRangeControl key={f.id} label={f.label} value={v as DateRangeValue | undefined} onChange={(nv) => setFilter(f.id, nv)} />
          if (f.type === 'combobox')
            return <ComboboxFilterControl key={f.id} label={f.label} options={f.options} allLabel={f.allLabel} value={v as string | undefined} onChange={(nv) => setFilter(f.id, nv)} />
          return <SelectFilterControl key={f.id} label={f.label} options={f.options} allLabel={f.allLabel} value={v as string | undefined} onChange={(nv) => setFilter(f.id, nv)} />
        })}
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <XIcon />
            Limpar filtros
          </Button>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {toolbarExtra}
          {!isMobile && hideableColumns.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3Icon />
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                {hideableColumns.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={c.getIsVisible()}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(v) => c.toggleVisibility(Boolean(v))}
                  >
                    {columnTitle(c.columnDef)}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPrefs((p) => ({ ...p, visibility: defaultColumnVisibility ?? {} }))}>Restaurar padrão</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {exportConfig ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <DownloadIcon />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {formatNumber(totalFiltered)} {totalFiltered === 1 ? noun[0] : noun[1]} (filtros atuais)
                </DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => runExport('csv')}>
                  <FileSpreadsheetIcon />
                  CSV (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => runExport('pdf')}>
                  <FileTextIcon />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {primaryAction}
        </div>
      </div>
    </div>
  )

  const footer = (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 text-[13px] text-muted-foreground">
      <p aria-live="polite" className="tabular">
        {totalFiltered === 0
          ? `0 ${noun[1]}`
          : `${formatNumber(startRow)}–${formatNumber(endRow)} de ${formatNumber(totalFiltered)} ${totalFiltered === 1 ? noun[0] : noun[1]}`}
        {totalFiltered !== total ? ` (filtrado de ${formatNumber(total)})` : ''}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span id={`${id}-ps`}>Por página</span>
          <Select value={String(prefs.pageSize)} onValueChange={(v) => { setPrefs((p) => ({ ...p, pageSize: Number(v) })); setPageIndex(0) }}>
            <SelectTrigger aria-labelledby={`${id}-ps`} className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <nav aria-label="Paginação" className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Primeira página" disabled={safePage === 0} onClick={() => setPageIndex(0)}>
            <ChevronsLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Página anterior" disabled={safePage === 0} onClick={() => setPageIndex(safePage - 1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-20 px-1 text-center tabular">
            Página {safePage + 1} de {pageCount}
          </span>
          <Button variant="outline" size="icon-sm" aria-label="Próxima página" disabled={safePage >= pageCount - 1} onClick={() => setPageIndex(safePage + 1)}>
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Última página" disabled={safePage >= pageCount - 1} onClick={() => setPageIndex(pageCount - 1)}>
            <ChevronsRightIcon />
          </Button>
        </nav>
      </div>
    </div>
  )

  let body: ReactNode
  if (error) {
    body = (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Não foi possível carregar os dados</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            {onRetry ? (
              <Button variant="outline" size="sm" className="mt-2 bg-card text-foreground" onClick={onRetry}>
                Tentar novamente
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      </div>
    )
  } else if (loading) {
    body = (
      <div className="space-y-2 p-3" role="status" aria-label="Carregando dados">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  } else if (rows.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <InboxIcon className="size-8 text-muted-foreground/70" aria-hidden="true" />
        {hasFilters && total > 0 ? (
          <>
            <p className="font-medium">Nenhum resultado para os filtros atuais</p>
            <p className="max-w-sm text-[13px] text-muted-foreground">Ajuste a busca ou remova alguns filtros para ver mais {noun[1]}.</p>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Limpar filtros
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium">{empty?.title ?? `Nenhum ${noun[0]} cadastrado`}</p>
            {empty?.description ? <p className="max-w-sm text-[13px] text-muted-foreground">{empty.description}</p> : null}
            {empty?.action}
          </>
        )}
      </div>
    )
  } else if (isMobile) {
    body = (
      <ul className="divide-y" aria-label={caption}>
        {rows.map((row) => {
          const actions = renderActions(row.original)
          if (mobileCard) return <li key={row.id}>{mobileCard(row.original, actions)}</li>
          const cells = row.getVisibleCells().filter((c) => c.column.id !== '__actions')
          const [first, ...rest] = cells
          return (
            <li key={row.id} className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-medium">{first ? flexRender(first.column.columnDef.cell, first.getContext()) : null}</div>
                {actions}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                {rest.map((c) => (
                  <div key={c.id} className="contents">
                    <dt className="text-muted-foreground">{columnTitle(c.column.columnDef)}</dt>
                    <dd className="min-w-0 text-right break-words">{flexRender(c.column.columnDef.cell, c.getContext())}</dd>
                  </div>
                ))}
              </dl>
            </li>
          )
        })}
      </ul>
    )
  } else {
    body = (
      <Table aria-label={caption}>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  aria-sort={h.column.getCanSort() ? ariaSort(h.column.getIsSorted()) : undefined}
                  className={cn((h.column.columnDef.meta as { className?: string } | undefined)?.className)}
                >
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} onDoubleClick={onRowOpen ? () => onRowOpen(row.original) : undefined}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cn((cell.column.columnDef.meta as { className?: string } | undefined)?.className)}>
                  {cell.column.id === '__actions' ? <div className="flex justify-end">{renderActions(row.original)}</div> : flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden" data-table-id={id} data-visible-columns={visibleCount}>
      {toolbar}
      {body}
      {!error && !loading && totalFiltered > 0 ? footer : null}
      {!error && !loading && totalFiltered === 0 && total > 0 ? footer : null}
    </Card>
  )
}
