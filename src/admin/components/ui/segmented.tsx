import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '@/admin/lib/utils'

/** Alternador de opções exclusivas (ex.: Mensal | Anual). Não é navegação: sem painéis associados. */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T
  onValueChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
  className?: string
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(v) => v && onValueChange(v as T)}
      className={cn('inline-flex h-9 w-fit items-center gap-0.5 rounded-md bg-muted p-[3px]', className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className="inline-flex h-[28px] items-center justify-center rounded-[4px] px-3 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
