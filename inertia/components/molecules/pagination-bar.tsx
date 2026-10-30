import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface PaginationBarProps {
  currentPage: number
  totalPages: number
  totalRecords: number
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
  className = '',
}: PaginationBarProps) {
  if (totalPages <= 1 && totalRecords <= 0) return null

  const startRecord = pageSize ? Math.min((currentPage - 1) * pageSize + 1, totalRecords) : 1
  const endRecord = pageSize ? Math.min(currentPage * pageSize, totalRecords) : totalRecords

  // Generate windowed page numbers
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`px-4 py-3 rounded-2xl border border-card-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs select-none ${className}`}
    >
      {/* Left Summary & Page Size */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-center sm:justify-start">
        <span>
          Showing{' '}
          <strong className="text-foreground font-semibold tabular-nums">{startRecord}</strong> to{' '}
          <strong className="text-foreground font-semibold tabular-nums">{endRecord}</strong> of{' '}
          <strong className="text-foreground font-semibold tabular-nums">{totalRecords}</strong>{' '}
          {totalRecords === 1 ? 'record' : 'records'}
        </span>

        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            <span className="text-[11px]">Show</span>
            <select
              aria-label="Items per page"
              value={pageSize ?? pageSizeOptions[0]}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 rounded-lg border border-input-border bg-surface text-foreground text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Windowed Page Numbers */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-xs text-muted-foreground select-none"
                >
                  …
                </span>
              )
            }
            const active = p === currentPage
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground border border-primary font-bold shadow-2xs'
                    : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export const AppPagination = PaginationBar
