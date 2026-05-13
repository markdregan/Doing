import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import EmptyState from './EmptyState'

afterEach(() => cleanup())

describe('EmptyState', () => {
  it('shows trash message', () => {
    render(<EmptyState view="trash" />)
    expect(screen.getByText('Trash is empty')).toBeInTheDocument()
  })

  it('shows logbook message', () => {
    render(<EmptyState view="logbook" />)
    expect(screen.getByText('No completed tasks yet')).toBeInTheDocument()
    expect(screen.getByText('Check off a task and it will appear here')).toBeInTheDocument()
  })

  it('shows fallback message for unknown view', () => {
    render(<EmptyState view="home" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})
