import { router, usePage } from '@inertiajs/react'
import { useCallback, useMemo, useRef, useState } from 'react'

interface FilterState {
  filters: Record<string, Set<string>>
  page: number
  sort: string
}

/**
 * URL-synced filter, sort, and pagination state manager.
 *
 * Parses the current URL search params on mount, keeps local state in sync,
 * and debounces router.get calls to coalesce rapid updates.
 */
export function useFilter(defaultSort = 'newest') {
  const { url } = usePage()
  const searchParams = new URLSearchParams(url.split('?')[1])

  const pendingReplaceRef = useRef<number | null>(null)

  const initialState = useMemo((): FilterState => {
    const filters: Record<string, Set<string>> = {}
    let page = 1
    let sort = defaultSort

    const paramGroups: Record<string, string[]> = {}

    searchParams.forEach((value, key) => {
      if (!paramGroups[key]) paramGroups[key] = []
      paramGroups[key].push(value)
    })

    Object.entries(paramGroups).forEach(([key, values]) => {
      if (key === 'page') {
        page = Math.max(1, Number.parseInt(values[0], 10) || 1)
      } else if (key === 'sort') {
        sort = values[0] || defaultSort
      } else {
        filters[key] = new Set(values)
      }
    })

    return { filters, page, sort }
  }, [url])

  const [state, setState] = useState<FilterState>(initialState)

  const scheduleReplace = useCallback(
    (qs: string) => {
      if (pendingReplaceRef.current) {
        clearTimeout(pendingReplaceRef.current)
        pendingReplaceRef.current = null
      }

      pendingReplaceRef.current = window.setTimeout(() => {
        Promise.resolve().then(() => {
          try {
            const href = qs ? `?${qs}` : window.location.pathname
            router.get(href, undefined, {
              replace: true,
              preserveScroll: true,
              preserveState: true,
            })
          } catch {
            // Safety net — router.replace should work in client hooks
          }
        })
        pendingReplaceRef.current = null
      }, 50)
    },
    []
  )

  const updateURLFromState = useCallback(
    (nextState: FilterState) => {
      const params = new URLSearchParams()

      Object.entries(nextState.filters).forEach(([category, values]) => {
        if (!values || values.size === 0) return
        values.forEach((v) => params.append(category, v))
      })

      if (nextState.page > 1) params.set('page', String(nextState.page))
      if (nextState.sort && nextState.sort !== defaultSort) params.set('sort', nextState.sort)

      scheduleReplace(params.toString())
    },
    [scheduleReplace, defaultSort]
  )

  const toggleFilter = useCallback(
    (category: string, value: string) => {
      setState((prev) => {
        const current = prev.filters[category] ?? new Set<string>()
        const nextSet = new Set(current)

        if (nextSet.has(value)) nextSet.delete(value)
        else nextSet.add(value)

        const nextFilters = { ...prev.filters }
        if (nextSet.size === 0) delete nextFilters[category]
        else nextFilters[category] = nextSet

        const nextState: FilterState = { ...prev, filters: nextFilters, page: 1 }
        updateURLFromState(nextState)
        return nextState
      })
    },
    [updateURLFromState]
  )

  const clearFilters = useCallback(() => {
    setState((prev) => {
      const nextState: FilterState = { ...prev, filters: {}, page: 1 }
      updateURLFromState(nextState)
      return nextState
    })
  }, [updateURLFromState])

  const removeSingleFilter = useCallback(
    (category: string, value: string) => {
      setState((prev) => {
        const current = prev.filters[category]
        if (!current || !current.has(value)) return prev

        const nextSet = new Set(current)
        nextSet.delete(value)

        const nextFilters = { ...prev.filters }
        if (nextSet.size === 0) delete nextFilters[category]
        else nextFilters[category] = nextSet

        const nextState: FilterState = { ...prev, filters: nextFilters, page: 1 }
        updateURLFromState(nextState)
        return nextState
      })
    },
    [updateURLFromState]
  )

  const changePage = useCallback(
    (page: number) => {
      setState((prev) => {
        if (page === prev.page || page < 1) return prev
        const nextState: FilterState = { ...prev, page }
        updateURLFromState(nextState)
        return nextState
      })
    },
    [updateURLFromState]
  )

  const changeSort = useCallback(
    (newSort: string) => {
      setState((prev) => {
        if (newSort === prev.sort) return prev
        const nextState: FilterState = { ...prev, sort: newSort, page: 1 }
        updateURLFromState(nextState)
        return nextState
      })
    },
    [updateURLFromState]
  )

  const batchUpdateFilters = useCallback(
    (updates: Record<string, string[]>) => {
      setState((prev) => {
        const nextFilters: Record<string, Set<string>> = { ...prev.filters }
        Object.entries(updates).forEach(([k, vals]) => {
          if (!vals || vals.length === 0) delete nextFilters[k]
          else nextFilters[k] = new Set(vals)
        })
        const nextState: FilterState = { ...prev, filters: nextFilters, page: 1 }
        updateURLFromState(nextState)
        return nextState
      })
    },
    [updateURLFromState]
  )

  const hasSelectedFilters = useMemo(() => {
    return Object.values(state.filters).some((s) => s.size > 0)
  }, [state.filters])

  const totalActiveFilters = useMemo(() => {
    return Object.values(state.filters).reduce((acc, s) => acc + s.size, 0)
  }, [state.filters])

  const activeFiltersByCategory = useMemo(() => {
    return Object.fromEntries(Object.entries(state.filters).map(([k, v]) => [k, Array.from(v)]))
  }, [state.filters])

  return {
    filters: state.filters,
    page: state.page,
    sort: state.sort,

    /** True while a filter-triggered navigation is in flight. Currently always false. */
    isPending: false,

    toggleFilter,
    clearFilters,
    removeSingleFilter,
    changePage,
    changeSort,
    batchUpdateFilters,

    hasSelectedFilters,
    totalActiveFilters,
    activeFiltersByCategory,
  }
}
