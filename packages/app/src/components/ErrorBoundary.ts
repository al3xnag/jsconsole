import { Component, ErrorInfo } from 'react'

type ErrorBoundaryProps = {
  fallback: React.ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback
    }

    return this.props.children
  }
}
