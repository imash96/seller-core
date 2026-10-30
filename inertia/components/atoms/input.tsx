import {
  useState,
  useRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ComponentType,
  type ReactNode,
  type ChangeEvent,
  type FocusEvent,
} from 'react'
import { Eye, EyeOff, Search, X, ChevronDown, Plus, Minus } from 'lucide-react'
import { renderIconOrNode } from './icon-avatar'

export type AppInputSize = 'sm' | 'md' | 'lg'

export interface AppInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: string
  hint?: string
  error?: string
  inputSize?: AppInputSize
  icon?: any
  trailingIcon?: any
  prefixText?: string
  suffixText?: string
  currencySymbol?: string
  currencyCode?: string
  decimalPlaces?: number
  showStepper?: boolean
  onClear?: () => void
  showCount?: boolean
  fullWidth?: boolean
}

export function AppInput({
  label,
  hint,
  error,
  inputSize = 'md',
  type = 'text',
  icon,
  trailingIcon,
  prefixText,
  suffixText,
  currencySymbol = '$',
  currencyCode,
  decimalPlaces = 2,
  showStepper = false,
  onClear,
  showCount = false,
  fullWidth = true,
  className = '',
  id,
  value,
  onChange,
  onBlur,
  disabled,
  maxLength,
  min,
  max,
  step = 1,
  ...rest
}: AppInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPassword = type === 'password'
  const isSearch = type === 'search'
  const isCurrency = type === 'currency' || type === 'decimal'
  const isInteger = type === 'integer'
  const isPercentage = type === 'percentage'
  const isDate = type === 'date' || type === 'datetime-local'

  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type === 'currency' || type === 'decimal' || type === 'percentage' || type === 'integer' ? 'text' : type
  const resolvedInputMode = isCurrency || isPercentage ? 'decimal' : isInteger ? 'numeric' : rest.inputMode

  const heightCls =
    inputSize === 'sm' ? 'h-8.5 text-xs' : inputSize === 'lg' ? 'h-11 text-sm' : 'h-10 text-xs sm:text-sm'

  const leadingIconNode = isSearch
    ? <Search className="w-4 h-4 text-input-placeholder shrink-0" />
    : renderIconOrNode(icon, 'w-4 h-4 text-input-placeholder shrink-0')

  const currencyBadge = currencyCode || currencySymbol

  const handleCurrencyChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    // Allow digits, single decimal point, optional leading negative
    val = val.replace(/[^0-9.-]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    if (onChange) {
      const syntheticEvent = { ...e, target: { ...e.target, value: val } }
      onChange(syntheticEvent as ChangeEvent<HTMLInputElement>)
    }
  }

  const handleCurrencyBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (onBlur) onBlur(e)
    if (isCurrency && decimalPlaces !== undefined && e.target.value !== '') {
      const num = parseFloat(e.target.value)
      if (!isNaN(num)) {
        const formatted = num.toFixed(decimalPlaces)
        if (onChange && formatted !== e.target.value) {
          const syntheticEvent = { ...e, target: { ...e.target, value: formatted } }
          onChange(syntheticEvent as unknown as ChangeEvent<HTMLInputElement>)
        }
      }
    }
  }

  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return
    const currentVal = parseFloat(String(value ?? 0)) || 0
    const stepVal = Number(step) || 1
    const nextVal = direction === 'up' ? currentVal + stepVal : currentVal - stepVal
    if (min !== undefined && nextVal < Number(min)) return
    if (max !== undefined && nextVal > Number(max)) return
    if (onChange) {
      const event = {
        target: { value: String(nextVal) },
      } as unknown as ChangeEvent<HTMLInputElement>
      onChange(event)
    }
  }

  const hasValue = value !== undefined && value !== null && String(value).length > 0
  const charCount = typeof value === 'string' ? value.length : 0

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {(label || (showCount && maxLength)) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-semibold text-foreground-secondary tracking-wide select-none"
            >
              {label}
              {rest.required && <span className="text-error ml-0.5">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span
              className={`text-[11px] font-mono ${
                charCount > maxLength ? 'text-error font-semibold' : 'text-text-tertiary'
              }`}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div
        className={`group relative flex items-center rounded-xl border bg-input-background transition-all duration-150 ${
          error
            ? 'border-error bg-error-subtle/20 ring-1 ring-error/20'
            : 'border-input-border hover:border-input-border-hover focus-within:border-input-border-focus focus-within:ring-3 focus-within:ring-ring/20'
        } ${disabled ? 'bg-input-disabled-background opacity-60 pointer-events-none' : ''}`}
      >
        {/* Leading Currency Addon */}
        {isCurrency && (
          <span className="flex items-center justify-center bg-surface-sunken border-r border-input-border px-3 h-full text-xs font-mono font-semibold text-text-secondary select-none rounded-l-xl">
            {currencyBadge}
          </span>
        )}

        {/* Prefix Text Addon */}
        {prefixText && !isCurrency && (
          <span className="flex items-center justify-center bg-surface-sunken border-r border-input-border px-3 h-full text-xs font-medium text-text-secondary select-none rounded-l-xl">
            {prefixText}
          </span>
        )}

        {/* Leading Icon */}
        {leadingIconNode && !isCurrency && !prefixText && (
          <span className="absolute left-3 pointer-events-none flex items-center">
            {leadingIconNode}
          </span>
        )}

        {/* Native Input */}
        <input
          ref={inputRef}
          id={id}
          type={resolvedType}
          inputMode={resolvedInputMode}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          onChange={isCurrency ? handleCurrencyChange : onChange}
          onBlur={isCurrency ? handleCurrencyBlur : onBlur}
          className={`${heightCls} w-full bg-transparent text-input-text placeholder:text-input-placeholder px-3.5 transition-colors focus:outline-none ${
            leadingIconNode && !isCurrency && !prefixText ? 'pl-9' : ''
          } ${
            isPassword || onClear || trailingIcon || suffixText || isPercentage || showStepper
              ? 'pr-10'
              : ''
          } ${isDate ? 'cursor-pointer' : ''} ${className}`}
          {...rest}
        />

        {/* Right Addons: Clear button, Password Toggle, Stepper, Percentage, Suffix */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {/* Password Show/Hide Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded-lg text-text-tertiary hover:text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Search or Standard Clear Button */}
          {Boolean((isSearch || onClear) && hasValue && !isPassword) ? (
            <button
              type="button"
              onClick={() => {
                if (onClear) {
                  onClear()
                } else if (onChange) {
                  const event = {
                    target: { value: '' },
                  } as unknown as ChangeEvent<HTMLInputElement>
                  onChange(event)
                }
                inputRef.current?.focus()
              }}
              className="p-1 rounded-lg text-text-tertiary hover:text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
              aria-label="Clear input"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Stepper Buttons for Integer/Number */}
          {showStepper && (
            <div className="flex items-center border border-input-border rounded-lg overflow-hidden bg-surface-sunken">
              <button
                type="button"
                onClick={() => handleStep('down')}
                disabled={disabled || (min !== undefined && Number(value) <= Number(min))}
                className="px-1.5 py-1 text-text-secondary hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                aria-label="Decrement value"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleStep('up')}
                disabled={disabled || (max !== undefined && Number(value) >= Number(max))}
                className="px-1.5 py-1 text-text-secondary hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 border-l border-input-border"
                aria-label="Increment value"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Trailing Icon */}
          {Boolean(trailingIcon) && !isPassword && (
            <span className="pointer-events-none flex items-center">
              {renderIconOrNode(trailingIcon, 'w-4 h-4 text-text-tertiary')}
            </span>
          )}

          {/* Trailing Percentage Badge */}
          {isPercentage && (
            <span className="flex items-center justify-center bg-surface-sunken border-l border-input-border px-3 h-full text-xs font-mono font-semibold text-text-secondary select-none rounded-r-xl">
              %
            </span>
          )}

          {/* Trailing Suffix Text */}
          {suffixText && !isPercentage && (
            <span className="flex items-center justify-center bg-surface-sunken border-l border-input-border px-3 h-full text-xs font-medium text-text-secondary select-none rounded-r-xl">
              {suffixText}
            </span>
          )}
        </div>
      </div>

      {error ? (
        <span className="text-[11px] font-medium text-error leading-normal">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-text-tertiary leading-normal">{hint}</span>
      ) : null}
    </div>
  )
}

export interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  mono?: boolean
  maxChars?: number
  showCount?: boolean
  autoGrow?: boolean
  fullWidth?: boolean
}

export function AppTextarea({
  label,
  hint,
  error,
  mono = false,
  maxChars,
  showCount = false,
  autoGrow = false,
  fullWidth = true,
  className = '',
  id,
  value,
  maxLength,
  onChange,
  disabled,
  ...rest
}: AppTextareaProps) {
  const charCount = typeof value === 'string' ? value.length : 0
  const effectiveMax = maxChars ?? maxLength

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (autoGrow) {
      e.target.style.height = 'auto'
      e.target.style.height = `${e.target.scrollHeight}px`
    }
    if (onChange) onChange(e)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {(label || (showCount && effectiveMax)) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-semibold text-foreground-secondary tracking-wide select-none"
            >
              {label}
              {rest.required && <span className="text-error ml-0.5">*</span>}
            </label>
          )}
          {showCount && effectiveMax && (
            <span
              className={`text-[11px] font-mono ${
                charCount > effectiveMax ? 'text-error font-semibold' : 'text-text-tertiary'
              }`}
            >
              {charCount}/{effectiveMax}
            </span>
          )}
        </div>
      )}
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        maxLength={effectiveMax}
        onChange={handleInput}
        className={`w-full rounded-xl border bg-input-background text-input-text placeholder:text-input-placeholder px-3.5 py-2.5 text-xs sm:text-sm transition-all duration-150 focus:outline-none focus:border-input-border-focus focus:ring-3 focus:ring-ring/20 min-h-24 ${
          mono ? 'font-mono text-xs' : ''
        } ${
          error
            ? 'border-error bg-error-subtle/20 ring-1 ring-error/20'
            : 'border-input-border hover:border-input-border-hover'
        } ${disabled ? 'bg-input-disabled-background opacity-60 pointer-events-none' : ''} ${className}`}
        {...rest}
      />
      {error ? (
        <span className="text-[11px] font-medium text-error leading-normal">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-text-tertiary leading-normal">{hint}</span>
      ) : null}
    </div>
  )
}

