import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/admin/components/ui/tooltip'
import { dateSort, numberSort, textSort } from './columns'
import { DataTable, SortableHeader } from './data-table'
import type { FilterDef } from './types'

interface Item {
  id: string
  nome: string
  idade: number
  entrada: string
  status: 'ativo' | 'concluido'
}

const items: Item[] = [
  { id: '1', nome: 'Zélia', idade: 9, entrada: '2025-12-31', status: 'ativo' },
  { id: '2', nome: 'Álvaro', idade: 10, entrada: '2026-01-02', status: 'concluido' },
  { id: '3', nome: 'Beatriz', idade: 100, entrada: '2024-05-01', status: 'ativo' },
  ...Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, nome: `Pessoa ${String(i).padStart(2, '0')}`, idade: 20 + i, entrada: '2026-02-01', status: 'ativo' as const })),
]

const columns: ColumnDef<Item, any>[] = [
  { id: 'nome', accessorFn: (r) => r.nome, sortingFn: textSort, meta: { title: 'Nome' }, header: ({ column }) => <SortableHeader column={column} title="Nome" />, cell: ({ getValue }) => getValue() },
  { id: 'idade', accessorFn: (r) => r.idade, sortingFn: numberSort, meta: { title: 'Idade' }, header: ({ column }) => <SortableHeader column={column} title="Idade" />, cell: ({ getValue }) => getValue() },
  { id: 'entrada', accessorFn: (r) => r.entrada, sortingFn: dateSort, meta: { title: 'Entrada' }, header: ({ column }) => <SortableHeader column={column} title="Entrada" />, cell: ({ getValue }) => getValue() },
]

const filters: FilterDef<Item>[] = [{ id: 'status', type: 'select', label: 'Situação', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'concluido', label: 'Concluído' }], match: (r, v) => r.status === v }]

function setup(extra: Partial<React.ComponentProps<typeof DataTable<Item>>> = {}) {
  sessionStorage.clear()
  return render(
    <TooltipProvider>
      <DataTable<Item>
        id="t"
        caption="Teste"
        data={items}
        columns={columns}
        getRowId={(r) => r.id}
        searchText={(r) => r.nome}
        filters={filters}
        initialSort={[{ id: 'nome', desc: false }]}
        {...extra}
      />
    </TooltipProvider>,
  )
}

function names() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent)
}
function col(i: number) {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[i].textContent)
}

describe('DataTable', () => {
  it('ordena texto respeitando acentos (Álvaro antes de Beatriz) e expõe aria-sort', () => {
    setup({ pageSizes: [25] })
    expect(names().slice(0, 3)).toEqual(['Álvaro', 'Beatriz', 'Pessoa 00'])
    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('ordena números por valor, não por texto (9 < 10 < 100) e alterna a direção', async () => {
    setup({ pageSizes: [25] })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Ordenar por Idade/ }))
    expect(col(1).slice(0, 3)).toEqual(['9', '10', '20'])
    await user.click(screen.getByRole('button', { name: /Ordenar por Idade/ }))
    expect(col(1)[0]).toBe('100')
  })

  it('ordena datas cronologicamente', async () => {
    setup({ pageSizes: [25] })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Ordenar por Entrada/ }))
    expect(col(2).slice(0, 3)).toEqual(['2024-05-01', '2025-12-31', '2026-01-02'])
  })

  it('ordena o conjunto inteiro, não apenas a página atual', async () => {
    setup({ pageSizes: [5] })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Ordenar por Idade/ }))
    await user.click(screen.getByRole('button', { name: /Ordenar por Idade/ }))
    expect(col(1)[0]).toBe('100') // maior valor do conjunto aparece na 1ª página
  })

  it('busca ignorando acentos e caixa e mostra a contagem filtrada', async () => {
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar na tabela' }), 'alvaro')
    expect(await screen.findByText(/1–1 de 1 registro/)).toBeInTheDocument()
    expect(names()).toEqual(['Álvaro'])
  })

  it('aplica filtros e permite limpar', async () => {
    setup({ pageSizes: [25] })
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Situação' }))
    await user.click(await screen.findByRole('option', { name: 'Concluído' }))
    expect(names()).toEqual(['Álvaro'])
    await user.click(screen.getByRole('button', { name: /Limpar filtros/ }))
    expect(names().length).toBe(items.length)
  })

  it('pagina e informa o intervalo', async () => {
    setup({ pageSizes: [10, 25] })
    const user = userEvent.setup()
    expect(names()).toHaveLength(10)
    expect(screen.getByText(/1–10 de 15 registros/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(names()).toHaveLength(5)
    expect(screen.getByText(/11–15 de 15 registros/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  it('mostra estado vazio com orientação', () => {
    setup({ data: [], empty: { title: 'Nada por aqui', description: 'Cadastre o primeiro.' } })
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument()
    expect(screen.getByText('Cadastre o primeiro.')).toBeInTheDocument()
  })

  it('mostra carregamento e erro com nova tentativa', async () => {
    const retry = vi.fn()
    const { unmount } = setup({ loading: true })
    expect(screen.getByRole('status', { name: 'Carregando dados' })).toBeInTheDocument()
    unmount()
    setup({ error: 'Falha de leitura', onRetry: retry })
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(retry).toHaveBeenCalled()
    expect(screen.getByText('Falha de leitura')).toBeInTheDocument()
  })

  it('lista ações por linha', async () => {
    const onSelect = vi.fn()
    setup({ rowActions: () => [{ id: 'a', label: 'Abrir ficha', onSelect }], pageSizes: [25] })
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Abrir ações da linha' })[0])
    await user.click(await screen.findByRole('menuitem', { name: 'Abrir ficha' }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Álvaro' }))
  })
})
