/**
 * App-level glue composing @astryxdesign/core primitives only.
 * No custom design-system components live here — every visual control is
 * imported from @astryxdesign/core (Button, Card, Table, TextInput, Selector…).
 */
import { type ReactNode, useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import type { TableColumn } from '@astryxdesign/core/Table'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { Selector } from '@astryxdesign/core/Selector'
import { Divider } from '@astryxdesign/core/Divider'

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                   */
/* ------------------------------------------------------------------ */

export function money(currency: string | undefined, amount: unknown): string {
  const n = Number(amount ?? 0)
  const cur = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n)
  } catch {
    return `${cur} ${n.toFixed(2)}`
  }
}

export function when(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

export function short(id: unknown): string {
  const s = String(id ?? '')
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s
}

export const ID_RE = /^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$/

/* ------------------------------------------------------------------ */
/* Page scaffolding                                                     */
/* ------------------------------------------------------------------ */

export function PageSection({
  id,
  title,
  description,
  actions,
  children,
}: {
  id?: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} style={{ marginBottom: 28, scrollMarginTop: 24 }}>
      <Card padding={5}>
        <Stack gap={4}>
          <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
            <Stack gap={1}>
              <Text type="display-3" as="div" weight="bold">
                {title}
              </Text>
              {description ? (
                <Text type="supporting" as="div">
                  {description}
                </Text>
              ) : null}
            </Stack>
            {actions ? <div style={{ marginLeft: 'auto' }}>{actions}</div> : null}
          </Stack>
          <Divider />
          {children}
        </Stack>
      </Card>
    </section>
  )
}

export function KpiCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card padding={4} variant={(tone as 'default') || 'default'}>
      <Stack gap={1}>
        <Text type="supporting" as="div">
          {label}
        </Text>
        <Text type="display-2" as="div" weight="bold">
          {value}
        </Text>
      </Stack>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Forms                                                                */
/* ------------------------------------------------------------------ */

export type FieldDef = {
  name: string
  label: string
  kind?: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'password'
  options?: Array<{ value: string; label: string }>
  required?: boolean
  placeholder?: string
  default?: string
  description?: string
  width?: number | string
}

function stripEmpty<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}

/**
 * Controlled Astryx form posting to an HTTP route. Empty optional fields are
 * stripped before submit so Vine's coercion never sees bare empty strings.
 */
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
  /** Compute the submit URL from current values (e.g. `/customers/${values.id}`). */
  actionFor?: (values: Record<string, string>) => string
  /** Keep empty optional fields instead of stripping them. */
  allowEmpty?: boolean
}) {
  const initial = Object.fromEntries(fields.map((f) => [f.name, f.default ?? '']))
  const [values, setValues] = useState<Record<string, string>>(initial)

  const set = (name: string) => (v: string) => setValues((s) => ({ ...s, [name]: v }))

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
        <Stack gap={3}>
          {intro ? (
            <Text type="supporting" as="div">
              {intro}
            </Text>
          ) : null}
          <Stack
            direction={compact ? 'vertical' : 'horizontal'}
            wrap="wrap"
            gap={3}
            align={compact ? 'stretch' : 'end'}
          >
            {fields.map((f) => {
              const shared = {
                label: f.label,
                htmlName: f.name,
                value: values[f.name] ?? '',
                onChange: set(f.name),
                isRequired: f.required,
                description: f.description,
                placeholder: f.placeholder,
                width: f.width ?? (compact ? '100%' : 220),
              }
              const err = (errors as Record<string, string | undefined>)?.[f.name]
              const status = err ? ({ type: 'error', message: err } as const) : undefined

              if (f.kind === 'select') {
                return (
                  <Selector
                    key={f.name}
                    label={shared.label}
                    htmlName={shared.htmlName}
                    value={shared.value}
                    onChange={(v: string | null) => set(f.name)(v ?? '')}
                    options={(f.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
                    isRequired={shared.isRequired}
                    isLabelHidden={false}
                    placeholder={f.placeholder ?? 'Select…'}
                    width={shared.width}
                    hasClear
                    status={status}
                  />
                )
              }
              if (f.kind === 'textarea') {
                return (
                  <TextArea
                    key={f.name}
                    label={shared.label}
                    htmlName={shared.htmlName}
                    value={shared.value}
                    onChange={(v: string) => set(f.name)(v)}
                    isRequired={shared.isRequired}
                    placeholder={shared.placeholder}
                    width={shared.width}
                    status={status}
                  />
                )
              }
              return (
                <TextInput
                  key={f.name}
                  label={shared.label}
                  type={
                    f.kind === 'number'
                      ? 'text'
                      : f.kind === 'password'
                        ? 'password'
                        : f.kind === 'email'
                          ? 'email'
                          : 'text'
                  }
                  htmlName={shared.htmlName}
                  value={shared.value}
                  onChange={(v: string) => set(f.name)(v)}
                  isRequired={shared.isRequired}
                  placeholder={shared.placeholder}
                  width={shared.width}
                  status={status}
                />
              )
            })}
          </Stack>
          <div>
            <Button
              label={submitLabel}
              type="submit"
              variant="primary"
              size="md"
              isDisabled={processing || (actionFor ? !values[fields[0].name] : false)}
            />
          </div>
        </Stack>
      )}
    </Form>
  )
}

