import { Badge, type BadgeVariant } from '@/admin/components/ui/badge'
import {
  DONATION_STATUS_LABEL,
  DONATION_TYPE_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  type ChildStatus,
  type DonationStatus,
  type DonationType,
  type HelperRole,
} from '@/data/mock'
import { DONATION_TYPE_COLOR, HELPER_ROLE_COLOR } from '@/admin/components/charts/palette'

const CHILD: Record<ChildStatus, BadgeVariant> = { ativo: 'success', acompanhamento: 'warning', concluido: 'muted' }
const DONATION: Record<DonationStatus, BadgeVariant> = { confirmada: 'success', pendente: 'warning', cancelada: 'muted' }

export function ChildStatusBadge({ status }: { status: ChildStatus }) {
  return <Badge variant={CHILD[status]}>{STATUS_LABEL[status]}</Badge>
}
export function DonationStatusBadge({ status }: { status: DonationStatus }) {
  return <Badge variant={DONATION[status]}>{DONATION_STATUS_LABEL[status]}</Badge>
}
export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'muted'}>{active ? 'Ativo' : 'Inativo'}</Badge>
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: color }} />
}
export function DonationTypeTag({ type }: { type: DonationType }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Dot color={DONATION_TYPE_COLOR[type]} />
      {DONATION_TYPE_LABEL[type]}
    </span>
  )
}
export function RoleTag({ role }: { role: HelperRole }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Dot color={HELPER_ROLE_COLOR[role]} />
      {ROLE_LABEL[role]}
    </span>
  )
}