export interface AppSelectOption {
  value: string | number
  label: string
}

export interface AppSelectGroup {
  group: string
  options: AppSelectOption[]
}

export interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  options?: AppSelectOption[]
  groups?: AppSelectGroup[]
  placeholder?: string
  fullWidth?: boolean
  children?: ReactNode
}

export function AppSelect({
  label,
  hint,
  error,
  icon,
  options,
  groups,
  placeholder,
  fullWidth = true,
  className = '',
  id,
  children,
  disabled,
  ...rest
}: AppSelectProps) {
  const leadingIconNode = renderIconOrNode(icon, 'w-4 h-4 text-input-placeholder shrink-0')

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-foreground-secondary tracking-wide select-none"
        >
          {label}
          {rest.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIconNode && (
          <span className="absolute left-3.5 pointer-events-none flex items-center z-10">
            {leadingIconNode}
          </span>
        )}
        <select
          id={id}
          disabled={disabled}
          className={`h-10 w-full appearance-none rounded-xl border bg-input-background text-input-text px-3.5 pr-9 text-xs sm:text-sm transition-all duration-150 focus:outline-none focus:border-input-border-focus focus:ring-3 focus:ring-ring/20 cursor-pointer ${
            leadingIconNode ? 'pl-9.5' : ''
          } ${
            error
              ? 'border-error bg-error-subtle/20 ring-1 ring-error/20'
              : 'border-input-border hover:border-input-border-hover'
          } ${disabled ? 'bg-input-disabled-background opacity-60 pointer-events-none' : ''} ${className}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : groups
              ? groups.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              : children}
        </select>
        <span className="absolute right-3 pointer-events-none text-text-tertiary flex items-center">
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>
      {error ? (
        <span className="text-[11px] font-medium text-error leading-normal">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-text-tertiary leading-normal">{hint}</span>
      ) : null}
    </div>
  )
}
