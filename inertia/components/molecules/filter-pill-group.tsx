export type FilterPill = { value: string; label: string }

export function FilterPillGroup({
  pills,
  activeValue,
  onSelect,
  getCount,
}: {
  pills: FilterPill[]
  activeValue: string
  onSelect: (value: string) => void
  getCount?: (value: string) => number
}) {
  if (!pills || pills.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {pills.map((pill) => {
        const isActive = activeValue === pill.value
        const count = getCount ? getCount(pill.value) : undefined
        return (
          <button
            key={pill.value}
            type="button"
            onClick={() => onSelect(pill.value)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            <span>{pill.label}</span>
            {count !== undefined && (
              <span
                className={`text-[11px] font-medium px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
