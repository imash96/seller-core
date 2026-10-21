/**
 * App-level glue composing @astryxdesign/core primitives only.
 * Provides: formatting helpers, page scaffolding, FormModal, ResponsiveDataView,
 * saved-views bar, and supporting UI components.
 */
import { type ReactNode, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Stack, StackItem } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import type { TableColumn } from '@astryxdesign/core/Table'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { Selector } from '@astryxdesign/core/Selector'
import { Divider } from '@astryxdesign/core/Divider'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Package, Search, X, Filter, LayoutGrid, Table2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMoney, formatDate, shortId } from '~/lib/utils'

/* ------------------------------------------------------------------ */
/* Formatting helpers — delegate to lib/utils.ts                        */
/* ------------------------------------------------------------------ */

/** @deprecated Use `formatMoney` from `~/lib/utils` directly. */
export const money = formatMoney

/** @deprecated Use `formatDate` from `~/lib/utils` directly. */
export const when = formatDate

/** @deprecated Use `shortId` from `~/lib/utils` directly. */
export const short = shortId

export const ID_RE = /^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$/

/** Safely render a value that may be an object (e.g. preloaded relation) */
export function displayValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (o.fullName) return String(o.fullName)
    if (o.name) return String(o.name)
    if (o.email) return String(o.email)
    if (o.title) return String(o.title)
    return o.id ? short(o.id) : JSON.stringify(v).slice(0, 40)
  }
  return String(v)
}

/* ------------------------------------------------------------------ */
/* Page scaffolding — new shared primitives for the UI refresh         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  meta,
}: {
  title: string
  description?: string
  eyebrow?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <Stack gap={2}>
      {eyebrow ? (
        <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
          {eyebrow}
        </Stack>
      ) : null}
      <Stack direction="horizontal" gap={3} align="center" wrap="wrap">
        <Text type="display-2" as="h2" weight="bold">
          {title}
        </Text>
        {meta}
      </Stack>
      {description ? (
        <Text type="supporting" as="p" style={{ maxWidth: 760 }}>
          {description}
        </Text>
      ) : null}
      {actions ? (
        <Stack direction="horizontal" gap={2} wrap="wrap">
          {actions}
        </Stack>
      ) : null}
    </Stack>
  )
}

export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; hint?: string }>
}) {
  if (!items?.length) return null
  return (
    <Card padding={3} variant="muted">
      <Grid columns={{ minWidth: 140, max: 6 }} gap={2}>
        {items.map((it) => (
          <Stack key={it.label} gap={1} align="start">
            <Text type="supporting" as="div" color="secondary">
              {it.label}
            </Text>
            <Text type="display-3" as="div" weight="bold">
              {it.value}
            </Text>
            {it.hint ? (
              <Text type="supporting" as="div">
                {it.hint}
              </Text>
            ) : null}
          </Stack>
        ))}
      </Grid>
    </Card>
  )
}

/* Keep legacy PageSection for gradual migration — now delegates to new primitives. */
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
    <Stack as="section" id={id} gap={0} className="page-section">
      <Card padding={5}>
        <Stack gap={4}>
          <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
            <StackItem size="fill">
              <Stack gap={1}>
                <Heading level={2} type="display-3" weight="bold">
                  {title}
                </Heading>
                {description ? (
                  <Text type="supporting" as="div">
                    {description}
                  </Text>
                ) : null}
              </Stack>
            </StackItem>
            {actions ?? null}
          </Stack>
          <Divider />
          {children}
        </Stack>
      </Card>
    </Stack>
  )
}

