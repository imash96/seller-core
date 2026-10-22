import { type ReactNode, useState, useEffect, useMemo } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import { X, Sparkles } from 'lucide-react'
import { FormField, type FieldDef } from '../molecules/form-field'

function stripEmpty<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}

export function SmartForm({
  action,
  method = 'post',
  fields,
  submitLabel,
  intro,
  compact,
  onSuccess,
  actionFor,
  allowEmpty,
}: {
  action: string
  method?: 'post' | 'put' | 'delete'
  fields: FieldDef[]
  submitLabel: string
  intro?: string
  compact?: boolean
  onSuccess?: () => void
  actionFor?: (values: Record<string, string>) => string
  allowEmpty?: boolean
}) {
  const initial = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.name, f.default ?? ''])),
    [fields]
  )
  const [values, setValues] = useState<Record<string, string>>(initial)

  const handleFieldChange = (name: string, nextVal: string) => {
    setValues((prev) => {
      const next = { ...prev, [name]: nextVal }
      if (name === 'orderId') {
        next.orderLineItemId = ''
      }
      return next
    })
  }

  return (
    <Form
      action={actionFor ? actionFor(values) : action}
      method={method}
      transform={(data: Record<string, any>) =>
        (allowEmpty ? { ...data, ...values } : stripEmpty({ ...data, ...values })) as Record<
          string,
          any
        >
      }
      resetOnSuccess
      onSuccess={() => {
        setValues(initial)
        onSuccess?.()
      }}
    >
      {({ errors, processing }) => (
        <div className="space-y-4">
          {intro && <p className="text-xs text-muted-foreground">{intro}</p>}
          <div
            className={`grid gap-4 ${
              compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {fields.map((f) => (
              <FormField
                key={f.name}
                field={f}
                value={values[f.name] ?? ''}
                values={values}
                onChange={(v) => handleFieldChange(f.name, v)}
                error={(errors as Record<string, string | undefined>)?.[f.name]}
              />
            ))}
          </div>
          <div className="flex items-center justify-end">
            <Button
              label={submitLabel}
              type="submit"
              variant="primary"
              size="md"
              isDisabled={processing || (actionFor ? !values[fields[0]?.name] : false)}
            />
          </div>
        </div>
      )}
    </Form>
  )
}

export function FormModal({
  isOpen,
  onOpenChange,
  title,
  subtitle,
  submitLabel,
  action,
  fields,
  initialValues,
  actionFor,
  onSuccess,
  presetActions,
  children,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  submitLabel: string
  action: string
  fields: FieldDef[]
  initialValues?: Record<string, string>
  actionFor?: (values: Record<string, string>) => string
  onSuccess?: () => void
  presetActions?: Array<{ label: string; values: Record<string, string> }>
  children?: ReactNode
}) {
  const defaults = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.name, f.default ?? ''])),
    [fields]
  )
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...defaults,
    ...(initialValues ?? {}),
  }))

  useEffect(() => {
    if (isOpen) {
      setValues({ ...defaults, ...(initialValues ?? {}) })
    }
  }, [isOpen, defaults, initialValues])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onOpenChange])

  const handleFieldChange = (name: string, nextVal: string) => {
    setValues((prev) => {
      const next = { ...prev, [name]: nextVal }
      if (name === 'orderId' && prev.orderId !== nextVal && 'orderLineItemId' in next) {
        next.orderLineItemId = ''
      }
      return next
    })
  }

  // Group fields by optional section property if present
  const groupedSections = useMemo(() => {
    const hasSections = fields.some((f) => !!f.section)
    if (!hasSections) {
      return [{ sectionTitle: null as string | null, items: fields }]
    }
    const groups: Array<{ sectionTitle: string | null; items: FieldDef[] }> = []
    for (const f of fields) {
      const sec = f.section ?? 'Details'
      const last = groups[groups.length - 1]
      if (!last || last.sectionTitle !== sec) {
        groups.push({ sectionTitle: sec, items: [f] })
      } else {
        last.items.push(f)
      }
    }
    return groups
  }, [fields])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 flex flex-col w-full max-w-2xl max-h-[88dvh] rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
      >
        <Form
          action={actionFor ? actionFor(values) : action}
          method="post"
          transform={(data: Record<string, any>) =>
            stripEmpty({ ...data, ...values }) as Record<string, any>
          }
          onSuccess={() => {
            onSuccess?.()
            onOpenChange(false)
          }}
        >
          {({ errors, processing }) => (
            <div className="flex flex-col max-h-[88dvh]">
              {/* Sticky Modal Header */}
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-muted/40 shrink-0">
                <div className="min-w-0 flex-1">
                  <h3
                    id="modal-title"
                    className="text-base sm:text-lg font-bold text-foreground truncate"
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {presetActions && presetActions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-muted/50 border border-border">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Quick fill:
                    </span>
                    {presetActions.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, ...preset.values }))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/12 text-primary hover:bg-primary/20 border border-primary/25 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                {children}

                {groupedSections.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-3.5">
                    {group.sectionTitle && (
                      <div className="pb-1.5 border-b border-border">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                          {group.sectionTitle}
                        </h4>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {group.items.map((f) => (
                        <FormField
                          key={f.name}
                          field={f}
                          value={values[f.name] ?? ''}
                          values={values}
                          onChange={(v) => handleFieldChange(f.name, v)}
                          error={(errors as Record<string, string | undefined>)?.[f.name]}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sticky Modal Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/35 flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  isDisabled={processing}
                />
                <Button
                  label={processing ? 'Saving…' : submitLabel}
                  type="submit"
                  variant="primary"
                  isDisabled={processing}
                />
              </div>
            </div>
          )}
        </Form>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  action,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  action: string
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onOpenChange])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 bg-muted/20 flex items-center justify-end gap-2.5">
          <Button label="Cancel" variant="secondary" onClick={() => onOpenChange(false)} />
          <Form
            action={action}
            method="post"
            onSuccess={() => {
              onOpenChange(false)
            }}
          >
            {({ processing }) => (
              <Button
                label={processing ? 'Working…' : confirmLabel}
                type="submit"
                variant="primary"
                isDisabled={processing}
              />
            )}
          </Form>
        </div>
      </div>
    </div>
  )
}
