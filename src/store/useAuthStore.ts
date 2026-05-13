import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { logger as parentLogger } from '../lib/logger'
import type { User, Session } from '@supabase/supabase-js'

const log = parentLogger.child({ module: 'useAuthStore' })

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) {
      log.debug('initialize_already_initialized')
      return
    }

    log.info('initialize_start')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const hasSession = !!session
      log.info('get_session_result', { hasSession, userId: session?.user?.id })

      set({ session, user: session?.user ?? null })

      supabase.auth.onAuthStateChange((event, session) => {
        log.info('auth_state_change', { event, userId: session?.user?.id })
        set({ session, user: session?.user ?? null })
      })

      set({ loading: false, initialized: true })
      log.info('initialize_complete', { hasSession })
    } catch (err) {
      log.error('initialize_failed', err)
      set({ loading: false, initialized: true })
    }
  },

  signInWithGithub: async () => {
    log.info('sign_in_with_github')
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin },
      })
    } catch (err) {
      log.error('sign_in_failed', err)
    }
  },

  signOut: async () => {
    log.info('sign_out')
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, initialized: false })
      log.info('sign_out_complete')
    } catch (err) {
      log.error('sign_out_failed', err)
    }
  },
}))
