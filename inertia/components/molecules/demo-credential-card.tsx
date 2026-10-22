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
      className={`demo-card ${isActive ? 'demo-card--active' : ''}`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`demo-card__icon demo-card__icon--${variant}`}>
            {variant === 'admin' ? (
              <Crown className="w-4 h-4 text-white" />
            ) : (
              <UserCheck className="w-4 h-4 text-white" />
            )}
          </span>
          <span className="text-xs font-bold text-foreground">{roleTitle}</span>
        </div>
        <span className="text-xs text-muted-foreground truncate">{email}</span>
        <span className="font-mono text-[11px] text-foreground/85 bg-muted px-1.5 py-0.5 rounded w-fit">
          {password}
        </span>
      </div>
    </button>
  )
}
