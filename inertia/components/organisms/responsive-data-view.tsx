import { type ReactNode, useState, useEffect, useMemo } from 'react'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import type { TableColumn } from '@astryxdesign/core/Table'
import { Card } from '@astryxdesign/core/Card'
import { Stack, HStack, VStack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Package, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatMoney, formatDate, shortId } from '~/lib/utils'
import { StatusBadge } from '../atoms/status-badge'
import { MonoBadge } from '../atoms/mono-badge'
import { IconAvatar } from '../atoms/icon-avatar'
import { AppButton } from '../atoms/button'
import { SearchInputBar } from '../molecules/search-input-bar'
import { FilterPillGroup, type FilterPill } from '../molecules/filter-pill-group'
import { ViewModeSwitcher, type ViewModeOption } from '../molecules/view-mode-switcher'
import { SortPillBar } from '../molecules/sort-pill-bar'
import { PaginationBar } from '../molecules/pagination-bar'
import { RecordCard, type CardData } from '../molecules/record-card'

export type Row = Record<string, any>

export function displayValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (o.fullName) return String(o.fullName)
    if (o.name) return String(o.name)
    if (o.email) return String(o.email)
    if (o.title) return String(o.title)
    return o.id ? shortId(o.id) : JSON.stringify(v).slice(0, 40)
  }
  return String(v)
}

export type TableDensity = 'comfortable' | 'standard' | 'compact'

export interface AppTableColumn<T = Row> {
  key: string
  header: ReactNode
  align?: 'left' | 'center' | 'right' | 'end'
  width?: string | number
  sortable?: boolean
  render?: (row: T, index: number) => ReactNode
}

