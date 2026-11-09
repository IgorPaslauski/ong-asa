import * as React from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/admin/lib/utils'
import { buttonVariants } from './button'

export function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames()
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays
      className={cn('p-1', className)}
      classNames={{
        root: cn('w-fit', d.root),
        months: cn('relative flex flex-col gap-4', d.months),
        month: cn('flex w-full flex-col gap-3', d.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between', d.nav),
        button_previous: cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'size-7', d.button_previous),
        button_next: cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'size-7', d.button_next),
        month_caption: cn('flex h-7 items-center justify-center', d.month_caption),
        caption_label: cn('text-sm font-medium capitalize', d.caption_label),
        weekdays: cn('flex', d.weekdays),
        weekday: cn('w-8 flex-1 text-[11px] font-medium text-muted-foreground uppercase', d.weekday),
        week: cn('mt-1 flex w-full', d.week),
        day: cn('group/day relative size-8 p-0 text-center text-sm', d.day),
        day_button: cn(
          'size-8 rounded-md text-[13px] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:hover:bg-primary',
          d.day_button,
        ),
        today: cn('font-bold text-primary', d.today),
        outside: cn('text-muted-foreground/60', d.outside),
        disabled: cn('opacity-40', d.disabled),
        hidden: cn('invisible', d.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className={cn('size-4', c)} />
          ) : (
            <ChevronRightIcon className={cn('size-4', c)} />
          ),
      }}
      {...props}
    />
  )
}
