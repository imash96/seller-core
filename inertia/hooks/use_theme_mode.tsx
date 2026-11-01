import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/app/astryx_themes'
import { getCookie } from '~/lib/cookies'

export type ThemeMode = 'light' | 'dark'

interface ThemeModeContextValue {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  isDark: false,
  setMode: () => {},
  toggleMode: () => {},
})

function detectInitialTheme(propTheme?: ThemeMode): ThemeMode {
  if (typeof document !== 'undefined') {
    const el = document.documentElement
    if (el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark') {
      return 'dark'
    }
    const cookieMatch = getCookie('app_theme')
    if (cookieMatch === 'dark' || cookieMatch === 'light') {
      return cookieMatch
    }
  }
  return propTheme === 'dark' ? 'dark' : 'light'
}

export function ThemeModeProvider({
  initialTheme,
  children,
}: {
  initialTheme?: ThemeMode
  children: ReactNode
}) {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    detectInitialTheme(initialPropTheme(initialTheme))
  )

  const applyDomTheme = useCallback((nextMode: ThemeMode) => {
    if (typeof document === 'undefined') return
    const isDark = nextMode === 'dark'
    const el = document.documentElement
    el.classList.toggle('dark', isDark)
    el.setAttribute('data-theme', nextMode)
    document.cookie = `app_theme=${nextMode}; path=/; max-age=31536000; SameSite=Lax`
  }, [])

  useEffect(() => {
    applyDomTheme(mode)
  }, [mode, applyDomTheme])

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode)
      applyDomTheme(nextMode)
    },
    [applyDomTheme]
  )

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyDomTheme(next)
      return next
    })
  }, [applyDomTheme])

  const ThemeAny = Theme as any

  return (
    <ThemeModeContext.Provider value={{ mode, isDark: mode === 'dark', setMode, toggleMode }}>
      <ThemeAny theme={themes[defaultThemeSlug]} mode={mode} colorScheme={mode}>
        {children}
      </ThemeAny>
    </ThemeModeContext.Provider>
  )
}

function initialPropTheme(val?: string): ThemeMode | undefined {
  return val === 'dark' || val === 'light' ? val : undefined
}

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