export interface AppTableProps<T = Row> {
  data: T[]
  columns: AppTableColumn<T>[]
  idKey?: (row: T) => string
  density?: TableDensity
  zebra?: boolean
  hover?: boolean
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (colKey: string) => void
  selectedIds?: string[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

export function AppTable<T extends Row = Row>({
  data,
  columns,
  idKey = (r) => String(r.id ?? JSON.stringify(r).slice(0, 32)),
  density = 'standard',
  zebra = true,
  hover = true,
  sortKey,
  sortDir = 'asc',
  onSort,
  selectedIds = [],
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
  emptyAction,
  className = '',
}: AppTableProps<T>) {
  const cellPadding =
    density === 'comfortable' ? 'py-4 px-5' : density === 'compact' ? 'py-2.5 px-3' : 'py-3.5 px-4'

  if (!data || data.length === 0) {
    return (
      <VStack
        gap={4}
        paddingBlock={10}
        paddingInline={6}
        hAlign="center"
        vAlign="center"
        className={`rounded-2xl border border-card-border bg-card text-center shadow-2xs ${className}`}
      >
        <IconAvatar icon={Package} tone="neutral" size="lg" />
        <VStack gap={1} hAlign="center" maxWidth={440}>
          <h3 className="text-base font-bold text-foreground">{emptyTitle}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{emptyDescription}</p>
        </VStack>
        {emptyAction && (
          <VStack hAlign="center" paddingBlockStart={1}>
            {emptyAction}
          </VStack>
        )}
      </VStack>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-card-border bg-card overflow-hidden shadow-2xs ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-secondary select-none">
            <tr>
              {columns.map((col) => {
                const isRight = col.align === 'right' || col.align === 'end'
                const isCenter = col.align === 'center'
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={`${cellPadding} whitespace-nowrap ${
                      isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                    } ${col.sortable ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        isRight ? 'justify-end w-full' : isCenter ? 'justify-center w-full' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider text-xs sm:text-sm text-text-primary">
            {data.map((row, idx) => {
              const rowId = idKey(row)
              const isSelected = selectedIds.includes(rowId)
              return (
                <tr
                  key={rowId}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-primary-subtle/40'
                      : zebra && idx % 2 === 1
                        ? 'bg-subtle/35'
                        : 'bg-card'
                  } ${hover ? 'hover:bg-muted-hover/60' : ''}`}
                >
                  {columns.map((col) => {
                    const isRight = col.align === 'right' || col.align === 'end'
                    const isCenter = col.align === 'center'
                    return (
                      <td
                        key={col.key}
                        className={`${cellPadding} align-middle ${
                          isRight
                            ? 'text-right font-mono tabular-nums'
                            : isCenter
                              ? 'text-center'
                              : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row, idx) : displayValue(row[col.key])}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

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
      <Card variant="muted" padding={5}>
        <Text type="supporting" justify="center" display="block">
          {empty ?? 'No records yet.'}
        </Text>
      </Card>
    )
  }
  return (
    <Card padding={0}>
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
    </Card>
  )
}

export const col = {
  text: (key: string, header: string, width?: number): TableColumn<Row> => ({
    key,
    header,
    width: width ? pixel(width) : proportional(1),
    renderCell: (row: Row) => (
      <Text type="body" size="sm" maxLines={1}>
        {displayValue(row[key])}
      </Text>
    ),
  }),
  id: (key: string, header = 'ID'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(130),
    renderCell: (row: Row) => <MonoBadge>{shortId(row[key])}</MonoBadge>,
  }),
  money: (key: string, header: string, currencyKey = 'currencyCode'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(120),
    align: 'end',
    renderCell: (row: Row) => (
      <Text type="body" size="sm" weight="semibold" hasTabularNumbers>
        {formatMoney(row[currencyKey] as string, row[key])}
      </Text>
    ),
  }),
  date: (key: string, header: string): TableColumn<Row> => ({
    key,
    header,
    width: pixel(150),
    renderCell: (row: Row) => (
      <Text type="supporting" size="xsm">
        {formatDate(row[key])}
      </Text>
    ),
  }),
  badge: (key: string, header: string, toneMap?: Record<string, string>): TableColumn<Row> => ({
    key,
    header,
    width: pixel(130),
    renderCell: (row: Row) => {
      const v = String(row[key] ?? '—')
      const tone = toneMap?.[v] ?? 'neutral'
      return <StatusBadge variant={tone} label={v.replace(/_/g, ' ')} />
    },
  }),
  action: (header: string, render: (row: Row) => ReactNode): TableColumn<Row> => ({
    key: '__action',
    header,
    width: pixel(240),
    renderCell: render,
  }),
}

export type ResponsiveDataViewProps = {
  rows: Row[]
  columns: TableColumn<Row>[]
  toCard: (row: Row) => CardData
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  searchKeys?: string[]
  filterPills?: FilterPill[]
  filterKey?: string
  defaultViewMode?: ViewModeOption
  pageSizeOptions?: number[]
  createLabel?: string
  onCreateClick?: () => void
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10
  className?: string
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
  padding,
  className,
}: ResponsiveDataViewProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10)
  const [viewMode, setViewMode] = useState<ViewModeOption>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sc_view_mode') as ViewModeOption | null
      return saved ?? defaultViewMode
    }
    return defaultViewMode
  })
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const mTablet = window.matchMedia('(max-width: 1023px)')
    const handler = () => setIsTablet(mTablet.matches)
    handler()
    mTablet.addEventListener('change', handler)
    return () => mTablet.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sc_view_mode', viewMode)
    }
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
      <VStack
        gap={4}
        paddingBlock={10}
        paddingInline={6}
        hAlign="center"
        vAlign="center"
        className="rounded-2xl border border-dashed border-border bg-card text-center shadow-2xs"
      >
        <IconAvatar icon={Package} tone="neutral" size="lg" />
        <VStack gap={1.5} hAlign="center" maxWidth={440}>
          <h3 className="text-base font-bold text-foreground tracking-tight">{emptyTitle}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {emptyDescription ?? 'Get started by creating your first record.'}
          </p>
        </VStack>
        {(emptyAction || (onCreateClick && createLabel)) && (
          <VStack hAlign="center" paddingBlockStart={1}>
            {emptyAction ??
              (onCreateClick && createLabel ? (
                <AppButton
                  label={createLabel}
                  variant="primary"
                  size="md"
                  onClick={onCreateClick}
                />
              ) : null)}
          </VStack>
        )}
      </VStack>
    )
  }

  return (
    <VStack gap={4} padding={padding} className={className}>
      {/* Toolbar */}
      <Card variant="muted" padding={4}>
        <VStack gap={3}>
          <Stack
            direction="horizontal"
            wrap="wrap"
            vAlign="center"
            hAlign="between"
            gap={3}
            className="w-full"
          >
            <div className="flex-1 min-w-[200px]">
              {searchKeys.length > 0 && <SearchInputBar value={search} onChange={setSearch} />}
            </div>
            <HStack gap={2} wrap="wrap" vAlign="center" className="self-end sm:self-auto">
              <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
              {onCreateClick && createLabel && (
                <AppButton
                  label={createLabel}
                  variant="primary"
                  size="sm"
                  onClick={onCreateClick}
                />
              )}
            </HStack>
          </Stack>

          {filterPills && filterKey && (
            <FilterPillGroup
              pills={filterPills}
              activeValue={activeFilter}
              onSelect={setActiveFilter}
              getCount={(val) =>
                val === 'all'
                  ? rows.length
                  : rows.filter((r) => String(r[filterKey] ?? '') === val).length
              }
            />
          )}

          <Stack gap={3} wrap="wrap" vAlign="center" hAlign="between">
            <div className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground font-semibold">{paginated.length}</strong>{' '}
              of <strong className="text-foreground font-semibold">{sorted.length}</strong>{' '}
              {sorted.length === 1 ? 'record' : 'records'}
              {(search || activeFilter !== 'all') && <span> · filtered from {rows.length}</span>}
              {sortKey && (
                <span>
                  {' '}
                  · sorted by <strong className="text-foreground font-medium">
                    {sortKey}
                  </strong>{' '}
                  {sortDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>

            {sorted.length > (pageSizeOptions[0] ?? 10) && (
              <select
                aria-label="Records per page"
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value || 10))}
                className="h-8 px-2.5 rounded-xl border border-input-border bg-card text-foreground text-xs font-medium cursor-pointer"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} / page
                  </option>
                ))}
              </select>
            )}
          </Stack>
        </VStack>
      </Card>

      {/* Content */}
      {sorted.length === 0 ? (
        <VStack
          gap={4}
          paddingBlock={10}
          paddingInline={6}
          hAlign="center"
          vAlign="center"
          className="rounded-2xl border border-dashed border-border bg-card text-center shadow-2xs"
        >
          <IconAvatar icon={Filter} tone="warning" size="md" />
          <VStack gap={1.5} hAlign="center" maxWidth={440}>
            <h3 className="text-sm font-bold text-foreground">No matching records</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search query or active filter pills.
            </p>
          </VStack>
          <VStack hAlign="center" paddingBlockStart={1}>
            <AppButton
              label="Clear filters"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setActiveFilter('all')
              }}
            />
          </VStack>
        </VStack>
      ) : effectiveMode === 'cards' ? (
        <Grid columns={{ minWidth: 280, max: 3 }} gap={4}>
          {paginated.map((row) => (
            <RecordCard
              key={String(row.id ?? JSON.stringify(row).slice(0, 24))}
              card={toCard(row)}
            />
          ))}
        </Grid>
      ) : (
        <VStack gap={3}>
          <Card padding={0}>
            <Table
              data={paginated}
              columns={columns.map((c) => {
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
          </Card>

          <SortPillBar
            columns={columns.map((c) => ({ key: c.key, header: String(c.header) }))}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </VStack>
      )}

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={sorted.length}
        onPageChange={setPage}
      />
    </VStack>
  )
}
