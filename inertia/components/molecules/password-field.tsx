import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface PasswordFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  description?: string
  error?: string
  autoComplete?: string
}

export function PasswordField({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
  description,
  error,
  autoComplete = 'current-password',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={`field-${name}`}
        className="text-xs font-semibold text-foreground flex items-center gap-1"
      >
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>

      <div className="password-input-wrapper">
        <input
          id={`field-${name}`}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full h-10 pl-3.5 pr-10 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-border'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="password-toggle-btn"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {description && !error && (
        <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
      )}
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}
