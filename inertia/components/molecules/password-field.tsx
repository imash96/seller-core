import { AppInput } from '../atoms/input'

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
  icon?: any
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
  icon,
}: PasswordFieldProps) {
  return (
    <AppInput
      id={`field-${name}`}
      name={name}
      type="password"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      hint={description}
      error={error}
      autoComplete={autoComplete}
      icon={icon}
      fullWidth
    />
  )
}
