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
  Tags,
  Warehouse,
  MapPin,
  Globe,
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
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Product & Catalog Pipeline',
    items: [
      { href: '/catalogs', label: 'Catalog (Master)', icon: Tags },
      { href: '/products', label: 'Products & Variants', icon: Box },
      { href: '/listings', label: 'Platform Listings', icon: Globe },
      { href: '/inventory', label: 'Inventory & Stock', icon: Warehouse },
    ],
  },
  {
    title: 'Orders & Fulfillment',
    items: [
      { href: '/orders', label: 'Orders', icon: Package },
      { href: '/shipments', label: 'Shipments & Invoices', icon: Truck },
      { href: '/returns', label: 'Returns & Refunds', icon: RotateCcw },
      { href: '/claims', label: 'Marketplace Claims', icon: Scale },
      { href: '/seller-accounts', label: 'Seller Accounts', icon: Building2 },
    ],
  },
  {
    title: 'People',
    items: [{ href: '/customers', label: 'Customers & Risk', icon: Users }],
  },
  {
    title: 'Finance',
    items: [{ href: '/finance', label: 'Finance & Cards', icon: CreditCard }],
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
    items: [{ href: '/admin', label: 'Users & RBAC', icon: Shield }],
  },
]

/** Flat list for TopNav / simple iteration */
export const NAV_FLAT: NavItem[] = NAVIGATION.flatMap((section) => section.items)

/**
 * Pages that should NOT get the authenticated AppLayout wrapper.
 * These render with their own layout (auth, marketing, or none).
 */
export const PUBLIC_PAGES = [
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
  'dashboard': 'Dashboard',
  'orders': 'Orders',
  'shipments': 'Shipments',
  'inventory': 'Inventory',
  'products': 'Products & Variants',
  'catalog': 'Catalog (Master)',
  'catalogs': 'Catalog (Master)',
  'listing': 'Platform Listings',
  'listings': 'Platform Listings',
  'returns': 'Returns',
  'claims': 'Claims',
  'customers': 'Customers',
  'seller-accounts': 'Seller Accounts',
  'finance': 'Finance & Cards',
  'tasks': 'Tasks & Reminders',
  'import': 'Bulk Import',
  'audit': 'Audit History',
  'admin': 'Users & RBAC',
  'address-cleanup': 'Address Cleanup',
}

export const MODULE_KEYS = [
  { key: 'orders', label: 'Orders' },
  { key: 'products', label: 'Products & Catalog' },
  { key: 'customers', label: 'Customers' },
  { key: 'shipments', label: 'Shipments & Invoices' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'claims', label: 'Marketplace Claims' },
  { key: 'finance', label: 'Finance & Ledger' },
  { key: 'tasks', label: 'Tasks & Reminders' },
  { key: 'import', label: 'Bulk Import' },
  { key: 'audit', label: 'Audit Logs' },
] as const

export const MARKETPLACE_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  ebay: 'eBay',
  etsy: 'Etsy',
  shopify: 'Shopify',
  direct: 'Direct Webstore',
  medusa: 'Medusa Website',
  other: 'Other',
}
