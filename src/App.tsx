import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ChildrenPage from './pages/dashboard/ChildrenPage'
import DonationsPage from './pages/dashboard/DonationsPage'
import HelpersPage from './pages/dashboard/HelpersPage'
import DashboardLayout from './pages/dashboard/Layout'
import Overview from './pages/dashboard/Overview'
import ReportsPage from './pages/dashboard/ReportsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sistema" element={<Login />} />
        <Route path="/painel" element={<DashboardLayout />}>
          <Route index element={<Navigate to="visao-geral" replace />} />
          <Route path="visao-geral" element={<Overview />} />
          <Route path="criancas" element={<ChildrenPage />} />
          <Route path="pessoas" element={<HelpersPage />} />
          <Route path="doacoes" element={<DonationsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