export function KpiCard({
  label,
  value,
  tone,
  sublabel,
  trend,
}: {
  label: string
  value: string
  tone?: string
  sublabel?: string
  trend?: string
}) {
  return (
    <Card padding={4} variant={(tone as 'default') || 'default'}>
      <Stack gap={1}>
        <Text type="supporting" as="div">
          {label}
        </Text>
        <Text type="display-2" as="div" weight="bold">
          {value}
        </Text>
        {sublabel ? (
          <Text type="supporting" as="div" color="secondary">
            {sublabel}
          </Text>
        ) : null}
        {trend ? (
          <Badge
            variant={
              trend.startsWith('+') || trend.startsWith('↑')
                ? 'success'
                : trend.startsWith('-') || trend.startsWith('↓')
                  ? 'error'
                  : 'neutral'
            }
            label={trend}
          />
        ) : null}
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
          <Grid columns={compact ? 1 : { minWidth: 220, max: 3 }} gap={3}>
            {fields.map((f) => {
              const shared = {
                label: f.label,
                htmlName: f.name,
                value: values[f.name] ?? '',
                onChange: set(f.name),
                isRequired: f.required,
                description: f.description,
                placeholder: f.placeholder,
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
                  status={status}
                />
              )
            })}
          </Grid>
          <Stack direction="horizontal">
            <Button
              label={submitLabel}
              type="submit"
              variant="primary"
              size="md"
              isDisabled={processing || (actionFor ? !values[fields[0].name] : false)}
            />
          </Stack>
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
        <Stack direction="horizontal" gap={1} align="center" as="span">
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
        </Stack>
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
/* FormModal — accessible modal with sticky header/footer, 2-col grid  */
/* ------------------------------------------------------------------ */

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

  // Sync initialValues when modal re-opens with different row data
  useEffect(() => {
    if (isOpen) {
      setValues({ ...defaults, ...(initialValues ?? {}) })
    }
  }, [isOpen, defaults, initialValues])

  const set = (name: string) => (v: string) => setValues((s) => ({ ...s, [name]: v }))

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width={720}
      purpose="form"
      maxHeight="85dvh"
    >
      <DialogHeader title={title} subtitle={subtitle} onOpenChange={onOpenChange} />
      <div style={{ padding: 20 }}>
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
            <Stack gap={4}>
              {children}
              <Grid columns={{ minWidth: 260, max: 2 }} gap={3}>
                {fields.map((f) => {
                  const err = (errors as Record<string, string | undefined>)?.[f.name]
                  const status = err ? ({ type: 'error', message: err } as const) : undefined
                  if (f.kind === 'select') {
                    return (
                      <Selector
                        key={f.name}
                        label={f.label}
                        htmlName={f.name}
                        value={values[f.name] ?? ''}
                        onChange={(v: string | null) => set(f.name)(v ?? '')}
                        options={(f.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
                        isRequired={f.required}
                        placeholder={f.placeholder ?? 'Select…'}
                        hasClear
                        status={status}
                      />
                    )
                  }
                  if (f.kind === 'textarea') {
                    return (
                      <TextArea
                        key={f.name}
                        label={f.label}
                        htmlName={f.name}
                        value={values[f.name] ?? ''}
                        onChange={(v: string) => set(f.name)(v)}
                        isRequired={f.required}
                        placeholder={f.placeholder}
                        status={status}
                      />
                    )
                  }
                  return (
                    <TextInput
                      key={f.name}
                      label={f.label}
                      type={
                        f.kind === 'password' ? 'password' : f.kind === 'email' ? 'email' : 'text'
                      }
                      htmlName={f.name}
                      value={values[f.name] ?? ''}
                      onChange={(v: string) => set(f.name)(v)}
                      isRequired={f.required}
                      placeholder={f.placeholder}
                      status={status}
                    />
                  )
                })}
              </Grid>
              <Divider />
              <Stack direction="horizontal" gap={2} justify="end">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  isDisabled={processing}
                />
                <Button
                  label={submitLabel}
                  type="submit"
                  variant="primary"
                  isDisabled={processing}
                />
              </Stack>
            </Stack>
          )}
        </Form>
      </div>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* ConfirmDialog — destructive action confirmation                      */
/* ------------------------------------------------------------------ */

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
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={420} purpose="info">
      <DialogHeader title={title} subtitle={description} onOpenChange={onOpenChange} />
      <div style={{ padding: 20 }}>
        <Stack direction="horizontal" gap={2} justify="end">
          <Button label="Cancel" variant="secondary" onClick={() => onOpenChange(false)} />
          <Form action={action} method="post">
            {({ processing }) => (
              <Button
                label={confirmLabel}
                type="submit"
                variant="primary"
                isDisabled={processing}
              />
            )}
          </Form>
        </Stack>
      </div>
    </Dialog>
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
    <Stack isScrollable>
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
    </Stack>
  )
}

