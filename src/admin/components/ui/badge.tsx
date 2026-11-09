import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/admin/lib/utils'

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-card text-foreground',
        success: 'border-transparent bg-[#e3f1ec] text-[#0b5441]',
        warning: 'border-transparent bg-[#fbf0d9] text-[#7a4f0c]',
        destructive: 'border-transparent bg-[#f8e4e4] text-[#9c3535]',
        info: 'border-transparent bg-[#e3eef8] text-[#255782]',
        muted: 'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