/** Inline single-action form used for row-level status changes and deletes. */
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
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {(fields ?? []).map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}
          <Button
            label={label}
            type="submit"
            size="sm"
            variant={(variant as 'secondary') || 'secondary'}
            isDisabled={processing}
            onClick={(e: { preventDefault?: () => void }) => {
              if (confirmText && !window.confirm(confirmText)) e.preventDefault?.()
            }}
          />
        </span>
      )}
    </Form>
  )
}

/** Select + submit combo for status workflows (orders, shipments, returns…). */
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
        <Stack direction="horizontal" gap={2} align="end">
          <Selector
            label={label}
            isLabelHidden
            htmlName={fieldName}
            value={value}
            onChange={(v: string | null) => setValue(v ?? '')}
            options={options.map((o) => ({ value: o.value, label: o.label }))}
            size="sm"
            width={150}
          />
          <Button
            label="Apply"
            type="submit"
            size="sm"
            variant="secondary"
            isDisabled={processing}
          />
        </Stack>
      )}
    </Form>
  )
}

/* ------------------------------------------------------------------ */
/* Tables                                                               */
/* ------------------------------------------------------------------ */

export type Row = Record<string, any>

export function DataTable({
  rows,
  columns,
  empty,
}: {
  rows: Row[]
  columns: TableColumn<Row>[]
  empty?: string
}) {
  if (!rows || rows.length === 0) {
    return (
      <Text type="supporting" as="div">
        {empty ?? 'No records yet.'}
      </Text>
    )
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table
        data={rows}
        columns={columns}
        idKey={(row: Row) => String(row.id ?? JSON.stringify(row).slice(0, 40))}
        density="compact"
        dividers="rows"
        isStriped
        hasHover
        textOverflow="truncate"
      />
    </div>
  )
}

export const col = {
  text: (key: string, header: string, width?: number): TableColumn<Row> => ({
    key,
    header,
    width: width ? pixel(width) : proportional(1),
    renderCell: (row: Row) => <span>{String(row[key] ?? '—')}</span>,
  }),
  id: (key: string, header = 'ID'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(130),
    renderCell: (row: Row) => <Text type="code">{short(row[key])}</Text>,
  }),
  money: (key: string, header: string, currencyKey = 'currencyCode'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(120),
    align: 'end',
    renderCell: (row: Row) => <span>{money(row[currencyKey] as string, row[key])}</span>,
  }),
  date: (key: string, header: string): TableColumn<Row> => ({
    key,
    header,
    width: pixel(150),
    renderCell: (row: Row) => <span>{when(row[key])}</span>,
  }),
  badge: (key: string, header: string, toneMap?: Record<string, string>): TableColumn<Row> => ({
    key,
    header,
    width: pixel(130),
    renderCell: (row: Row) => {
      const v = String(row[key] ?? '—')
      const tone = (toneMap?.[v] ?? 'neutral') as
        'neutral' | 'info' | 'success' | 'warning' | 'error'
      return <Badge variant={tone} label={v.replace(/_/g, ' ')} />
    },
  }),
  action: (header: string, render: (row: Row) => ReactNode): TableColumn<Row> => ({
    key: '__action',
    header,
    width: pixel(220),
    renderCell: render,
  }),
}

export const STATUS_TONES: Record<string, string> = {
  delivered: 'success',
  fulfilled: 'success',
  paid: 'success',
  processed: 'success',
  active: 'success',
  completed: 'success',
  matched: 'success',
  confirmed: 'info',
  processing: 'info',
  in_transit: 'info',
  pending: 'warning',
  unfulfilled: 'warning',
  partially_fulfilled: 'warning',
  unpaid: 'warning',
  on_hold: 'warning',
  requested: 'warning',
  cancelled: 'error',
  failed: 'error',
  rejected: 'error',
  error: 'error',
  refunded: 'neutral',
  closed: 'neutral',
}
