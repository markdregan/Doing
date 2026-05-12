import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './useThemeStore'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  useThemeStore.getState().setTheme('light')
})

describe('initial theme', () => {
  it('can set system theme', () => {
    useThemeStore.getState().setTheme('system')
    const store = useThemeStore.getState()
    expect(store.theme).toBe('system')
    expect(store.resolvedTheme).toBe('light')
  })
})

describe('setTheme', () => {
  it('sets light theme', () => {
    useThemeStore.getState().setTheme('light')
    const store = useThemeStore.getState()
    expect(store.theme).toBe('light')
    expect(store.resolvedTheme).toBe('light')
    expect(localStorage.getItem('things-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('sets dark theme', () => {
    useThemeStore.getState().setTheme('dark')
    const store = useThemeStore.getState()
    expect(store.theme).toBe('dark')
    expect(store.resolvedTheme).toBe('dark')
    expect(localStorage.getItem('things-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('sets system theme', () => {
    useThemeStore.getState().setTheme('system')
    const store = useThemeStore.getState()
    expect(store.theme).toBe('system')
    expect(localStorage.getItem('things-theme')).toBe('system')
  })
})

describe('toggle', () => {
  it('switches from light to dark', () => {
    useThemeStore.getState().setTheme('light')
    useThemeStore.getState().toggle()
    const store = useThemeStore.getState()
    expect(store.theme).toBe('dark')
    expect(store.resolvedTheme).toBe('dark')
    expect(localStorage.getItem('things-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches from dark to light', () => {
    useThemeStore.getState().setTheme('dark')
    useThemeStore.getState().toggle()
    const store = useThemeStore.getState()
    expect(store.theme).toBe('light')
    expect(store.resolvedTheme).toBe('light')
    expect(localStorage.getItem('things-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists to localStorage', () => {
    useThemeStore.getState().setTheme('light')
    useThemeStore.getState().toggle()
    expect(localStorage.getItem('things-theme')).toBe('dark')
    useThemeStore.getState().toggle()
    expect(localStorage.getItem('things-theme')).toBe('light')
  })
})
