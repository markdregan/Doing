import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './useAuthStore'

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    getSession: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: { auth: mockAuth },
}))

beforeEach(() => {
  useAuthStore.setState({ user: null, session: null, loading: true, initialized: false })
  vi.clearAllMocks()
})

describe('initialize', () => {
  it('restores session and sets initialized', async () => {
    const fakeUser = { id: 'u1', email: 'test@test.com' }
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: fakeUser } } })

    await useAuthStore.getState().initialize()

    const state = useAuthStore.getState()
    expect(state.initialized).toBe(true)
    expect(state.loading).toBe(false)
    expect(state.user?.id).toBe('u1')
    expect(mockAuth.onAuthStateChange).toHaveBeenCalledOnce()
  })

  it('handles no session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })

    await useAuthStore.getState().initialize()

    const state = useAuthStore.getState()
    expect(state.initialized).toBe(true)
    expect(state.loading).toBe(false)
    expect(state.user).toBeNull()
  })

  it('skips if already initialized', async () => {
    useAuthStore.setState({ initialized: true, loading: false })

    await useAuthStore.getState().initialize()

    expect(mockAuth.getSession).not.toHaveBeenCalled()
  })
})

describe('signInWithGithub', () => {
  it('calls signInWithOAuth', async () => {
    await useAuthStore.getState().signInWithGithub()
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
  })
})

describe('signOut', () => {
  it('calls signOut and clears state', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, session: {} as never })
    mockAuth.signOut.mockResolvedValue({ error: null })

    await useAuthStore.getState().signOut()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.initialized).toBe(false)
    expect(mockAuth.signOut).toHaveBeenCalledOnce()
  })
})
