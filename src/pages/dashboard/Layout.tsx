import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { currentUserEmail, isAuthenticated, logout } from '../../lib/storage'
import '../../styles/dashboard.css'

const links = [
  { to: '/painel/visao-geral', label: 'Visão geral', end: true },
  { to: '/painel/criancas', label: 'Crianças' },
  { to: '/painel/pessoas', label: 'Quem ajuda' },
  { to: '/painel/doacoes', label: 'Doações' },
  { to: '/painel/relatorios', label: 'Relatórios' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()

  if (!isAuthenticated()) {
    return <Navigate to="/sistema" replace />
  }

  function handleLogout() {
    logout()
    navigate('/sistema')
  }

  return (
    <>
      <div className="demo-banner">
        MVP com dados mockados — alterações ficam só neste navegador (localStorage)
      </div>
      <div className="mobile-top">
        <strong>ASA</strong>
        <button className="btn btn-ghost btn-sm" type="button" onClick={handleLogout}>
          Sair
        </button>
      </div>
      <nav className="mobile-nav" aria-label="Menu mobile">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="dash">
        <aside className="dash-side">
          <div className="dash-brand">
            <strong>ASA</strong>
            <span>Painel interno</span>
          </div>
          <nav className="dash-nav" aria-label="Menu">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="dash-side-foot">
            <div className="user">{currentUserEmail()}</div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={handleLogout}>
              Sair
            </button>
            <NavLink to="/" style={{ fontSize: '0.85rem', opacity: 0.75 }}>
              ← Site público
            </NavLink>
          </div>
        </aside>
        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </>
  )
}
