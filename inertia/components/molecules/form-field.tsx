import { AppInput, AppTextarea, AppSelect } from '../atoms/input'

export type FieldDef = {
  name: string
  label: string
  kind?:
    | 'text'
    | 'number'
    | 'integer'
    | 'decimal'
    | 'currency'
    | 'percentage'
    | 'email'
    | 'date'
    | 'datetime-local'
    | 'select'
    | 'textarea'
    | 'password'
  options?:
    | Array<{ value: string | number; label: string }>
    | ((values: Record<string, string>) => Array<{ value: string | number; label: string }>)
  required?: boolean
  placeholder?: string
  default?: string
  description?: string
  currencySymbol?: string
  currencyCode?: string
  decimalPlaces?: number
  mono?: boolean
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

  if (field.kind === 'select') {
    const rawOptions =
      typeof field.options === 'function' ? field.options(values) : (field.options ?? [])
    const options = field.required
      ? rawOptions
      : [{ value: '', label: field.placeholder ?? '— Select —' }, ...rawOptions]

    return (
      <div className={colSpanClass}>
        <AppSelect
          id={`field-${field.name}`}
          name={field.name}
          label={field.label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          hint={field.description}
          error={error}
          options={options}
          fullWidth
        />
      </div>
    )
  }

  if (field.kind === 'textarea') {
    return (
      <div className={colSpanClass}>
        <AppTextarea
          id={`field-${field.name}`}
          name={field.name}
          label={field.label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          hint={field.description}
          error={error}
          mono={field.mono}
          fullWidth
        />
      </div>
    )
  }

  const inputType =
    field.kind === 'password'
      ? 'password'
      : field.kind === 'currency'
        ? 'currency'
        : field.kind === 'decimal'
          ? 'decimal'
          : field.kind === 'percentage'
            ? 'percentage'
            : field.kind === 'integer'
              ? 'integer'
              : field.kind === 'number'
                ? 'number'
                : field.kind === 'date'
                  ? 'date'
                  : field.kind === 'datetime-local'
                    ? 'datetime-local'
                    : field.kind === 'email'
                      ? 'email'
                      : 'text'

  return (
    <div className={colSpanClass}>
      <AppInput
        id={`field-${field.name}`}
        name={field.name}
        type={inputType}
        label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        placeholder={field.placeholder}
        hint={field.description}
        error={error}
        currencySymbol={field.currencySymbol}
        currencyCode={field.currencyCode}
        decimalPlaces={field.decimalPlaces}
        fullWidth
      />
    </div>
  )
}
