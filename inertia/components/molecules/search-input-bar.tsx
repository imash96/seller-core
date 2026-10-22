import { Search, X } from 'lucide-react'

export function SearchInputBar({
  value,
  onChange,
  placeholder = 'Search records…',
  className = '',
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative flex-1 min-w-[200px] max-w-md ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
        <Search className="w-4 h-4" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
