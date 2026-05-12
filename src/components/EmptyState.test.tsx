import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import EmptyState from './EmptyState'

afterEach(() => cleanup())

describe('EmptyState', () => {
  it('shows inbox message', () => {
    render(<EmptyState view="inbox" />)
    expect(screen.getByText('No tasks in your inbox')).toBeInTheDocument()
    expect(screen.getByText('Add a task below or press ⌘K')).toBeInTheDocument()
  })

  it('shows today message', () => {
    render(<EmptyState view="today" />)
    expect(screen.getByText('No tasks for today')).toBeInTheDocument()
    expect(screen.getByText('Add a task below or press ⌘K')).toBeInTheDocument()
  })

  it('shows someday message', () => {
    render(<EmptyState view="someday" />)
    expect(screen.getByText('No tasks set for someday')).toBeInTheDocument()
    expect(screen.getByText('Toggle the crescent moon on a task to set it as someday')).toBeInTheDocument()
  })

  it('shows all tasks message', () => {
    render(<EmptyState view="all" />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first task below')).toBeInTheDocument()
  })

  it('shows project message', () => {
    render(<EmptyState view="project" />)
    expect(screen.getByText('No tasks in this project')).toBeInTheDocument()
    expect(screen.getByText('Add a task below')).toBeInTheDocument()
  })

  it('shows trash message', () => {
    render(<EmptyState view="trash" />)
    expect(screen.getByText('Trash is empty')).toBeInTheDocument()
  })

  it('shows logbook message', () => {
    render(<EmptyState view="logbook" />)
    expect(screen.getByText('No completed tasks yet')).toBeInTheDocument()
    expect(screen.getByText('Tasks you complete will appear here')).toBeInTheDocument()
  })
})
