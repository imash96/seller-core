import { type ReactNode, useState, useEffect, useMemo } from 'react'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import type { TableColumn } from '@astryxdesign/core/Table'
import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Package, Filter } from 'lucide-react'
import { formatMoney, formatDate, shortId } from '~/lib/utils'
import { StatusBadge } from '../atoms/status-badge'
import { MonoBadge } from '../atoms/mono-badge'
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
      <Text type="body" size="sm" maxLines={1}>{displayValue(row[key])}</Text>
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
      <Text type="supporting" size="xsm">{formatDate(row[key])}</Text>
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
      <Card variant="muted" padding={5}>
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
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-muted/35 border border-border rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchKeys.length > 0 ? (
            <SearchInputBar value={search} onChange={setSearch} />
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
            {onCreateClick && createLabel && (
              <Button label={createLabel} variant="primary" size="sm" onClick={onCreateClick} />
            )}
          </div>
        </div>

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

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-0.5">
          <div>
            Showing <strong className="text-foreground font-semibold">{paginated.length}</strong> of{' '}
            <strong className="text-foreground font-semibold">{sorted.length}</strong>{' '}
            {sorted.length === 1 ? 'record' : 'records'}
            {(search || activeFilter !== 'all') && (
              <span> · filtered from {rows.length}</span>
            )}
            {sortKey && (
              <span>
                {' '}
                · sorted by <strong className="text-foreground">{sortKey}</strong>{' '}
                {sortDir === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>

          {sorted.length > (pageSizeOptions[0] ?? 10) && (
            <select
              aria-label="Records per page"
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value || 10))}
              className="h-7 px-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={String(n)}>
                  {n} / page
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {sorted.length === 0 ? (
        <Card variant="muted" padding={5}>
          <EmptyState
            title="No matching records"
            description="Try adjusting your search query or active filter pills."
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
        </Card>
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
    </div>
  )
}
