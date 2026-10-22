import { router } from '@inertiajs/react'
import { Bookmark, X } from 'lucide-react'

export function SavedViewsBar({
  views,
}: {
  views: Array<Record<string, any>>
  moduleKey?: string
}) {
  if (!views || views.length === 0) return null

  return (
    <div className="bg-muted/40 border border-border rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
        <Bookmark className="w-3.5 h-3.5 text-primary" />
        <span>Saved views:</span>
      </div>
      {views.map((v) => (
        <div
          key={String(v.id)}
          className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-foreground shadow-2xs"
        >
          <span>{String(v.name)}</span>
          {v.moduleKey && (
            <span className="text-[10px] uppercase text-muted-foreground font-mono">
              ({String(v.moduleKey)})
            </span>
          )}
          <button
            type="button"
            title={`Remove saved view ${String(v.name)}`}
            onClick={() =>
              router.post(`/saved-views/${v.id}/delete`, {}, { preserveScroll: true })
            }
            className="w-4 h-4 rounded-full hover:bg-rose-500/15 text-muted-foreground hover:text-rose-600 inline-flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
