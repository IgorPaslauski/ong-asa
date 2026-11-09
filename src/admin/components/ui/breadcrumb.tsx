import * as React from 'react'
import { Slot } from 'radix-ui'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/admin/lib/utils'

export function Breadcrumb(props: React.ComponentProps<'nav'>) {
  return <nav aria-label="Trilha de navegação" {...props} />
}
export function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return <ol className={cn('flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground', className)} {...props} />
}
export function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />
}
export function BreadcrumbLink({ asChild, className, ...props }: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a'
  return <Comp className={cn('transition-colors hover:text-foreground', className)} {...props} />
}
export function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return <span aria-current="page" className={cn('font-medium text-foreground', className)} {...props} />
}
export function BreadcrumbSeparator(props: React.ComponentProps<'span'>) {
  return (
    <span role="presentation" aria-hidden="true" {...props}>
      <ChevronRightIcon className="size-3.5" />
    </span>
  )
}
