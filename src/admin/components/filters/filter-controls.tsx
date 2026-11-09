import { useState } from 'react'
import { CalendarIcon, CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/admin/components/ui/button'
import { Calendar } from '@/admin/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/admin/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/admin/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select'
import { cn } from '@/admin/lib/utils'
import { formatDateBR } from '@/admin/lib/format'

export interface Option {
  value: string
  label: string
}

const ALL = '__all__'

/** Filtro de seleção única (“Status: Todos”). */
export function SelectFilterControl({
  label,
  options,
  value,
  onChange,
  allLabel,
  className,
}: {
  label: string
  options: Option[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  allLabel?: string
  className?: string
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger aria-label={label} className={cn('h-9 w-auto min-w-36 gap-2', className)}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel ?? 'Todos'}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Combobox pesquisável (listas longas, como doadores). */
export function ComboboxFilterControl({
  label,
  options,
  value,
  onChange,
  allLabel,
  className,
}: {
  label: string
  options: Option[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  allLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn('h-9 min-w-36 justify-between gap-2 px-3 font-normal', className)}
        >
          <span className="truncate">
            <span className="text-muted-foreground">{label}: </span>
            {current?.label ?? allLabel ?? 'Todos'}
          </span>
          <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={allLabel ?? 'Todos'}
                onSelect={() => {
                  onChange(undefined)
                  setOpen(false)
                }}
              >
                <CheckIcon className={cn(value ? 'opacity-0' : 'opacity-100')} />
                {allLabel ?? 'Todos'}
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon className={cn(value === o.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function toDate(iso?: string): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toIso(date?: Date): string | undefined {
  if (!date) return undefined
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Seleção de intervalo de datas com calendário. */
export function DateRangeControl({
  label,
  value,
  onChange,
  className,
}: {
  label: string
  value: { from?: string; to?: string } | undefined
  onChange: (value: { from?: string; to?: string } | undefined) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected: DateRange | undefined = value ? { from: toDate(value.from), to: toDate(value.to) } : undefined
  const text =
    value?.from || value?.to
      ? `${value.from ? formatDateBR(value.from) : '…'} – ${value.to ? formatDateBR(value.to) : '…'}`
      : 'Qualquer data'
  return (
    <div className={cn('inline-flex items-center', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={label} className="h-9 gap-2 px-3 font-normal">
            <CalendarIcon className="text-muted-foreground" />
            <span className="text-muted-foreground">{label}:</span>
            <span className="tabular">{text}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={(range) => {
              if (!range?.from && !range?.to) return onChange(undefined)
              onChange({ from: toIso(range.from), to: toIso(range.to) })
            }}
            numberOfMonths={1}
            defaultMonth={selected?.from}
          />
          <div className="flex justify-end gap-2 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
            >
              Limpar
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {value?.from || value?.to ? (
        <Button variant="ghost" size="icon-sm" aria-label={`Limpar filtro ${label}`} onClick={() => onChange(undefined)}>
          <XIcon />
        </Button>
      ) : null}
    </div>
  )
}
