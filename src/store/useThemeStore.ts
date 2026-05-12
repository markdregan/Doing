import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggle: () => void
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('things-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),

  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('things-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },
}))
