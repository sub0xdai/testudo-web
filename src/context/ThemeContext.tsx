import { createContext, useContext, useState, type ReactNode } from 'react'

const THEMES = ['amoled', 'light'] as const
type Theme = (typeof THEMES)[number]

interface ThemeContextValue {
  theme: Theme
  isLight: boolean
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): Theme {
  const stored = localStorage.getItem('testudo-theme')
  if (stored && THEMES.includes(stored as Theme)) return stored as Theme
  return 'amoled'
}

function applyTheme(theme: Theme) {
  localStorage.setItem('testudo-theme', theme)
  if (theme === 'amoled') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

const THEME_LABELS: Record<Theme, string> = {
  amoled: 'DARK',
  light: 'LIGHT',
}

export { THEME_LABELS }
export type { Theme }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  function cycleTheme() {
    const currentIndex = THEMES.indexOf(theme)
    const next = THEMES[(currentIndex + 1) % THEMES.length]
    setTheme(next)
    applyTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, isLight: theme === 'light', cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
