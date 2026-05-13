import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const log = logger.child({ module: 'ErrorBoundary' })

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('render_error', error, {
      componentStack: errorInfo.componentStack ?? undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-[#1D1D1F]">
          <div className="max-w-md text-center px-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-500 dark:text-red-400">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v4M10 13v0" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-[#F5F5F5] mb-2">
              Something went wrong
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-[#98989D] mb-6">
              An unexpected error occurred. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-gray-900 dark:bg-[#F5F5F5] dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-[#E5E5EA] transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
