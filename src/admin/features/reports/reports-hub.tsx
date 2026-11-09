import { Link } from 'react-router-dom'
import { ArrowRightIcon, BabyIcon, CalendarCheck2Icon, HandHeartIcon, HeartHandshakeIcon, LandmarkIcon, ReceiptIcon } from 'lucide-react'
import { Card } from '@/admin/components/ui/card'
import { PageHeader } from '@/admin/components/layout/page-header'

const REPORTS = [
  { to: 'doacoes', title: 'Doações', icon: HeartHandshakeIcon, text: 'Entradas por período, tipo e destinação. Separa dinheiro recebido de estimativas de bens e serviços.', formats: 'PDF · CSV' },
  { to: 'prestacao-de-contas', title: 'Prestação de contas', icon: ReceiptIcon, text: 'Dinheiro recebido, despesas pagas e saldo do período, com despesas por categoria.', formats: 'PDF · CSV' },
  { to: 'atendimentos', title: 'Atendimentos', icon: BabyIcon, text: 'Crianças e adolescentes por situação, faixa etária e bairro. Agregado, sem dados pessoais.', formats: 'PDF · CSV' },
  { to: 'atividades', title: 'Atividades', icon: CalendarCheck2Icon, text: 'Ações e oficinas realizadas, com participações por ano e por área.', formats: 'PDF · CSV' },
  { to: 'rede-de-apoio', title: 'Rede de apoio', icon: HandHeartIcon, text: 'Doadores, voluntários, padrinhos e parceiros e quanto cada um contribuiu no período.', formats: 'PDF · CSV' },
  { to: 'institucional', title: 'Resumo institucional', icon: LandmarkIcon, text: 'Visão anual consolidada: doações, ações, entradas de crianças e de apoiadores.', formats: 'PDF · CSV' },
]

export default function ReportsHub() {
  return (
    <div>
      <PageHeader title="Relatórios" description="Escolha um assunto. Todos seguem o mesmo padrão: período, filtros, resumo, gráficos, tabela detalhada, metodologia e exportação." />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <li key={r.to}>
            <Link to={r.to} className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full gap-2 p-4 transition-colors group-hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-md bg-sidebar-accent text-primary">
                    <r.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
                <h2 className="text-[15px] font-semibold">{r.title}</h2>
                <p className="text-[13px] text-muted-foreground">{r.text}</p>
                <p className="mt-auto pt-1 text-xs text-muted-foreground">Exporta: {r.formats}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
