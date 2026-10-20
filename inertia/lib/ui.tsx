/**
 * App-level glue composing @astryxdesign/core primitives only.
 * Provides: formatting helpers, page scaffolding, FormModal, ResponsiveDataView,
 * saved-views bar, and supporting UI components.
 */
import { type ReactNode, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { StackItem } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import type { TableColumn } from '@astryxdesign/core/Table'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { Selector } from '@astryxdesign/core/Selector'
import { Divider } from '@astryxdesign/core/Divider'
import { Banner } from '@astryxdesign/core/Banner'
import { Grid } from '@astryxdesign/core/Grid'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { IconButton } from '@astryxdesign/core/IconButton'
import {
  Search,
  X,
  Pencil,
  Trash2,
  Plus,
  LayoutGrid,
  Table2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
  Eye,
  Package,
  Sparkles,
} from 'lucide-react'

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
    <section id={id}>
      <Card padding={5}>
        <Stack gap={4}>
          <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
            <Stack gap={1}>
              <Heading level={2}>{title}</Heading>
              {description ? (
                <Text type="supporting" as="div">
                  {description}
                </Text>
              ) : null}
            </Stack>
            {actions ? <StackItem>{actions}</StackItem> : null}
          </Stack>
          <Divider />
          {children}
        </Stack>
      </Card>
    </section>
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
          <Stack direction="horizontal" gap={2}>
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
    renderCell: (row: Row) => <span>{displayValue(row[key])}</span>,
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

type ResponsiveDataViewProps = {
  rows: Row[]
  columns: TableColumn<Row>[]
  /** Maps row -> { title, idBadge, statusBadge?: {label, variant}, metrics: Array<{label, value}>, actions?: ReactNode } */
  toCard: (row: Row) => {
    title: string
    idBadge?: string
    statusBadge?: { label: string; variant: string }
    metrics: Array<{ label: string; value: ReactNode }>
    actions?: ReactNode
  }
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    localStorage.setItem('sc_view_mode', viewMode)
  }, [viewMode])

  const effectiveMode: 'table' | 'cards' = useMemo(() => {
    if (viewMode === 'cards') return 'cards'
    if (viewMode === 'table') return 'table'
    return isMobile ? 'cards' : 'table'
  }, [viewMode, isMobile])

  // Filtering
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

  // Sorting
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, activeFilter, pageSize])

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
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
      {/* Toolbar */}
      <Stack gap={3}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          {/* Search */}
          {searchKeys.length > 0 ? (
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.5,
                  pointerEvents: 'none',
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
                  padding: '8px 32px 8px 32px',
                  borderRadius: 8,
                  border: '1px solid var(--astryx-color-border-default, #d1d5db)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.6,
                  }}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Filter pills */}
          {filterPills && filterKey ? (
            <Stack direction="horizontal" gap={2} wrap="wrap">
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
                      padding: '4px 12px',
                      borderRadius: 999,
                      border: '1px solid var(--astryx-color-border-default, #d1d5db)',
                      background: isActive
                        ? 'var(--astryx-color-background-accent, #0866ff)'
                        : 'transparent',
                      color: isActive ? 'white' : 'inherit',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {pill.label} <span style={{ opacity: isActive ? 0.9 : 0.6 }}>({count})</span>
                  </button>
                )
              })}
            </Stack>
          ) : null}

          {/* View mode switcher */}
          <Stack direction="horizontal" gap={1} align="center">
            <Button
              label=""
              variant={effectiveMode === 'cards' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              label=""
              variant={effectiveMode === 'table' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table2 size={16} />
            </Button>
          </Stack>

          {onCreateClick && createLabel ? (
            <Button label={createLabel} variant="primary" size="sm" onClick={onCreateClick} />
          ) : null}
        </Stack>

        {/* Result count + page size */}
        <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
          <Text type="supporting" as="div">
            Showing {paginated.length} of {sorted.length}{' '}
            {sorted.length === 1 ? 'record' : 'records'}
            {search || activeFilter !== 'all' ? ` (filtered from ${rows.length})` : ''}
          </Text>
          {sorted.length > pageSizeOptions[0] ? (
            <Selector
              label="Per page"
              isLabelHidden
              value={String(pageSize)}
              onChange={(v) => setPageSize(Number(v ?? 10))}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} / page` }))}
              size="sm"
              width={110}
            />
          ) : null}
        </Stack>
      </Stack>

      {/* Content */}
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
        <Grid columns={{ minWidth: 300, max: 3 }} gap={3}>
          {paginated.map((row) => {
            const card = toCard(row)
            return (
              <Card key={String(row.id ?? JSON.stringify(row).slice(0, 20))} padding={4}>
                <Stack gap={3}>
                  {/* Header */}
                  <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
                    <Stack gap={1}>
                      <Text type="label" as="div" weight="semibold">
                        {card.title}
                      </Text>
                      {card.idBadge ? (
                        <Text type="code" as="div" color="secondary">
                          {card.idBadge}
                        </Text>
                      ) : null}
                    </Stack>
                    {card.statusBadge ? (
                      <Badge
                        variant={card.statusBadge.variant as any}
                        label={card.statusBadge.label}
                      />
                    ) : null}
                  </Stack>
                  <Divider />
                  {/* Metrics */}
                  <Grid columns={2} gap={2}>
                    {card.metrics.map((m, i) => (
                      <Stack key={i} gap={1}>
                        <Text type="supporting" as="div" color="secondary">
                          {m.label}
                        </Text>
                        <Text type="body" as="div" weight="medium">
                          {m.value}
                        </Text>
                      </Stack>
                    ))}
                  </Grid>
                  {card.actions ? (
                    <>
                      <Divider />
                      <div>{card.actions}</div>
                    </>
                  ) : null}
                </Stack>
              </Card>
            )
          })}
        </Grid>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            data={paginated}
            columns={columns}
            idKey={(row: Row) => String(row.id ?? JSON.stringify(row).slice(0, 40))}
            density="compact"
            dividers="rows"
            isStriped
            hasHover
            textOverflow="truncate"
          />
          {/* Sortable header overlay — clickable headers */}
          <Stack direction="horizontal" gap={2} wrap="wrap">
            {columns
              .filter((c) => c.key !== '__action')
              .map((c) => (
                <button
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid transparent',
                    background:
                      sortKey === c.key
                        ? 'var(--astryx-color-background-muted, #f0f2f5)'
                        : 'transparent',
                    cursor: 'pointer',
                    fontWeight: sortKey === c.key ? 600 : 400,
                  }}
                >
                  {c.header} {sortKey === c.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </button>
              ))}
          </Stack>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <Stack direction="horizontal" gap={2} align="center" justify="center">
          <Button
            label=""
            variant="secondary"
            size="sm"
            isDisabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Text type="supporting" as="div">
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            label=""
            variant="secondary"
            size="sm"
            isDisabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </Stack>
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
