import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { AppButton } from '../atoms/button'

export function RowAction({
  action,
  method = 'post',
  label,
  fields,
  variant,
  confirmText,
}: {
  action: string
  method?: 'post' | 'put' | 'delete'
  label: string
  fields?: Array<{ name: string; value: string }>
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive'
  confirmText?: string
}) {
  return (
    <Form action={action} method={method}>
      {({ processing }) => (
        <span className="inline-flex items-center gap-1">
          {(fields ?? []).map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}
          <AppButton
            label={label}
            type="submit"
            size="xs"
            variant={variant === 'danger' ? 'destructive' : (variant as any) || 'secondary'}
            disabled={processing}
            onClick={(e) => {
              if (confirmText && !window.confirm(confirmText)) e.preventDefault()
            }}
          />
        </span>
      )}
    </Form>
  )
}

export function StatusForm({
  action,
  fieldName = 'status',
  options,
  current,
  label = 'Set status',
}: {
  action: string
  fieldName?: string
  options: Array<{ value: string; label: string }>
  current?: string
  label?: string
}) {
  const [value, setValue] = useState(current ?? options[0]?.value ?? '')
  return (
    <Form action={action} method="post">
      {({ processing }) => (
        <div className="inline-flex items-center gap-2">
          <select
            aria-label={label}
            name={fieldName}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <AppButton
            label="Apply"
            type="submit"
            size="xs"
            variant="secondary"
            disabled={processing}
          />
        </div>
      )}
    </Form>
  )
}
