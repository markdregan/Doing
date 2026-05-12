import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './useThemeStore'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  useThemeStore.setState({ theme: 'light' })
})

describe('initial theme', () => {
  it('defaults to light with no stored preference', () => {
    expect(useThemeStore.getState().theme).toBe('light')
  })
})

describe('toggle', () => {
  it('switches from light to dark', () => {
    useThemeStore.setState({ theme: 'light' })
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('things-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches from dark to light', () => {
    useThemeStore.setState({ theme: 'dark' })
    document.documentElement.classList.add('dark')
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem('things-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists to localStorage', () => {
    useThemeStore.getState().toggle()
    expect(localStorage.getItem('things-theme')).toBe('dark')
    useThemeStore.getState().toggle()
    expect(localStorage.getItem('things-theme')).toBe('light')
  })
})
