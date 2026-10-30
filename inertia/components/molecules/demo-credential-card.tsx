import { Crown, UserCheck } from 'lucide-react'

export function DemoCredentialCard({
  roleTitle,
  email,
  password,
  variant,
  isActive,
  onSelect,
}: {
  roleTitle: string
  email: string
  password: string
  variant: 'admin' | 'ops'
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-primary-subtle/40 border-primary ring-2 ring-primary/20 shadow-xs'
          : 'bg-surface hover:bg-surface-hover border-border'
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              variant === 'admin'
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground'
            }`}
          >
            {variant === 'admin' ? (
              <Crown className="w-3.5 h-3.5 text-inherit" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-inherit" />
            )}
          </span>
          <span className="text-xs font-semibold text-foreground">{roleTitle}</span>
        </div>
        <span className="text-xs text-muted-foreground truncate">{email}</span>
        <span className="font-mono text-[11px] text-foreground/85 bg-muted px-1.5 py-0.5 rounded w-fit">
          {password}
        </span>
      </div>
    </button>
  )
}
