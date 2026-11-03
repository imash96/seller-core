import { type ReactNode, useState, useEffect, useMemo } from 'react'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import type { TableColumn } from '@astryxdesign/core/Table'
import { Package, Filter } from 'lucide-react'
import { convertToLocale, formatDate, shortId } from '~/lib/utils'
import { AppButton } from '../atoms/button'
import { StatusBadge } from '../atoms/status-badge'
import { MonoBadge } from '../atoms/mono-badge'
import { MultiCurrencyPriceStack } from '../atoms/currency-text'
import { MoneyDisplay } from '../atoms/money-display'
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
    if ('currency_code' in o && 'amount' in o) {
      return convertToLocale({
        amount: Number(o.amount ?? 0),
        currency_code: String(o.currency_code || 'USD'),
      })
    }
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
      <div className="rounded-xl border border-dashed border-border bg-muted/25 p-6 text-center text-sm text-muted-foreground">
        {empty ?? 'No records yet.'}
      </div>
    )
  }
  return (
    <div className="w-full overflow-x-auto rounded   border border-border bg-card">
      <Table
        data={rows}
        columns={columns}
        idKey={(row: Row) => String(row.id ?? JSON.stringify(row).slice(0, 40))}
        density="spacious"
        dividers="rows"
        isStriped
        hasHover
        textOverflow="truncate"
        verticalAlign="top"
        rowCount={rows.length}
      />
    </div>
  )
}

export const col = {
  text: (key: string, header: string, width?: number): TableColumn<Row> => ({
    key,
    header,
    width: width ? pixel(width) : proportional(1),
    renderCell: (row: Row) => (
      <span className="text-xs sm:text-sm text-foreground truncate block">
        {displayValue(row[key])}
      </span>
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
    width: pixel(140),
    align: 'end',
    renderCell: (row: Row) => {
      const moneyKey = key.endsWith('Amount') ? `${key.slice(0, -6)}Money` : `${key}Money`
      const moneyObj = row[moneyKey] ?? row[`${key}Money`] ?? row[key]
      const fallbackCur = String(row[currencyKey] ?? row.currencyCode ?? 'USD')
      return <MoneyDisplay value={moneyObj} fallbackCurrency={fallbackCur} />
    },
  }),
  multiPrice: (key = 'prices', header = 'Multi-Currency Prices'): TableColumn<Row> => ({
    key,
    header,
    width: pixel(220),
    renderCell: (row: Row) => (
      <MultiCurrencyPriceStack
        prices={row[key] ?? row.price}
        fallbackAmount={row.retailPrice ?? row.listedPrice ?? row.totalAmount ?? 0}
        fallbackCurrencyCode={String(row.currencyCode || 'USD')}
        compact
      />
    ),
  }),
  date: (key: string, header: string): TableColumn<Row> => ({
    key,
    header,
    width: pixel(150),
    renderCell: (row: Row) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(row[key])}
      </span>
    ),
  }),
  badge: (key: string, header: string, toneMap?: Record<string, string>): TableColumn<Row> => ({
    key,
    header,
    width: pixel(135),
    renderCell: (row: Row) => {
      const v = String(row[key] ?? '—')
      const tone = toneMap?.[v] ?? 'neutral'
      return <StatusBadge variant={tone as any} label={v.replace(/_/g, ' ')} />
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
      try {
        const saved = localStorage.getItem('sc_view_mode')
        if (saved === 'auto' || saved === 'cards' || saved === 'table') return saved
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
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
      try {
        localStorage.setItem('sc_view_mode', viewMode)
      } catch {
        /* Optional preference. */
      }
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
      const q = search.trim().toLowerCase()
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
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
          <Package className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-foreground">{emptyTitle}</h3>
          <p className="text-xs text-muted-foreground">
            {emptyDescription ?? 'Get started by creating your first record.'}
          </p>
        </div>
        {(emptyAction || (onCreateClick && createLabel)) && (
          <div className="pt-1 flex items-center justify-center">
            {emptyAction ??
              (onCreateClick && createLabel ? (
                <AppButton
                  label={createLabel}
                  variant="primary"
                  size="sm"
                  onClick={onCreateClick}
                />
              ) : null)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Toolbar */}
      <div className="rounded-2xl border border-card-border bg-muted/30 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchKeys.length > 0 ? (
            <div className="flex-1 min-w-0">
              <SearchInputBar value={search} onChange={setSearch} />
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap shrink-0">
            <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
            {onCreateClick && createLabel && (
              <AppButton label={createLabel} variant="primary" size="sm" onClick={onCreateClick} />
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

        <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-muted-foreground pt-1 border-t border-border/60">
          <div>
            Showing <strong className="text-foreground font-semibold">{paginated.length}</strong> of{' '}
            <strong className="text-foreground font-semibold">{sorted.length}</strong>{' '}
            {sorted.length === 1 ? 'record' : 'records'}
            {(search || activeFilter !== 'all') && <span> · filtered from {rows.length}</span>}
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
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-3">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
            <Filter className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-foreground">No matching records</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search query or active filter pills.
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center">
            <AppButton
              label="Clear filters"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setActiveFilter('all')
              }}
            />
          </div>
        </div>
      ) : effectiveMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((row) => (
            <RecordCard
              key={String(row.id ?? JSON.stringify(row).slice(0, 24))}
              card={toCard(row)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 w-full min-w-0">
          <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
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
              rowIndexStart={(currentPage - 1) * pageSize + 1}
              rowCount={sorted.length}
              dividers="rows"
              isStriped
              hasHover
              textOverflow="truncate"
            />
          </div>

          <SortPillBar
            columns={columns.map((c) => ({ key: c.key, header: String(c.header) }))}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
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
