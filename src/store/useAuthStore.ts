import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

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
    if (get().initialized) return

    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })

    set({ loading: false, initialized: true })
  },

  signInWithGithub: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, initialized: false })
  },
}))
