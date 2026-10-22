import { PasswordField } from './password-field'

export type FieldDef = {
  name: string
  label: string
  kind?: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'password'
  options?:
    | Array<{ value: string; label: string }>
    | ((values: Record<string, string>) => Array<{ value: string; label: string }>)
  required?: boolean
  placeholder?: string
  default?: string
  description?: string
  width?: number | string
  fullWidth?: boolean
  section?: string
}

export function FormField({
  field,
  value,
  values,
  onChange,
  error,
}: {
  field: FieldDef
  value: string
  values: Record<string, string>
  onChange: (nextValue: string) => void
  error?: string
}) {
  const isFullWidth = field.fullWidth || field.kind === 'textarea'
  const colSpanClass = isFullWidth ? 'sm:col-span-2' : ''

  if (field.kind === 'password') {
    return (
      <div className={colSpanClass}>
        <PasswordField
          label={field.label}
          name={field.name}
          value={value}
          onChange={onChange}
          required={field.required}
          placeholder={field.placeholder}
          description={field.description}
          error={error}
        />
      </div>
    )
  }

  const resolvedOptions =
    typeof field.options === 'function' ? field.options(values) : (field.options ?? [])

  return (
    <div className={`flex flex-col gap-1.5 w-full ${colSpanClass}`}>
      <label
        htmlFor={`field-${field.name}`}
        className="text-xs font-semibold text-foreground flex items-center gap-1"
      >
        <span>{field.label}</span>
        {field.required && <span className="text-rose-500">*</span>}
      </label>

      {field.kind === 'select' ? (
        <select
          id={`field-${field.name}`}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={`w-full h-10 px-3 rounded-xl border text-sm bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-border'
          }`}
        >
          {!field.required && <option value="">{field.placeholder ?? '— Select —'}</option>}
          {field.required && value === '' && (
            <option value="" disabled>
              {field.placeholder ?? 'Select…'}
            </option>
          )}
          {resolvedOptions.map((opt) => (
            <option key={`${opt.value}-${opt.label}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.kind === 'textarea' ? (
        <textarea
          id={`field-${field.name}`}
          name={field.name}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-border'
          }`}
        />
      ) : (
        <input
          id={`field-${field.name}`}
          name={field.name}
          type={
            field.kind === 'number'
              ? 'number'
              : field.kind === 'date'
                ? 'date'
                : field.kind === 'email'
                  ? 'email'
                  : 'text'
          }
          step={field.kind === 'number' ? 'any' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          className={`w-full h-10 px-3.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-border'
          }`}
        />
      )}

      {field.description && !error && (
        <p className="text-[11px] text-muted-foreground leading-snug">{field.description}</p>
      )}
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}
