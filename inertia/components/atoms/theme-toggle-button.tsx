import { Sun, Moon } from 'lucide-react'
import { useThemeMode } from '~/hooks/use_theme_mode'

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { isDark, toggleMode } = useThemeMode()

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={`inline-flex items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ${className}`}
      aria-label="Toggle color theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
