import { useEffect, useState, type ReactNode } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/admin/components/ui/button'
import { Form } from '@/admin/components/ui/form'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/admin/components/ui/sheet'
import { ConfirmDialog } from '@/admin/components/feedback/confirm-dialog'

/** Agrupamento lógico de campos dentro do formulário. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 border-b pb-5 last:border-b-0 last:pb-0">
      <legend className="float-left w-full">
        <span className="block text-sm font-semibold">{title}</span>
        {description ? <span className="block text-xs font-normal text-muted-foreground">{description}</span> : null}
      </legend>
      <div className="clear-both grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

/**
 * Painel lateral de cadastro/edição com RHF + Zod:
 * proteção contra envio duplicado, estado de processamento, tratamento de falha,
 * aviso ao descartar alterações e foco no primeiro campo inválido.
 */
export function FormSheet<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  submitLabel = 'Salvar',
  children,
  banner,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  form: UseFormReturn<T, any, any>
  onSubmit: (values: any) => void | Promise<void>
  submitLabel?: string
  children: ReactNode
  banner?: ReactNode
}) {
  const [submitting, setSubmitting] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const dirty = form.formState.isDirty

  useEffect(() => {
    if (!open) setSubmitting(false)
  }, [open])

  function requestClose(next: boolean) {
    if (next) return onOpenChange(true)
    if (submitting) return
    if (dirty) return setConfirmDiscard(true)
    onOpenChange(false)
  }

  const handle = form.handleSubmit(
    async (values) => {
      if (submitting) return
      setSubmitting(true)
      try {
        await onSubmit(values)
      } catch (e) {
        toast.error('Não foi possível salvar.', { description: e instanceof Error ? e.message : 'Tente novamente.' })
      } finally {
        setSubmitting(false)
      }
    },
    () => toast.error('Revise os campos destacados.'),
  )

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent aria-describedby={undefined}>
          <Form {...form}>
            <form onSubmit={handle} noValidate className="flex min-h-0 flex-1 flex-col">
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
                {description ? <SheetDescription>{description}</SheetDescription> : null}
              </SheetHeader>
              <SheetBody className="space-y-5">
                {banner}
                <p className="text-xs text-muted-foreground">
                  Campos com <span className="text-destructive">*</span> são obrigatórios.
                </p>
                {children}
              </SheetBody>
              <SheetFooter>
                <Button variant="outline" onClick={() => requestClose(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <Loader2Icon className="animate-spin" /> : null}
                  {submitting ? 'Salvando…' : submitLabel}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Descartar alterações?"
        description="Você alterou campos que ainda não foram salvos. Se fechar agora, essas alterações serão perdidas."
        confirmLabel="Descartar"
        onConfirm={() => {
          onOpenChange(false)
        }}
      />
    </>
  )
}
