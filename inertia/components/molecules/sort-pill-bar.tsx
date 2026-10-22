export function SortPillBar({
  columns,
  sortKey,
  sortDir,
  onSort,
}: {
  columns: Array<{ key: string; header: string }>
  sortKey: string | null
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
}) {
  const sortable = columns.filter((c) => c.key !== '__action').slice(0, 6)
  if (sortable.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        Sort by:
      </span>
      {sortable.map((c) => {
        const isSorted = sortKey === c.key
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onSort(c.key)}
            aria-pressed={isSorted}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              isSorted
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted font-medium'
            }`}
          >
            {c.header} {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
          </button>
        )
      })}
    </div>
  )
}
