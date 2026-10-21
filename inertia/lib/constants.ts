/**
 * Navigation configuration — single source of truth for sidebar, mobile nav,
 * and breadcrumb label resolution.
 */
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  Truck,
  Box,
  RotateCcw,
  Scale,
  Building2,
  Users,
  CreditCard,
  ListChecks,
  Upload,
  ScrollText,
  Shield,
} from 'lucide-react'

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
      { href: '/dashboard', label: 'Dashboard & KPIs', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Orders',
    items: [
      { href: '/orders', label: 'Orders', icon: Package },
      { href: '/shipments', label: 'Shipments & Invoices', icon: Truck },
      { href: '/products', label: 'Products & Catalog', icon: Box },
      { href: '/returns', label: 'Returns & Refunds', icon: RotateCcw },
      { href: '/claims', label: 'Marketplace Claims', icon: Scale },
      { href: '/seller-accounts', label: 'Seller Accounts', icon: Building2 },
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
export const NAV_FLAT: NavItem[] = NAVIGATION.flatMap((s) => s.items)

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
]

/**
 * URL segment → human-readable label for breadcrumb generation.
 */
export const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Dashboard',
  orders: 'Orders',
  shipments: 'Shipments',
  products: 'Products',
  returns: 'Returns',
  claims: 'Claims',
  customers: 'Customers',
  finance: 'Finance',
  tasks: 'Tasks',
  import: 'Bulk Import',
  audit: 'Audit History',
  admin: 'Users & RBAC',
  'seller-accounts': 'Seller Accounts',
  accounts: 'Accounts',
  auth: 'Auth',
  login: 'Sign In',
  signup: 'Sign Up',
  settings: 'Settings',
  tools: 'Tools',
}
