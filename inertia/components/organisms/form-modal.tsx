import { type ReactNode, useState, useEffect, useMemo } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { X, Sparkles } from 'lucide-react'
import { FormField, type FieldDef } from '../molecules/form-field'
import { AppButton } from '../atoms/button'
import { StatusBadge } from '../atoms/status-badge'
import { VStack } from '@astryxdesign/core/Stack'

function stripEmpty<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

const MODAL_SIZES: Record<ModalSize, string> = {
  'sm': 'max-w-md',
  'md': 'max-w-lg',
  'lg': 'max-w-2xl',
  'xl': 'max-w-4xl',
  '2xl': 'max-w-5xl',
  'full': 'max-w-6xl',
}

export interface AppModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: ReactNode | { label: string; variant?: string }
  size?: ModalSize
  footer?: ReactNode
  children: ReactNode
}

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  badge,
  size = 'lg',
  footer,
  children,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const sizeCls = MODAL_SIZES[size] ?? MODAL_SIZES.lg

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-scrim backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
        className={`relative z-10 flex flex-col w-full ${sizeCls} max-h-[88dvh] rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden transition-all duration-200`}
      >
        {/* Sticky Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-surface-elevated shrink-0">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                id="modal-heading"
                className="text-base sm:text-lg font-bold text-foreground truncate tracking-tight"
              >
                {title}
              </h3>
              {badge && typeof badge === 'object' && 'label' in badge ? (
                <StatusBadge label={badge.label} variant={badge.variant ?? 'info'} />
              ) : (
                badge
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface-sunken flex items-center justify-end gap-3 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
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
        <VStack gap={4}>
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
            <AppButton
              label={submitLabel}
              type="submit"
              variant="primary"
              size="md"
              loading={processing}
              disabled={processing || (actionFor ? !values[fields[0]?.name] : false)}
            />
          </div>
        </VStack>
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
  size = 'lg',
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
  size?: ModalSize
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

  const sizeCls = MODAL_SIZES[size] ?? MODAL_SIZES.lg

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-scrim backdrop-blur-xs transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex flex-col w-full ${sizeCls} max-h-[88dvh] rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden`}
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
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-surface-elevated shrink-0">
                <div className="min-w-0 flex-1">
                  <h3
                    id="modal-title"
                    className="text-base sm:text-lg font-bold text-foreground truncate tracking-tight"
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
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {presetActions && presetActions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-surface-sunken border border-border-subtle">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Quick fill:
                    </span>
                    {presetActions.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, ...preset.values }))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-subtle text-primary hover:bg-primary/20 border border-primary/25 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                {children}

                {groupedSections.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className={
                      group.sectionTitle
                        ? 'rounded-xl border border-border-subtle bg-surface-sunken/40 p-4 sm:p-5 space-y-4'
                        : 'space-y-4'
                    }
                  >
                    {group.sectionTitle && (
                      <div className="pb-2 border-b border-border-subtle">
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
              <div className="px-6 py-4 border-t border-border bg-surface-sunken flex items-center justify-end gap-3 shrink-0">
                <AppButton
                  label="Cancel"
                  variant="secondary"
                  size="md"
                  onClick={() => onOpenChange(false)}
                  disabled={processing}
                />
                <AppButton
                  label={processing ? 'Saving…' : submitLabel}
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={processing}
                  disabled={processing}
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
  cancelLabel = 'Cancel',
  tone = 'primary',
  action,
  onConfirm,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning' | 'primary'
  action?: string
  onConfirm?: () => void
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

  const btnVariant = tone === 'danger' ? 'destructive' : tone === 'warning' ? 'warning' : 'primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-scrim backdrop-blur-xs transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border bg-surface-elevated flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 bg-surface-sunken flex items-center justify-end gap-3">
          <AppButton
            label={cancelLabel}
            variant="secondary"
            size="md"
            onClick={() => onOpenChange(false)}
          />
          {action ? (
            <Form
              action={action}
              method="post"
              onSuccess={() => {
                onOpenChange(false)
                onConfirm?.()
              }}
            >
              {({ processing }) => (
                <AppButton
                  label={processing ? 'Working…' : confirmLabel}
                  type="submit"
                  variant={btnVariant}
                  size="md"
                  loading={processing}
                  disabled={processing}
                />
              )}
            </Form>
          ) : (
            <AppButton
              label={confirmLabel}
              variant={btnVariant}
              size="md"
              onClick={() => {
                onConfirm?.()
                onOpenChange(false)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