export const col = {
  text: (key: string, header: string, width?: number): TableColumn<Row> => ({
    key,
    header,
    width: width ? pixel(width) : proportional(1),
    renderCell: (row: Row) => <Text type="body">{String(row[key] ?? '—')}</Text>,
  }),
  id: (key: string, header = 'ID'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(130),
    renderCell: (row: Row) => <Text type="code">{shortId(row[key])}</Text>,
  }),
  money: (key: string, header: string, currencyKey = 'currencyCode'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(120),
    align: 'end',
    renderCell: (row: Row) => <Text type="body">{money(row[currencyKey] as string, row[key])}</Text>,
  }),
  date: (key: string, header: string): TableColumn<Row> => ({
    key,
    header,
    width: pixel(150),
    renderCell: (row: Row) => <Text type="body">{when(row[key])}</Text>,
  }),
  badge: (key: string, header: string, toneMap?: Record<string, string>): TableColumn<Row> => ({
    key,
    header,
    width: pixel(130),
    renderCell: (row: Row) => {
      const v = String(row[key] ?? '—')
      const tone = (toneMap?.[v] ?? 'neutral') as
        | 'neutral'
        | 'info'
        | 'success'
        | 'warning'
        | 'error'
        | 'blue'
        | 'cyan'
        | 'green'
        | 'orange'
        | 'pink'
        | 'purple'
        | 'red'
        | 'teal'
        | 'yellow'
      return <Badge variant={tone} label={v.replace(/_/g, ' ')} />
    },
  }),
  action: (header: string, render: (row: Row) => ReactNode): TableColumn<Row> => ({
    key: '__action',
    header,
    width: pixel(240),
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

/* ------------------------------------------------------------------ */
/* ResponsiveDataView — table + card grid + search/filter/sort/paginate */
/* ------------------------------------------------------------------ */

type FilterPill = { value: string; label: string }

type CardData = {
  title: string
  subtitle?: string
  idBadge?: string
  avatarText?: string
  statusBadge?: { label: string; variant: string }
  metrics: Array<{ label: string; value: ReactNode; icon?: ReactNode }>
  actions?: ReactNode
}

type ResponsiveDataViewProps = {
  rows: Row[]
  columns: TableColumn<Row>[]
  toCard: (row: Row) => CardData
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  searchKeys?: string[]
  filterPills?: FilterPill[]
  filterKey?: string
  defaultViewMode?: 'auto' | 'table' | 'cards'
  pageSizeOptions?: number[]
  createLabel?: string
  onCreateClick?: () => void
}

function accentForVariant(variant: string): string {
  const map: Record<string, string> = {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
    neutral: '#6b7280',
  }
  return map[variant] || map.neutral
}

export function ResponsiveDataView({
  rows,
  columns,
  toCard,
  emptyTitle = 'No records',
  emptyDescription,
  emptyAction,
  searchKeys = [],
  filterPills,
  filterKey,
  defaultViewMode = 'auto',
  pageSizeOptions = [10, 25, 50],
  createLabel,
  onCreateClick,
}: ResponsiveDataViewProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10)
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sc_view_mode') as 'auto' | 'table' | 'cards' | null
      return saved ?? defaultViewMode
    }
    return defaultViewMode
  })
  const [isNarrow, setIsNarrow] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const mNarrow = window.matchMedia('(max-width: 639px)')
    const mTablet = window.matchMedia('(max-width: 1023px)')
    const handler = () => {
      setIsNarrow(mNarrow.matches)
      setIsTablet(mTablet.matches)
    }
    handler()
    mNarrow.addEventListener('change', handler)
    mTablet.addEventListener('change', handler)
    return () => {
      mNarrow.removeEventListener('change', handler)
      mTablet.removeEventListener('change', handler)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sc_view_mode', viewMode)
  }, [viewMode])

  const effectiveMode: 'table' | 'cards' = useMemo(() => {
    if (viewMode === 'cards') return 'cards'
    if (viewMode === 'table') return 'table'
    return isTablet ? 'cards' : 'table'
  }, [viewMode, isTablet])

  const filtered = useMemo(() => {
    let out = rows
    if (search.trim() && searchKeys.length > 0) {
      const q = search.toLowerCase()
      out = out.filter((row) =>
        searchKeys.some((k) => {
          const v = row[k]
          if (v === null || v === undefined) return false
          if (typeof v === 'object') return JSON.stringify(v).toLowerCase().includes(q)
          return String(v).toLowerCase().includes(q)
        })
      )
    }
    if (filterPills && filterKey && activeFilter !== 'all') {
      out = out.filter((row) => String(row[filterKey] ?? '') === activeFilter)
    }
    return out
  }, [rows, search, searchKeys, filterPills, filterKey, activeFilter])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const an = Number(av)
      const bn = Number(bv)
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, activeFilter, pageSize])

  const handleSort = (colKey: string) => {
    if (sortKey === colKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(colKey)
      setSortDir('asc')
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription ?? 'Get started by creating your first record.'}
        icon={<Package size={32} />}
        actions={
          emptyAction ??
          (onCreateClick && createLabel ? (
            <Button label={createLabel} variant="primary" onClick={onCreateClick} />
          ) : undefined)
        }
      />
    )
  }

  return (
    <Stack gap={3}>
      {/* ---------- Toolbar — stacks vertically on narrow screens ---------- */}
      <Card padding={3}>
        <Stack gap={3}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Search */}
            {searchKeys.length > 0 ? (
              <div
                style={{
                  position: 'relative',
                  flex: isNarrow ? '1 1 100%' : '1 1 220px',
                  maxWidth: isNarrow ? '100%' : 360,
                  minWidth: 180,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 34px 9px 32px',
                    borderRadius: 10,
                    border: '1px solid var(--astryx-color-border-default, #e5e7eb)',
                    background: 'var(--astryx-color-background-surface, #fff)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 120ms',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0866ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
                {search ? (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'var(--astryx-color-background-muted, #f3f4f6)',
                      border: 'none',
                      borderRadius: 999,
                      width: 22,
                      height: 22,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* View mode switcher + create */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginLeft: isNarrow ? 0 : 'auto',
              }}
            >
              <div
                role="group"
                aria-label="View mode"
                style={{
                  display: 'inline-flex',
                  border: '1px solid var(--astryx-color-border-default, #e5e7eb)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--astryx-color-background-muted, #f8fafc)',
                  padding: 2,
                }}
              >
                {[
                  { mode: 'cards' as const, icon: <LayoutGrid size={15} />, label: 'Cards' },
                  { mode: 'table' as const, icon: <Table2 size={15} />, label: 'Table' },
                  { mode: 'auto' as const, icon: <Sparkles size={15} />, label: 'Auto' },
                ].map((opt) => {
                  const active = viewMode === opt.mode
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => setViewMode(opt.mode)}
                      aria-pressed={active}
                      title={opt.label}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: active ? '#111827' : 'transparent',
                        color: active ? '#fff' : 'inherit',
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 120ms',
                      }}
                    >
                      {opt.icon}
                      <span className="hide-on-narrow">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
              {onCreateClick && createLabel ? (
                <Button label={createLabel} variant="primary" size="sm" onClick={onCreateClick} />
              ) : null}
            </div>
          </div>

          {/* Filter pills — horizontally scrollable on mobile */}
          {filterPills && filterKey ? (
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                paddingBottom: 2,
                alignItems: 'center',
              }}
            >
              {filterPills.map((pill) => {
                const isActive = activeFilter === pill.value
                const count =
                  pill.value === 'all'
                    ? rows.length
                    : rows.filter((r) => String(r[filterKey] ?? '') === pill.value).length
                return (
                  <button
                    key={pill.value}
                    onClick={() => setActiveFilter(pill.value)}
                    style={{
                      flex: '0 0 auto',
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: isActive
                        ? '1px solid #111827'
                        : '1px solid var(--astryx-color-border-default, #e5e7eb)',
                      background: isActive ? '#111827' : '#fff',
                      color: isActive ? '#fff' : '#374151',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 120ms',
                    }}
                  >
                    {pill.label}{' '}
                    <span style={{ opacity: isActive ? 0.85 : 0.55, fontWeight: 400 }}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Result meta */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text type="supporting" as="div" color="secondary">
              Showing <strong style={{ color: '#111827' }}>{paginated.length}</strong> of{' '}
              <strong style={{ color: '#111827' }}>{sorted.length}</strong>{' '}
              {sorted.length === 1 ? 'record' : 'records'}
              {search || activeFilter !== 'all' ? (
                <span style={{ opacity: 0.7 }}> · filtered from {rows.length}</span>
              ) : null}
              {sortKey ? (
                <span style={{ opacity: 0.7 }}>
                  {' '}
                  · sorted by {sortKey} {sortDir === 'asc' ? '↑' : '↓'}
                </span>
              ) : null}
            </Text>
            {sorted.length > (pageSizeOptions[0] ?? 10) ? (
              <Selector
                label="Per page"
                isLabelHidden
                value={String(pageSize)}
                onChange={(v) => setPageSize(Number(v ?? 10))}
                options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} / page` }))}
                size="sm"
                width={116}
              />
            ) : null}
          </div>
        </Stack>
      </Card>

      {/* ---------- Content ---------- */}
      {sorted.length === 0 ? (
        <EmptyState
          title="No matching records"
          description="Try adjusting your search or filter criteria."
          icon={<Filter size={28} />}
          actions={
            <Button
              label="Clear filters"
              variant="secondary"
              onClick={() => {
                setSearch('')
                setActiveFilter('all')
              }}
            />
          }
        />
      ) : effectiveMode === 'cards' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isNarrow
              ? '1fr'
              : isTablet
                ? 'repeat(2, minmax(0,1fr))'
                : 'repeat(3, minmax(0,1fr))',
            gap: 16,
          }}
        >
          {paginated.map((row) => {
            const card = toCard(row)
            const accent = card.statusBadge ? accentForVariant(card.statusBadge.variant) : '#e5e7eb'
            const initials = card.avatarText ?? card.title.slice(0, 2).toUpperCase()
            return (
              <div
                key={String(row.id ?? JSON.stringify(row).slice(0, 24))}
                style={{
                  position: 'relative',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 140ms, transform 140ms',
                }}
                onMouseEnter={(e) => {
                  ; (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 8px 24px rgba(0,0,0,0.08)'
                    ; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  ; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                    ; (e.currentTarget as HTMLDivElement).style.transform = 'none'
                }}
              >
                {/* Accent strip */}
                <div style={{ height: 3, background: accent }} />

                <div
                  style={{
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    flex: 1,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background: `${accent}14`,
                          border: `1px solid ${accent}22`,
                          color: accent,
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          flex: '0 0 40px',
                        }}
                      >
                        {initials.slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          title={card.title}
                          style={{
                            fontWeight: 650,
                            fontSize: 15,
                            lineHeight: 1.25,
                            color: '#111827',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {card.title}
                        </div>
                        {card.subtitle ? (
                          <div
                            style={{
                              fontSize: 12.5,
                              color: '#6b7280',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {card.subtitle}
                          </div>
                        ) : card.idBadge ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {card.idBadge}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {card.statusBadge ? (
                      <span style={{ flex: '0 0 auto' }}>
                        <Badge
                          variant={card.statusBadge.variant as any}
                          label={card.statusBadge.label}
                        />
                      </span>
                    ) : null}
                  </div>

                  {/* Metrics */}
                  {card.metrics?.length ? (
                    <>
                      <div style={{ height: 1, background: '#f3f4f6', margin: '2px 0' }} />
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 12,
                        }}
                      >
                        {card.metrics.map((m, i) => (
                          <div key={i} style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: 0.04 * 11,
                                textTransform: 'uppercase',
                                color: '#9ca3af',
                                marginBottom: 4,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {m.label}
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#111827',
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                              }}
                            >
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Footer actions — sticks to bottom */}
                  {card.actions ? (
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 12,
                        borderTop: '1px solid #f3f4f6',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      {card.actions}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Scroll shadows — indicate overflow */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 24px, rgba(255,255,255,0) calc(100% - 24px), rgba(255,255,255,1) 100%)',
              opacity: 0.0,
            }}
          />
          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
            }}
          >
            <div style={{ minWidth: 720 }}>
              <Table
                data={paginated}
                columns={columns.map((c) => {
                  // Make headers sortable inline — inject sort indicator
                  if (c.key === '__action') return c
                  const isSorted = sortKey === c.key
                  return {
                    ...c,
                    header: `${c.header}${isSorted ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}`,
                  }
                })}
                idKey={(row: Row) => String(row.id ?? JSON.stringify(row).slice(0, 40))}
                density="compact"
                dividers="rows"
                isStriped
                hasHover
                textOverflow="truncate"
              />
            </div>
          </div>
          {/* Sort bar — compact pill row, accessible */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {columns
              .filter((c) => c.key !== '__action')
              .slice(0, 6)
              .map((c) => {
                const isSorted = sortKey === c.key
                return (
                  <button
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    aria-pressed={isSorted}
                    style={{
                      fontSize: 12.5,
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: isSorted ? '1px solid #111827' : '1px solid #e5e7eb',
                      background: isSorted ? '#111827' : '#fff',
                      color: isSorted ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: isSorted ? 600 : 500,
                    }}
                  >
                    {c.header} {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                )
              })}
          </div>
          {paginated.length !== sorted.length ? (
            <Text type="supporting" as="div" color="secondary" style={{ marginTop: 8 }}>
              Tip: swipe horizontally to see all columns · tap a column pill to sort
            </Text>
          ) : null}
        </div>
      )}

      {/* Pagination — thumb-friendly */}
      {totalPages > 1 ? (
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 0',
            flexWrap: 'wrap',
          }}
        >
          <Button
            label=""
            variant="secondary"
            size="sm"
            isDisabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span
            style={{
              fontSize: 13,
              color: '#6b7280',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 999,
              padding: '6px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            Page <strong style={{ color: '#111827' }}>{currentPage}</strong> of {totalPages} ·{' '}
            {sorted.length} records
          </span>
          <Button
            label=""
            variant="secondary"
            size="sm"
            isDisabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </Button>
          {/* Quick jump on mobile */}
          {totalPages > 3 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = i + 1 + Math.max(0, currentPage - 3)
                if (n > totalPages) return null
                const active = n === currentPage
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    style={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: 999,
                      border: active ? '1px solid #111827' : '1px solid #e5e7eb',
                      background: active ? '#111827' : '#fff',
                      color: active ? '#fff' : '#374151',
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </Stack>
  )
}
/* ------------------------------------------------------------------ */
/* SavedViews bar                                                       */
/* ------------------------------------------------------------------ */

export function SavedViewsBar({ views, moduleKey }: { views: Row[]; moduleKey?: string }) {
  if (!views || views.length === 0) return null
  return (
    <Card padding={3} variant="muted">
      <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
        <Text type="label" as="div" weight="semibold">
          Saved views:
        </Text>
        {views.map((v) => (
          <Badge key={String(v.id)} variant="info" label={String(v.name)} />
        ))}
        {views.map((v) => (
          <Form key={`del-${String(v.id)}`} action={`/saved-views/${v.id}/delete`} method="post">
            {({ processing }) => (
              <Button label="×" variant="ghost" size="sm" type="submit" isDisabled={processing} />
            )}
          </Form>
        ))}
      </Stack>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Metric helpers for dashboard                                         */
/* ------------------------------------------------------------------ */

export function MetricCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack gap={1}>
      <Text type="supporting" as="div" color="secondary">
        {label}
      </Text>
      <Text type="body" as="div" weight="semibold">
        {value}
      </Text>
    </Stack>
  )
}
