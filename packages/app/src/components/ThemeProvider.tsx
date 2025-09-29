import { Theme, ThemeContext, ThemeContextState } from '@/lib/ThemeContext'
import { useEffect, useState } from 'react'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

// For a reference, see https://ui.shadcn.com/docs/dark-mode/vite
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.add(mediaQuery.matches ? 'dark' : 'light')

      const handleChange = (event: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark')
        root.classList.add(event.matches ? 'dark' : 'light')
      }

      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    root.classList.add(theme)
  }, [theme])

  const value: ThemeContextState = {
    theme,
    setTheme(theme: Theme) {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
