import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ExportColumn } from '@/admin/lib/export'

export interface FilterOption {
  value: string
  label: string
}

export interface DateRangeValue {
  from?: string
  to?: string
}

interface BaseFilter<T> {
  id: string
  label: string
  /** Texto curto usado nos resumos de escopo das exportações. */
  describe?: (value: any) => string
  match: (row: T, value: any) => boolean
}

export interface SelectFilter<T> extends BaseFilter<T> {
  type: 'select' | 'combobox'
  options: FilterOption[]
  allLabel?: string
}

export interface DateRangeFilter<T> extends BaseFilter<T> {
  type: 'date-range'
}

export type FilterDef<T> = SelectFilter<T> | DateRangeFilter<T>

export type FilterState = Record<string, unknown>

export interface RowAction<T> {
  id: string
  label: string
  icon?: ReactNode
  destructive?: boolean
  hidden?: boolean
  onSelect: (row: T) => void
}

export interface EmptyStateConfig {
  title: string
  description?: string
  action?: ReactNode
}

export interface DataTableProps<T> {
  /** Identificador estável: define as chaves de preferências e filtros da sessão. */
  id: string
  data: T[]
  columns: ColumnDef<T, any>[]
  getRowId: (row: T) => string
  /** Texto pesquisável da linha (a busca ignora acentos e caixa). */
  searchText?: (row: T) => string
  searchPlaceholder?: string
  searchLabel?: string
  filters?: FilterDef<T>[]
  initialSort?: { id: string; desc: boolean }[]
  pageSizes?: number[]
  rowActions?: (row: T) => RowAction<T>[]
  /** Ação executada ao clicar na linha (além do botão de ações). */
  onRowOpen?: (row: T) => void
  /** Ação principal da barra (ex.: “Nova doação”). */
  primaryAction?: ReactNode
  /** Conteúdo extra na barra de ferramentas. */
  toolbarExtra?: ReactNode
  /** Exportação do conjunto filtrado e ordenado (todas as páginas). */
  exportConfig?: {
    filename: string
    title: string
    subtitle?: string
    columns: ExportColumn<T>[]
    notes?: string[]
  }
  /** Descrição do período para o escopo das exportações. */
  exportPeriod?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty?: EmptyStateConfig
  /** Rótulo singular/plural da contagem: ["registro","registros"]. */
  noun?: [string, string]
  /** Rótulo acessível da tabela. */
  caption: string
  /** Renderização alternativa por linha em telas estreitas (padrão: cartão com todas as colunas visíveis). */
  /** Notifica a página com as linhas após busca e filtros (já ordenadas), para indicadores coerentes. */
  onFilteredRowsChange?: (rows: T[]) => void
  /** Colunas ocultas por padrão (ex.: { telefone: false }). */
  defaultColumnVisibility?: Record<string, boolean>
  mobileCard?: (row: T, actions: ReactNode) => ReactNode
}
