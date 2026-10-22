import { LayoutGrid, Table2, Sparkles } from 'lucide-react'

export type ViewModeOption = 'auto' | 'table' | 'cards'

export function ViewModeSwitcher({
  value,
  onChange,
}: {
  value: ViewModeOption
  onChange: (mode: ViewModeOption) => void
}) {
  const options: Array<{ mode: ViewModeOption; label: string; icon: typeof LayoutGrid }> = [
    { mode: 'cards', label: 'Cards', icon: LayoutGrid },
    { mode: 'table', label: 'Table', icon: Table2 },
    { mode: 'auto', label: 'Auto', icon: Sparkles },
  ]

  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex items-center p-0.5 rounded-xl border border-border bg-muted"
    >
      {options.map((opt) => {
        const Icon = opt.icon
        const active = value === opt.mode
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onChange(opt.mode)}
            aria-pressed={active}
            title={opt.label}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              active
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
