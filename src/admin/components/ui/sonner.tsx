import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="admin-root"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'admin-root !border !border-border !bg-card !text-foreground !shadow-md !text-[13px]',
          description: '!text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
