import createRequiredContext from './createRequiredContext'

export type Theme = 'system' | 'light' | 'dark'

export type ThemeContextState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createRequiredContext<ThemeContextState>()
