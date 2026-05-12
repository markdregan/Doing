import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('things-theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  const initialTheme = getInitialTheme()
  const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme
  applyTheme(initialResolved)

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemChange = () => {
    if (get().theme === 'system') {
      const resolved = getSystemTheme()
      applyTheme(resolved)
      set({ resolvedTheme: resolved })
    }
  }
  mediaQuery.addEventListener('change', handleSystemChange)

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (next: Theme) => {
      localStorage.setItem('things-theme', next)
      const resolved = next === 'system' ? getSystemTheme() : next
      applyTheme(resolved)
      set({ theme: next, resolvedTheme: resolved })
    },

    toggle: () => {
      const currentResolved = get().resolvedTheme
      const next = currentResolved === 'light' ? 'dark' : 'light'
      localStorage.setItem('things-theme', next)
      applyTheme(next)
      set({ theme: next, resolvedTheme: next })
    },
  }
})
