import type { ReactNode } from 'react'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/admin/components/ui/form'
import { Input, Textarea } from '@/admin/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/components/ui/select'
import { Switch } from '@/admin/components/ui/switch'
import { cn } from '@/admin/lib/utils'

interface BaseProps {
  control: any
  name: string
  label: string
  required?: boolean
  description?: ReactNode
  className?: string
}

export function TextField({
  control,
  name,
  label,
  required,
  description,
  className,
  ...input
}: BaseProps & Omit<React.ComponentProps<'input'>, 'name' | 'value' | 'onChange' | 'defaultValue'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input {...input} {...field} value={field.value ?? ''} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** Campo numérico: mantém o valor como número (ou string vazia enquanto o usuário digita). */
export function NumberField({
  control,
  name,
  label,
  required,
  description,
  className,
  ...input
}: BaseProps & Omit<React.ComponentProps<'input'>, 'name' | 'value' | 'onChange' | 'defaultValue' | 'type'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input
              {...input}
              type="number"
              inputMode="decimal"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function TextareaField({
  control,
  name,
  label,
  required,
  description,
  className,
  ...input
}: BaseProps & Omit<React.ComponentProps<'textarea'>, 'name' | 'value' | 'onChange' | 'defaultValue'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Textarea {...input} {...field} value={field.value ?? ''} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SelectField({
  control,
  name,
  label,
  required,
  description,
  className,
  options,
  placeholder = 'Selecione',
}: BaseProps & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger onBlur={field.onBlur} ref={field.ref}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SwitchField({ control, name, label, description, className }: BaseProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex-row items-center justify-between gap-3 rounded-md border p-3', className)}>
          <div className="space-y-1">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

/** Par rótulo/valor para telas de detalhe. */
export function Detail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children || '—'}</dd>
    </div>
  )
}
