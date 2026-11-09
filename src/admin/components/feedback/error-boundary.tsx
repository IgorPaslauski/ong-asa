import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/admin/components/ui/button'

interface Props {
  children: ReactNode
  /** Quando muda (ex.: a rota), o erro é limpo. */
  resetKey?: string
}

/** Evita tela branca: mostra uma mensagem e permite tentar de novo. Os dados salvos não são tocados. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[admin] erro de renderização', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto mt-10 max-w-lg rounded-lg border bg-card p-6 text-center">
        <h2 className="text-base font-semibold">Não foi possível mostrar esta tela</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Ocorreu um erro inesperado. Seus dados salvos não foram alterados. Tente novamente ou volte para a visão geral.
        </p>
        <p className="mt-2 break-words font-mono text-xs text-muted-foreground">{this.state.error.message}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => this.setState({ error: null })}>Tentar de novo</Button>
          <Button onClick={() => { window.location.hash = '#/painel/visao-geral' }}>Visão geral</Button>
        </div>
      </div>
    )
  }
}
