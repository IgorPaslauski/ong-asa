import './admin.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/layout/admin-layout'
import CampaignsPage from './features/campaigns/campaigns-page'
import CommunicationPage from './features/communication/communication-page'
import ExpensesPage from './features/expenses/expenses-page'
import FamiliesPage from './features/families/families-page'
import GoalsPage from './features/goals/goals-page'
import ShiftsPage, { MyShiftsPage } from './features/shifts/shifts-page'
import StockPage from './features/stock/stock-page'
import ActivitiesPage from './features/activities/activities-page'
import VolunteerHomePage from './features/me/volunteer-home-page'
import MyDonationsPage from './features/me/my-donations-page'
import UsersPage from './features/users/users-page'
import ChildrenPage from './features/children/children-page'
import DashboardPage from './features/dashboard/dashboard-page'
import DonationsPage from './features/donations/donations-page'
import EventsPage from './features/events/events-page'
import PeoplePage from './features/people/people-page'
import { ActivitiesReport, InstitutionalReport, ServiceReport, SupportReport } from './features/reports/other-reports'
import AccountsReport from './features/reports/accounts-report'
import DonationsReport from './features/reports/donations-report'
import ReportsHub from './features/reports/reports-hub'
import SettingsPage from './features/settings/settings-page'
import VolunteersPage from './features/volunteers/volunteers-page'

/** Painel administrativo (carregado sob demanda; o CSS do admin só entra com este módulo). */
export default function AdminPanel() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="visao-geral" replace />} />
        <Route path="visao-geral" element={<DashboardPage />} />
        <Route path="criancas" element={<ChildrenPage />} />
        <Route path="pessoas" element={<PeoplePage />} />
        <Route path="voluntarios" element={<VolunteersPage />} />
        <Route path="doacoes" element={<DonationsPage />} />
        <Route path="atividades" element={<ActivitiesPage />} />
        <Route path="despesas" element={<ExpensesPage />} />
        <Route path="familias" element={<FamiliesPage />} />
        <Route path="escala" element={<ShiftsPage />} />
        <Route path="minha-escala" element={<MyShiftsPage />} />
        <Route path="estoque" element={<StockPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="campanhas" element={<CampaignsPage />} />
        <Route path="comunicacao" element={<CommunicationPage />} />
        <Route path="inicio" element={<VolunteerHomePage />} />
        <Route path="minhas-doacoes" element={<MyDonationsPage />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="eventos" element={<EventsPage />} />
        <Route path="relatorios" element={<ReportsHub />} />
        <Route path="relatorios/prestacao-de-contas" element={<AccountsReport />} />
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
