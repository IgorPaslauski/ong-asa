import { useEffect, useState, type FormEvent } from 'react'
import logoUrl from '@/assets/logo-asa.png'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { Alert, AlertDescription } from '@/admin/components/ui/alert'
import { Button } from '@/admin/components/ui/button'
import { Card } from '@/admin/components/ui/card'
import { Input } from '@/admin/components/ui/input'
import { Label } from '@/admin/components/ui/label'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, HOME_BY_ROLE, ROLE_NAME, getSessionUser, login } from '@/lib/auth'

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

  const logged = getSessionUser()
  if (logged) return <Navigate to={HOME_BY_ROLE[logged.perfil]} replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const result = login(email, password)
    if (!result.ok) {
      setError(result.reason === 'inactive' ? 'Esta conta está desativada. Fale com a administração do Instituto.' : 'Não foi possível entrar. Confira o e-mail e a senha.')
      setBusy(false)
      return
    }
    navigate(HOME_BY_ROLE[result.user.perfil])
  }

  return (
    <div className="admin-root grid min-h-dvh place-items-center bg-background px-4 py-10">
      <main className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src={logoUrl} alt="" aria-hidden="true" width={48} height={48} className="size-12 rounded-full" />
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Sistema administrativo</h1>
            <p className="text-[13px] text-muted-foreground">Instituto A.S.A. · Condor/RS</p>
          </div>
        </div>
        <Card className="gap-4 p-5">
          <Alert variant="info">
            <AlertDescription>
              <span className="block">Demonstração: escolha um perfil para testar. Senha de todos: <strong>{DEMO_PASSWORD}</strong>. Os dados ficam só neste navegador.</span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    className="rounded-md border bg-background px-2 py-1 text-xs font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      setEmail(a.email)
                      setPassword(DEMO_PASSWORD)
                      setError('')
                    }}
                  >
                    {ROLE_NAME[a.perfil]}
                  </button>
                ))}
              </span>
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
