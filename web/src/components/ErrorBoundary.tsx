import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  error: Error | null
}

// Minimal class-component error boundary — catches render/effect errors from
// descendants so a single broken tab doesn't white-screen the whole app.
// No external dependency; React doesn't provide a hook-based equivalent yet.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the browser console — dev-time visibility matters more here
    // than fancy reporting in a personal app.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="error-fallback">
          <h3>Something went wrong</h3>
          <pre>{this.state.error.message}</pre>
          <button type="button" className="pill pill--small" onClick={this.reset}>
            Try again
          </button>
          <p className="note">
            Full stack trace is in the browser console (F12). If this keeps
            happening, file it with the last few steps you did.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
