import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PaginationBar({
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalRecords: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between sm:justify-center gap-3 py-2 flex-wrap">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-45 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Prev</span>
      </button>

      <span className="text-xs text-muted-foreground bg-muted/60 border border-border rounded-full px-3.5 py-1.5 whitespace-nowrap">
        Page <strong className="text-foreground font-semibold">{currentPage}</strong> of{' '}
        <strong className="text-foreground font-semibold">{totalPages}</strong> · {totalRecords}{' '}
        records
      </span>

      {totalPages > 2 && (
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const n = i + 1 + Math.max(0, currentPage - 3)
            if (n > totalPages) return null
            const active = n === currentPage
            return (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                className={`min-w-8 h-8 px-2 rounded-full border text-xs transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted font-medium'
                }`}
              >
                {n}
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-45 disabled:pointer-events-none transition-colors"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
