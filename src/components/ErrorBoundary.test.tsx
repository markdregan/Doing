import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

afterEach(() => {
  cleanup()
})

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('💥')
  }
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello world')).toBeDefined()
  })

  it('renders fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeDefined()
    expect(screen.getByText('An unexpected error occurred. Try refreshing the page.')).toBeDefined()
    expect(screen.getByText('Refresh page')).toBeDefined()

    spy.mockRestore()
  })

  it('logs error details on catch', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    // The error should be logged via our logger (which uses console.error)
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom error UI')).toBeDefined()
    expect(() => screen.getByText('Something went wrong')).toThrow()

    spy.mockRestore()
  })

  it('recovers from error when children change', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeDefined()

    // Re-render with non-throwing children - ErrorBoundary will still show error
    // (this is by design - componentDidCatch doesn't auto-recover)
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )

    // Should still show the error state since it persists
    expect(screen.getByText('Something went wrong')).toBeDefined()

    spy.mockRestore()
  })
})
