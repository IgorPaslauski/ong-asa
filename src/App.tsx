import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'

// O sistema administrativo (e seu CSS) é carregado sob demanda: o site público não paga por ele.
const AdminPanel = lazy(() => import('./admin/panel'))
const AdminLogin = lazy(() => import('./admin/login'))

function Loading() {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: '#5b6778', font: '14px Inter, system-ui, sans-serif' }}>
      Carregando…
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sistema" element={<AdminLogin />} />
          <Route path="/painel/*" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
