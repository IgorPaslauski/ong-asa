import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon, PrinterIcon } from 'lucide-react'
import { Button } from '@/admin/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/admin/components/ui/dropdown-menu'
import type { ExportKind, Orientation } from '@/admin/lib/export'
import { usePersistentState } from '@/admin/lib/hooks'

const keepOpen = (e: Event) => e.preventDefault()

type OrientationChoice = 'auto' | Orientation

/**
 * Menu único de saída de relatórios e listagens: imprimir, baixar PDF ou CSV,
 * com a orientação da página (retrato/paisagem) lembrada entre as telas.
 */
export function ExportMenu({
  scopeLabel,
  disabled,
  disabledReason,
  size,
  variant,
  onRun,
}: {
  scopeLabel: string
  disabled?: boolean
  disabledReason?: string
  size?: 'sm'
  variant?: 'outline'
  /** `orientation` indefinida = automática (conforme o número de colunas). */
  onRun: (kind: ExportKind, orientation: Orientation | undefined) => void
}) {
  const [choice, setChoice] = usePersistentState<OrientationChoice>('report_orientation', 'auto')
  const run = (kind: ExportKind) => onRun(kind, choice === 'auto' ? undefined : choice)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} disabled={disabled} title={disabled ? disabledReason : undefined}>
          <DownloadIcon />
          Imprimir / Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{scopeLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Orientação da página</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={choice} onValueChange={(v) => setChoice(v as OrientationChoice)}>
          <DropdownMenuRadioItem value="portrait" onSelect={keepOpen}>Retrato</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="landscape" onSelect={keepOpen}>Paisagem</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="auto" onSelect={keepOpen}>Automática (pelas colunas)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run('print')}>
          <PrinterIcon />
          Imprimir
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run('pdf')}>
          <FileTextIcon />
          Baixar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run('csv')}>
          <FileSpreadsheetIcon />
          Baixar CSV (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const EXPORT_DONE: Record<ExportKind, string> = {
  print: 'Abrindo a impressão.',
  pdf: 'PDF gerado.',
  csv: 'CSV gerado.',
}
