import './admin.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/layout/admin-layout'
import ChildrenPage from './features/children/children-page'
import DashboardPage from './features/dashboard/dashboard-page'
import DonationsPage from './features/donations/donations-page'
import PeoplePage from './features/people/people-page'
import { ActivitiesReport, InstitutionalReport, ServiceReport, SupportReport } from './features/reports/other-reports'
import DonationsReport from './features/reports/donations-report'
import ReportsHub from './features/reports/reports-hub'
import SettingsPage from './features/settings/settings-page'

/** Painel administrativo (carregado sob demanda; o CSS do admin só entra com este módulo). */
export default function AdminPanel() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="visao-geral" replace />} />
        <Route path="visao-geral" element={<DashboardPage />} />
        <Route path="criancas" element={<ChildrenPage />} />
        <Route path="pessoas" element={<PeoplePage />} />
        <Route path="doacoes" element={<DonationsPage />} />
        <Route path="relatorios" element={<ReportsHub />} />
        <Route path="relatorios/doacoes" element={<DonationsReport />} />
        <Route path="relatorios/atendimentos" element={<ServiceReport />} />
        <Route path="relatorios/atividades" element={<ActivitiesReport />} />
        <Route path="relatorios/rede-de-apoio" element={<SupportReport />} />
        <Route path="relatorios/institucional" element={<InstitutionalReport />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/painel/visao-geral" replace />} />
      </Route>
    </Routes>
  )
}
