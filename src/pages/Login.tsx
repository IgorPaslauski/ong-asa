import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isAuthenticated, login } from '../lib/storage'
import '../styles/dashboard.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@ongasa.org.br')
  const [password, setPassword] = useState('asa2025')
  const [error, setError] = useState('')

  if (isAuthenticated()) {
    return <Navigate to="/painel/visao-geral" replace />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = login(email, password)
    if (!ok) {
      setError('Não foi possível entrar. Use as credenciais de demonstração.')
      return
    }
    navigate('/painel/visao-geral')
  }

  return (
    <div className="login-page">
      <div className="login-card anim-in">
        <div className="brand-mark">ASA</div>
        <h1>Painel da equipe</h1>
        <p className="muted">Acesse o sistema de cadastros e relatórios.</p>
        <div className="hint">
          Demo: <strong>admin@ongasa.org.br</strong> / <strong>asa2025</strong>
          <br />
          Ou qualquer e-mail e senha com 4+ caracteres.
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p> : null}
          <button className="btn btn-dark" type="submit">
            Entrar
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/">← Voltar ao site</Link>
        </p>
      </div>
    </div>
  )
}
