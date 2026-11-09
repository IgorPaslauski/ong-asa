import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { Input } from '@/admin/components/ui/input'
import { Label } from '@/admin/components/ui/label'
import { isAuthenticated, login } from '@/lib/storage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@asa-condor.org.br')
  const [password, setPassword] = useState('asa2025')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.body.setAttribute('data-admin', '')
    document.title = 'Entrar — Instituto A.S.A.'
    return () => document.body.removeAttribute('data-admin')
  }, [])

  if (isAuthenticated()) return <Navigate to="/painel/visao-geral" replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const ok = login(email, password)
    if (!ok) {
      setError('Não foi possível entrar. Confira o e-mail e a senha (mínimo de 4 caracteres).')
      setBusy(false)
      return
    }
    navigate('/painel/visao-geral')
  }

  return (
    <div className="admin-root grid min-h-dvh place-items-center bg-background px-4 py-10">
      <main className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary text-xs font-bold tracking-wide text-primary-foreground">ASA</span>
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Sistema administrativo</h1>
            <p className="text-[13px] text-muted-foreground">Instituto A.S.A. · Condor/RS</p>
          </div>
        </div>
        <Card className="gap-4 p-5">
          <Alert variant="info">
            <AlertDescription>
              Demonstração: <strong>admin@asa-condor.org.br</strong> / <strong>asa2025</strong>. Os dados ficam só neste navegador.
            </AlertDescription>
          </Alert>
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={Boolean(error)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
            </div>
            {error ? (
              <p id="login-error" role="alert" className="text-[13px] font-medium text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2Icon className="animate-spin" /> : null}
              Entrar
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-[13px]">
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-3.5" />
            Voltar ao site
          </Link>
        </p>
      </main>
    </div>
  )
}
