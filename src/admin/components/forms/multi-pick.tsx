import type { ReactNode } from 'react'
import { useController } from 'react-hook-form'
import { Checkbox } from '@/admin/components/ui/checkbox'
import { cn } from '@/admin/lib/utils'

export interface PickOption {
  value: string
  label: string
  hint?: string
}

/** Lista de caixas de seleção ligada a um campo `string[]` do react-hook-form. */
export function MultiPickField({
  control,
  name,
  label,
  options,
  description,
  empty = 'Nenhuma opção disponível.',
  className,
}: {
  control: any
  name: string
  label: string
  options: PickOption[]
  description?: ReactNode
  empty?: string
  className?: string
}) {
  const { field } = useController({ control, name })
  const value: string[] = Array.isArray(field.value) ? field.value : []
  const toggle = (v: string, on: boolean) => field.onChange(on ? [...value, v] : value.filter((x) => x !== v))

  return (
    <fieldset className={cn('space-y-1.5', className)}>
      <legend className="text-sm font-medium">{label}</legend>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {options.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-center text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="max-h-56 divide-y overflow-auto rounded-md border">
          {options.map((o) => (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent/50">
                <Checkbox checked={value.includes(o.value)} onCheckedChange={(c) => toggle(o.value, c === true)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{o.label}</span>
                  {o.hint ? <span className="block truncate text-xs text-muted-foreground">{o.hint}</span> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {value.length} selecionado(s)
      </p>
    </fieldset>
  )
}
