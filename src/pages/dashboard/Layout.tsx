import { useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { currentUserEmail, isAuthenticated, logout } from '../../lib/storage'
import '../../styles/dashboard.css'

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const links = [
  { to: '/painel/visao-geral', label: 'Dashboard', end: true, icon: icon('M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10') },
  { to: '/painel/criancas', label: 'Crianças', icon: icon('M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-7 8-7s8 3 8 7') },
  { to: '/painel/pessoas', label: 'Quem ajuda', icon: icon('M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z') },
  { to: '/painel/doacoes', label: 'Doações', icon: icon('M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7C10 3 6 3 7 6c.6 1.6 3 1 5 1zM12 7c2-4 6-4 5-1-.6 1.6-3 1-5 1z') },
  { to: '/painel/relatorios', label: 'Relatórios', icon: icon('M4 20V10M10 20V4M16 20v-7M22 20H2') },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!isAuthenticated()) {
    return <Navigate to="/sistema" replace />
  }

  function handleLogout() {
    logout()
    navigate('/sistema')
  }

  return (
    <>
      <div className="demo-banner" role="note">
        MVP com dados mockados — alterações ficam só neste navegador (localStorage)
      </div>
      <div className="mobile-top">
        <strong>A.S.A.</strong>
        <button
          className="mobile-menu-btn"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Fechar' : 'Menu'}
        </button>
      </div>
      <nav id="menu-mobile" className={`mobile-nav${menuOpen ? ' is-open' : ''}`} aria-label="Menu mobile">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setMenuOpen(false)}>
            {l.label}
          </NavLink>
        ))}
        <NavLink to="/" onClick={() => setMenuOpen(false)}>
          ← Site público
        </NavLink>
        <button className="mobile-logout" type="button" onClick={handleLogout}>
          Sair
        </button>
      </nav>

      <div className="dash">
        <aside className="dash-side">
          <div className="dash-brand">
            <strong>A.S.A.</strong>
            <span>Semeando o Amanhã</span>
          </div>
          <nav className="dash-nav" aria-label="Menu">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                <span className="nav-label">{l.icon}{l.label}</span>
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
