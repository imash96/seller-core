import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { renderIconOrNode } from './icon-avatar'

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  trailingAddon?: ReactNode
  onClear?: () => void
  fullWidth?: boolean
}

export function AppInput({
  label,
  hint,
  error,
  icon,
  trailingAddon,
  onClear,
  fullWidth = true,
  className = '',
  id,
  ...rest
}: AppInputProps) {
  const leadingIcon = renderIconOrNode(icon, 'w-4 h-4 text-input-placeholder shrink-0')

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-foreground-secondary tracking-wide"
        >
          {label}
          {rest.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="absolute left-3 pointer-events-none flex items-center">
            {leadingIcon}
          </span>
        )}
        <input
          id={id}
          className={`h-9 w-full rounded-xl border bg-input-background text-input-text placeholder:text-input-placeholder text-xs sm:text-sm transition-colors focus:outline-none focus:border-input-border-focus focus:ring-2 focus:ring-ring/25 disabled:bg-muted disabled:text-text-disabled ${
            leadingIcon ? 'pl-9' : 'px-3'
          } ${onClear || trailingAddon ? 'pr-9' : 'pr-3'} ${
            error
              ? 'border-error focus:border-error'
              : 'border-input-border hover:border-input-border-hover'
          } ${className}`}
          {...rest}
        />
        {onClear && rest.value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Clear input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : trailingAddon ? (
          <span className="absolute right-3 text-xs text-muted-foreground">{trailingAddon}</span>
        ) : null}
      </div>
      {error ? (
        <span className="text-[11px] font-medium text-error">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

export interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  maxChars?: number
  fullWidth?: boolean
}

export function AppTextarea({
  label,
  hint,
  error,
  maxChars,
  fullWidth = true,
  className = '',
  id,
  value,
  ...rest
}: AppTextareaProps) {
  const charCount = typeof value === 'string' ? value.length : 0

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {(label || maxChars) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-semibold text-foreground-secondary tracking-wide"
            >
              {label}
              {rest.required && <span className="text-error ml-0.5">*</span>}
            </label>
          )}
          {maxChars && (
            <span
              className={`text-[11px] font-mono ${
                charCount > maxChars ? 'text-error font-semibold' : 'text-muted-foreground'
              }`}
            >
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      )}
      <textarea
        id={id}
        value={value}
        className={`w-full rounded-xl border bg-input-background text-input-text placeholder:text-input-placeholder px-3 py-2 text-xs sm:text-sm transition-colors focus:outline-none focus:border-input-border-focus focus:ring-2 focus:ring-ring/25 ${
          error ? 'border-error' : 'border-input-border hover:border-input-border-hover'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <span className="text-[11px] font-medium text-error">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

export interface AppSelectOption {
  value: string
  label: string
}

export interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options?: AppSelectOption[]
  fullWidth?: boolean
  children?: ReactNode
}

export function AppSelect({
  label,
  hint,
  error,
  options,
  fullWidth = true,
  className = '',
  id,
  children,
  ...rest
}: AppSelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-foreground-secondary tracking-wide"
        >
          {label}
          {rest.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`h-9 w-full rounded-xl border bg-input-background text-input-text px-3 text-xs sm:text-sm transition-colors focus:outline-none focus:border-input-border-focus focus:ring-2 focus:ring-ring/25 ${
          error ? 'border-error' : 'border-input-border hover:border-input-border-hover'
        } ${className}`}
        {...rest}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <span className="text-[11px] font-medium text-error">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}
