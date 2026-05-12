import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AuthPage from './AuthPage'
import { useAuthStore } from '../store/useAuthStore'

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}))

const mockSignInWithGithub = vi.fn()

function mockAuthState(overrides: Record<string, unknown> = {}) {
  const defaultState = {
    user: null,
    loading: true,
    initialized: false,
    signInWithGithub: mockSignInWithGithub,
  }
  vi.mocked(useAuthStore).mockReturnValue({ ...defaultState, ...overrides })
}

afterEach(() => cleanup())

beforeEach(() => {
  vi.clearAllMocks()
})

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  )
}

describe('AuthPage', () => {
  it('shows loading spinner while initializing', () => {
    mockAuthState({ loading: true, initialized: false })
    renderWithRouter()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders sign in button when loaded', () => {
    mockAuthState({ loading: false, initialized: true, user: null })
    renderWithRouter()
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
  })

  it('calls signInWithGithub on button click', async () => {
    const user = userEvent.setup()
    mockAuthState({ loading: false, initialized: true, user: null })
    renderWithRouter()
    await user.click(screen.getByText('Continue with GitHub'))
    expect(mockSignInWithGithub).toHaveBeenCalledOnce()
  })
})
