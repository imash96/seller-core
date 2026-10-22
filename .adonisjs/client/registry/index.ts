/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [[0,"dashboard"]],
    types: placeholder as Registry['dashboard']['types'],
  },
  'pages.orders': {
    methods: ["GET","HEAD"],
    pattern: '/orders',
    tokens: [[0,"orders"]],
    types: placeholder as Registry['pages.orders']['types'],
  },
  'pages.customers': {
    methods: ["GET","HEAD"],
    pattern: '/customers',
    tokens: [[0,"customers"]],
    types: placeholder as Registry['pages.customers']['types'],
  },
  'pages.products': {
    methods: ["GET","HEAD"],
    pattern: '/products',
    tokens: [[0,"products"]],
    types: placeholder as Registry['pages.products']['types'],
  },
  'pages.inventory': {
    methods: ["GET","HEAD"],
    pattern: '/inventory',
    tokens: [[0,"inventory"]],
    types: placeholder as Registry['pages.inventory']['types'],
  },
  'pages.catalogs': {
    methods: ["GET","HEAD"],
    pattern: '/catalogs',
    tokens: [[0,"catalogs"]],
    types: placeholder as Registry['pages.catalogs']['types'],
  },
  'pages.accounts': {
    methods: ["GET","HEAD"],
    pattern: '/seller-accounts',
    tokens: [[0,"seller-accounts"]],
    types: placeholder as Registry['pages.accounts']['types'],
  },
  'pages.shipments': {
    methods: ["GET","HEAD"],
    pattern: '/shipments',
    tokens: [[0,"shipments"]],
    types: placeholder as Registry['pages.shipments']['types'],
  },
  'pages.returns': {
    methods: ["GET","HEAD"],
    pattern: '/returns',
    tokens: [[0,"returns"]],
    types: placeholder as Registry['pages.returns']['types'],
  },
  'pages.claims': {
    methods: ["GET","HEAD"],
    pattern: '/claims',
    tokens: [[0,"claims"]],
    types: placeholder as Registry['pages.claims']['types'],
  },
  'pages.finance': {
    methods: ["GET","HEAD"],
    pattern: '/finance',
    tokens: [[0,"finance"]],
    types: placeholder as Registry['pages.finance']['types'],
  },
  'pages.tasks': {
    methods: ["GET","HEAD"],
    pattern: '/tasks',
    tokens: [[0,"tasks"]],
    types: placeholder as Registry['pages.tasks']['types'],
  },
  'pages.import': {
    methods: ["GET","HEAD"],
    pattern: '/import',
    tokens: [[0,"import"]],
    types: placeholder as Registry['pages.import']['types'],
  },
  'pages.audit': {
    methods: ["GET","HEAD"],
    pattern: '/audit',
    tokens: [[0,"audit"]],
    types: placeholder as Registry['pages.audit']['types'],
  },
  'pages.address_cleanup': {
    methods: ["GET","HEAD"],
    pattern: '/address-cleanup',
    tokens: [[0,"address-cleanup"]],
    types: placeholder as Registry['pages.address_cleanup']['types'],
  },
  'pages.admin': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [[0,"admin"]],
    types: placeholder as Registry['pages.admin']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'orders.store': {
    methods: ["POST"],
    pattern: '/orders',
    tokens: [[0,"orders"]],
    types: placeholder as Registry['orders.store']['types'],
  },
  'orders.bulk_import': {
    methods: ["POST"],
    pattern: '/orders/bulk-import',
    tokens: [[0,"orders"],[0,"bulk-import"]],
    types: placeholder as Registry['orders.bulk_import']['types'],
  },
  'orders.bulk_status': {
    methods: ["POST"],
    pattern: '/orders/bulk/status',
    tokens: [[0,"orders"],[0,"bulk"],[0,"status"]],
    types: placeholder as Registry['orders.bulk_status']['types'],
  },
  'orders.bulk_export': {
    methods: ["POST"],
    pattern: '/orders/bulk/export',
    tokens: [[0,"orders"],[0,"bulk"],[0,"export"]],
    types: placeholder as Registry['orders.bulk_export']['types'],
  },
  'orders.update_status': {
    methods: ["POST"],
    pattern: '/orders/:id/status',
    tokens: [[0,"orders"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['orders.update_status']['types'],
  },
  'orders.delete': {
    methods: ["POST"],
    pattern: '/orders/:id/delete',
    tokens: [[0,"orders"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['orders.delete']['types'],
  },
  'customers.store': {
    methods: ["POST"],
    pattern: '/customers',
    tokens: [[0,"customers"]],
    types: placeholder as Registry['customers.store']['types'],
  },
  'customers.merge': {
    methods: ["POST"],
    pattern: '/customers/merge',
    tokens: [[0,"customers"],[0,"merge"]],
    types: placeholder as Registry['customers.merge']['types'],
  },
  'customers.update': {
    methods: ["POST"],
    pattern: '/customers/:id',
    tokens: [[0,"customers"],[1,"id"]],
    types: placeholder as Registry['customers.update']['types'],
  },
  'customers.delete': {
    methods: ["POST"],
    pattern: '/customers/:id/delete',
    tokens: [[0,"customers"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['customers.delete']['types'],
  },
  'risk_signals.review': {
    methods: ["POST"],
    pattern: '/risk-signals/:id/review',
    tokens: [[0,"risk-signals"],[1,"id"],[0,"review"]],
    types: placeholder as Registry['risk_signals.review']['types'],
  },
  'brands.store': {
    methods: ["POST"],
    pattern: '/brands',
    tokens: [[0,"brands"]],
    types: placeholder as Registry['brands.store']['types'],
  },
  'brands.update': {
    methods: ["POST"],
    pattern: '/brands/:id',
    tokens: [[0,"brands"],[1,"id"]],
    types: placeholder as Registry['brands.update']['types'],
  },
  'brands.delete': {
    methods: ["POST"],
    pattern: '/brands/:id/delete',
    tokens: [[0,"brands"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['brands.delete']['types'],
  },
  'categories.store': {
    methods: ["POST"],
    pattern: '/categories',
    tokens: [[0,"categories"]],
    types: placeholder as Registry['categories.store']['types'],
  },
  'categories.update': {
    methods: ["POST"],
    pattern: '/categories/:id',
    tokens: [[0,"categories"],[1,"id"]],
    types: placeholder as Registry['categories.update']['types'],
  },
  'categories.delete': {
    methods: ["POST"],
    pattern: '/categories/:id/delete',
    tokens: [[0,"categories"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['categories.delete']['types'],
  },
  'products.store': {
    methods: ["POST"],
    pattern: '/products',
    tokens: [[0,"products"]],
    types: placeholder as Registry['products.store']['types'],
  },
  'products.update': {
    methods: ["POST"],
    pattern: '/products/:id',
    tokens: [[0,"products"],[1,"id"]],
    types: placeholder as Registry['products.update']['types'],
  },
  'products.delete': {
    methods: ["POST"],
    pattern: '/products/:id/delete',
    tokens: [[0,"products"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['products.delete']['types'],
  },
  'variants.store': {
    methods: ["POST"],
    pattern: '/products/:id/variants',
    tokens: [[0,"products"],[1,"id"],[0,"variants"]],
    types: placeholder as Registry['variants.store']['types'],
  },
  'variants.delete': {
    methods: ["POST"],
    pattern: '/variants/:id/delete',
    tokens: [[0,"variants"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['variants.delete']['types'],
  },
  'variants.update_stock': {
    methods: ["POST"],
    pattern: '/variants/:id/stock',
    tokens: [[0,"variants"],[1,"id"],[0,"stock"]],
    types: placeholder as Registry['variants.update_stock']['types'],
  },
  'channel_listings.store': {
    methods: ["POST"],
    pattern: '/channel-listings',
    tokens: [[0,"channel-listings"]],
    types: placeholder as Registry['channel_listings.store']['types'],
  },
  'channel_listings.delete': {
    methods: ["POST"],
    pattern: '/channel-listings/:id/delete',
    tokens: [[0,"channel-listings"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['channel_listings.delete']['types'],
  },
  'seller_accounts.store': {
    methods: ["POST"],
    pattern: '/seller-accounts',
    tokens: [[0,"seller-accounts"]],
    types: placeholder as Registry['seller_accounts.store']['types'],
  },
  'seller_accounts.update': {
    methods: ["POST"],
    pattern: '/seller-accounts/:id',
    tokens: [[0,"seller-accounts"],[1,"id"]],
    types: placeholder as Registry['seller_accounts.update']['types'],
  },
  'seller_accounts.delete': {
    methods: ["POST"],
    pattern: '/seller-accounts/:id/delete',
    tokens: [[0,"seller-accounts"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['seller_accounts.delete']['types'],
  },
  'shipments.store': {
    methods: ["POST"],
    pattern: '/shipments',
    tokens: [[0,"shipments"]],
    types: placeholder as Registry['shipments.store']['types'],
  },
  'shipments.bulk_status': {
    methods: ["POST"],
    pattern: '/shipments/bulk/status',
    tokens: [[0,"shipments"],[0,"bulk"],[0,"status"]],
    types: placeholder as Registry['shipments.bulk_status']['types'],
  },
  'shipments.bulk_export': {
    methods: ["POST"],
    pattern: '/shipments/bulk/export',
    tokens: [[0,"shipments"],[0,"bulk"],[0,"export"]],
    types: placeholder as Registry['shipments.bulk_export']['types'],
  },
  'shipments.update_status': {
    methods: ["POST"],
    pattern: '/shipments/:id/status',
    tokens: [[0,"shipments"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['shipments.update_status']['types'],
  },
  'shipping_invoices.store': {
    methods: ["POST"],
    pattern: '/shipping-invoices',
    tokens: [[0,"shipping-invoices"]],
    types: placeholder as Registry['shipping_invoices.store']['types'],
  },
  'shipping_invoices.update_status': {
    methods: ["POST"],
    pattern: '/shipping-invoices/:id/status',
    tokens: [[0,"shipping-invoices"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['shipping_invoices.update_status']['types'],
  },
  'returns.store': {
    methods: ["POST"],
    pattern: '/returns',
    tokens: [[0,"returns"]],
    types: placeholder as Registry['returns.store']['types'],
  },
  'returns.update_status': {
    methods: ["POST"],
    pattern: '/returns/:id/status',
    tokens: [[0,"returns"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['returns.update_status']['types'],
  },
  'refunds.store': {
    methods: ["POST"],
    pattern: '/refunds',
    tokens: [[0,"refunds"]],
    types: placeholder as Registry['refunds.store']['types'],
  },
  'claims.store': {
    methods: ["POST"],
    pattern: '/claims',
    tokens: [[0,"claims"]],
    types: placeholder as Registry['claims.store']['types'],
  },
  'claims.update_status': {
    methods: ["POST"],
    pattern: '/claims/:id/status',
    tokens: [[0,"claims"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['claims.update_status']['types'],
  },
  'financial_accounts.store': {
    methods: ["POST"],
    pattern: '/financial-accounts',
    tokens: [[0,"financial-accounts"]],
    types: placeholder as Registry['financial_accounts.store']['types'],
  },
  'financial_accounts.update': {
    methods: ["POST"],
    pattern: '/financial-accounts/:id',
    tokens: [[0,"financial-accounts"],[1,"id"]],
    types: placeholder as Registry['financial_accounts.update']['types'],
  },
  'financial_accounts.delete': {
    methods: ["POST"],
    pattern: '/financial-accounts/:id/delete',
    tokens: [[0,"financial-accounts"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['financial_accounts.delete']['types'],
  },
  'credit_cards.store': {
    methods: ["POST"],
    pattern: '/credit-cards',
    tokens: [[0,"credit-cards"]],
    types: placeholder as Registry['credit_cards.store']['types'],
  },
  'credit_cards.update': {
    methods: ["POST"],
    pattern: '/credit-cards/:id',
    tokens: [[0,"credit-cards"],[1,"id"]],
    types: placeholder as Registry['credit_cards.update']['types'],
  },
  'credit_cards.delete': {
    methods: ["POST"],
    pattern: '/credit-cards/:id/delete',
    tokens: [[0,"credit-cards"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['credit_cards.delete']['types'],
  },
  'financial_transactions.store': {
    methods: ["POST"],
    pattern: '/financial-transactions',
    tokens: [[0,"financial-transactions"]],
    types: placeholder as Registry['financial_transactions.store']['types'],
  },
  'financial_transactions.void': {
    methods: ["POST"],
    pattern: '/financial-transactions/:id/void',
    tokens: [[0,"financial-transactions"],[1,"id"],[0,"void"]],
    types: placeholder as Registry['financial_transactions.void']['types'],
  },
  'finance_categories.store': {
    methods: ["POST"],
    pattern: '/finance-categories',
    tokens: [[0,"finance-categories"]],
    types: placeholder as Registry['finance_categories.store']['types'],
  },
  'finance_categories.update': {
    methods: ["POST"],
    pattern: '/finance-categories/:id',
    tokens: [[0,"finance-categories"],[1,"id"]],
    types: placeholder as Registry['finance_categories.update']['types'],
  },
  'finance_categories.delete': {
    methods: ["POST"],
    pattern: '/finance-categories/:id/delete',
    tokens: [[0,"finance-categories"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['finance_categories.delete']['types'],
  },
  'tasks.store': {
    methods: ["POST"],
    pattern: '/tasks',
    tokens: [[0,"tasks"]],
    types: placeholder as Registry['tasks.store']['types'],
  },
  'tasks.update': {
    methods: ["POST"],
    pattern: '/tasks/:id',
    tokens: [[0,"tasks"],[1,"id"]],
    types: placeholder as Registry['tasks.update']['types'],
  },
  'tasks.complete': {
    methods: ["POST"],
    pattern: '/tasks/:id/complete',
    tokens: [[0,"tasks"],[1,"id"],[0,"complete"]],
    types: placeholder as Registry['tasks.complete']['types'],
  },
  'tasks.delete': {
    methods: ["POST"],
    pattern: '/tasks/:id/delete',
    tokens: [[0,"tasks"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['tasks.delete']['types'],
  },
  'saved_views.store': {
    methods: ["POST"],
    pattern: '/saved-views',
    tokens: [[0,"saved-views"]],
    types: placeholder as Registry['saved_views.store']['types'],
  },
  'saved_views.delete': {
    methods: ["POST"],
    pattern: '/saved-views/:id/delete',
    tokens: [[0,"saved-views"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['saved_views.delete']['types'],
  },
  'import.upload_catalog': {
    methods: ["POST"],
    pattern: '/import/upload-catalog',
    tokens: [[0,"import"],[0,"upload-catalog"]],
    types: placeholder as Registry['import.upload_catalog']['types'],
  },
  'import.queue_sync': {
    methods: ["POST"],
    pattern: '/import/sync-accounts',
    tokens: [[0,"import"],[0,"sync-accounts"]],
    types: placeholder as Registry['import.queue_sync']['types'],
  },
  'address_cleanup.clean': {
    methods: ["POST"],
    pattern: '/address-cleanup',
    tokens: [[0,"address-cleanup"]],
    types: placeholder as Registry['address_cleanup.clean']['types'],
  },
  'api.tools.address_clean': {
    methods: ["POST"],
    pattern: '/api/tools/address-clean',
    tokens: [[0,"api"],[0,"tools"],[0,"address-clean"]],
    types: placeholder as Registry['api.tools.address_clean']['types'],
  },
  'address_cleanup.save_customer': {
    methods: ["POST"],
    pattern: '/address-cleanup/save-customer',
    tokens: [[0,"address-cleanup"],[0,"save-customer"]],
    types: placeholder as Registry['address_cleanup.save_customer']['types'],
  },
  'admin.users.store': {
    methods: ["POST"],
    pattern: '/admin/users',
    tokens: [[0,"admin"],[0,"users"]],
    types: placeholder as Registry['admin.users.store']['types'],
  },
  'admin.users.delete': {
    methods: ["POST"],
    pattern: '/admin/users/:id/delete',
    tokens: [[0,"admin"],[0,"users"],[1,"id"],[0,"delete"]],
    types: placeholder as Registry['admin.users.delete']['types'],
  },
  'admin.users.toggle_status': {
    methods: ["POST"],
    pattern: '/admin/users/:id/status',
    tokens: [[0,"admin"],[0,"users"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['admin.users.toggle_status']['types'],
  },
  'admin.users.assign_role': {
    methods: ["POST"],
    pattern: '/admin/users/:id/roles',
    tokens: [[0,"admin"],[0,"users"],[1,"id"],[0,"roles"]],
    types: placeholder as Registry['admin.users.assign_role']['types'],
  },
  'admin.entitlements.toggle': {
    methods: ["POST"],
    pattern: '/admin/entitlements/:id/toggle',
    tokens: [[0,"admin"],[0,"entitlements"],[1,"id"],[0,"toggle"]],
    types: placeholder as Registry['admin.entitlements.toggle']['types'],
  },
  'admin.queue.overview': {
    methods: ["GET","HEAD"],
    pattern: '/admin/queue/overview',
    tokens: [[0,"admin"],[0,"queue"],[0,"overview"]],
    types: placeholder as Registry['admin.queue.overview']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
