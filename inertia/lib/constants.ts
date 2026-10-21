/**
 * Navigation configuration — single source of truth for sidebar, mobile nav,
 * and breadcrumb label resolution.
 */
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Package, Truck, Box, RotateCcw, Scale, Building2, Users, CreditCard, ListChecks, Upload, ScrollText, Shield, Tags, Warehouse, MapPin, } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon?: LucideIcon
  badge?: string
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export const NAVIGATION: NavSection[] = [
  {
    title: 'Dashboard',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Orders',
    items: [
      { href: '/orders', label: 'Orders', icon: Package },
      { href: '/shipments', label: 'Shipments & Invoices', icon: Truck },
      { href: '/returns', label: 'Returns & Refunds', icon: RotateCcw },
      { href: '/claims', label: 'Marketplace Claims', icon: Scale },
      { href: '/seller-accounts', label: 'Seller Accounts', icon: Building2 },
    ],
  },
  {
    title: 'Product & Catalog',
    items: [
      { href: '/inventory', label: 'Inventory', icon: Warehouse },
      { href: '/products', label: 'Products', icon: Box },
      { href: '/catalogs', label: 'Catalogs', icon: Tags },
    ],
  },
  {
    title: 'People',
    items: [
      { href: '/customers', label: 'Customers & Risk', icon: Users },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/finance', label: 'Finance & Cards', icon: CreditCard },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/tasks', label: 'Tasks & Reminders', icon: ListChecks },
      { href: '/import', label: 'Bulk Import', icon: Upload },
      { href: '/audit', label: 'Audit History', icon: ScrollText },
      { href: '/address-cleanup', label: 'Address Cleanup', icon: MapPin },
    ],
  },
  {
    title: 'Admin',
    items: [
      { href: '/admin', label: 'Users & RBAC', icon: Shield },
    ],
  },
]

/** Flat list for TopNav / simple iteration */
export const NAV_FLAT: NavItem[] = NAVIGATION.flatMap((section) => section.items,)

/**
 * Pages that should NOT get the authenticated AppLayout wrapper.
 * These render with their own layout (auth, marketing, or none).
 */
export const PUBLIC_PAGES = [
  'home',
  'auth/login',
  'auth/signup',
  'errors/not_found',
  'errors/server_error',
] as const

/**
 * URL segment → human-readable label for breadcrumb generation.
 */
export const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Dashboard',
  orders: 'Orders',
  shipments: 'Shipments',
  inventory: 'Inventory',
  products: 'Products',
  catalogs: 'Catalogs',
  returns: 'Returns',
  claims: 'Claims',
  customers: 'Customers',
  finance: 'Finance',
  tasks: 'Tasks',
  import: 'Bulk Import',
  audit: 'Audit History',
  'address-cleanup': 'Address Cleanup',
  admin: 'Users & RBAC',
  'seller-accounts': 'Seller Accounts',
  accounts: 'Accounts',
  auth: 'Auth',
  login: 'Sign In',
  signup: 'Sign Up',
  settings: 'Settings',
  tools: 'Tools',
}

/**
 * Normalize a URL path so trailing slashes and query strings do not
 * interfere with route matching.
 */
export function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] || '/'
  const normalized = `/${path.split('/').filter(Boolean).join('/')}`
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '')
}

/**
 * Check whether a page identifier is public.
 * Accepts paths such as /auth/login and /errors/not_found.
 */
export function isPublicPage(pathname: string): boolean {
  const normalized = normalizePath(pathname)
  const pageId = normalized.replace(/^\/+/, '')

  return PUBLIC_PAGES.some((page) => page === pageId)
}

/**
 * Resolve breadcrumb labels from a URL path.
 * Unknown segments are converted from kebab-case to readable text.
 */
export function getBreadcrumbs(pathname: string): Array<{
  href: string
  label: string
}> {
  const normalized = normalizePath(pathname)
  const segments = normalized.split('/').filter(Boolean)

  if (segments.length === 0) {
    return [{ href: '/', label: ROUTE_LABELS[''] }]
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const fallbackLabel = decodeURIComponent(segment)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())

    return {
      href,
      label: ROUTE_LABELS[segment] ?? fallbackLabel,
    }
  })
}