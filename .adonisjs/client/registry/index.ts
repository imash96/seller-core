/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['dashboard']['types'],
  },
  'pages.orders': {
    methods: ["GET","HEAD"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['pages.orders']['types'],
  },
  'pages.customers': {
    methods: ["GET","HEAD"],
    pattern: '/customers',
    tokens: [{"old":"/customers","type":0,"val":"customers","end":""}],
    types: placeholder as Registry['pages.customers']['types'],
  },
  'pages.products': {
    methods: ["GET","HEAD"],
    pattern: '/products',
    tokens: [{"old":"/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['pages.products']['types'],
  },
  'pages.accounts': {
    methods: ["GET","HEAD"],
    pattern: '/seller-accounts',
    tokens: [{"old":"/seller-accounts","type":0,"val":"seller-accounts","end":""}],
    types: placeholder as Registry['pages.accounts']['types'],
  },
  'pages.shipments': {
    methods: ["GET","HEAD"],
    pattern: '/shipments',
    tokens: [{"old":"/shipments","type":0,"val":"shipments","end":""}],
    types: placeholder as Registry['pages.shipments']['types'],
  },
  'pages.returns': {
    methods: ["GET","HEAD"],
    pattern: '/returns',
    tokens: [{"old":"/returns","type":0,"val":"returns","end":""}],
    types: placeholder as Registry['pages.returns']['types'],
  },
  'pages.claims': {
    methods: ["GET","HEAD"],
    pattern: '/claims',
    tokens: [{"old":"/claims","type":0,"val":"claims","end":""}],
    types: placeholder as Registry['pages.claims']['types'],
  },
  'pages.finance': {
    methods: ["GET","HEAD"],
    pattern: '/finance',
    tokens: [{"old":"/finance","type":0,"val":"finance","end":""}],
    types: placeholder as Registry['pages.finance']['types'],
  },
  'pages.tasks': {
    methods: ["GET","HEAD"],
    pattern: '/tasks',
    tokens: [{"old":"/tasks","type":0,"val":"tasks","end":""}],
    types: placeholder as Registry['pages.tasks']['types'],
  },
  'pages.admin': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [{"old":"/admin","type":0,"val":"admin","end":""}],
    types: placeholder as Registry['pages.admin']['types'],
  },
  'pages.audit': {
    methods: ["GET","HEAD"],
    pattern: '/audit',
    tokens: [{"old":"/audit","type":0,"val":"audit","end":""}],
    types: placeholder as Registry['pages.audit']['types'],
  },
  'pages.import': {
    methods: ["GET","HEAD"],
    pattern: '/import',
    tokens: [{"old":"/import","type":0,"val":"import","end":""}],
    types: placeholder as Registry['pages.import']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'orders.store': {
    methods: ["POST"],
    pattern: '/orders',
    tokens: [{"old":"/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['orders.store']['types'],
  },
  'orders.bulk_import': {
    methods: ["POST"],
    pattern: '/orders/bulk-import',
    tokens: [{"old":"/orders/bulk-import","type":0,"val":"orders","end":""},{"old":"/orders/bulk-import","type":0,"val":"bulk-import","end":""}],
    types: placeholder as Registry['orders.bulk_import']['types'],
  },
  'orders.update_status': {
    methods: ["POST"],
    pattern: '/orders/:id/status',
    tokens: [{"old":"/orders/:id/status","type":0,"val":"orders","end":""},{"old":"/orders/:id/status","type":1,"val":"id","end":""},{"old":"/orders/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['orders.update_status']['types'],
  },
  'orders.delete': {
    methods: ["POST"],
    pattern: '/orders/:id/delete',
    tokens: [{"old":"/orders/:id/delete","type":0,"val":"orders","end":""},{"old":"/orders/:id/delete","type":1,"val":"id","end":""},{"old":"/orders/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['orders.delete']['types'],
  },
  'customers.store': {
    methods: ["POST"],
    pattern: '/customers',
    tokens: [{"old":"/customers","type":0,"val":"customers","end":""}],
    types: placeholder as Registry['customers.store']['types'],
  },
  'customers.update': {
    methods: ["POST"],
    pattern: '/customers/:id',
    tokens: [{"old":"/customers/:id","type":0,"val":"customers","end":""},{"old":"/customers/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['customers.update']['types'],
  },
  'customers.merge': {
    methods: ["POST"],
    pattern: '/customers/merge',
    tokens: [{"old":"/customers/merge","type":0,"val":"customers","end":""},{"old":"/customers/merge","type":0,"val":"merge","end":""}],
    types: placeholder as Registry['customers.merge']['types'],
  },
  'customers.delete': {
    methods: ["POST"],
    pattern: '/customers/:id/delete',
    tokens: [{"old":"/customers/:id/delete","type":0,"val":"customers","end":""},{"old":"/customers/:id/delete","type":1,"val":"id","end":""},{"old":"/customers/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['customers.delete']['types'],
  },
  'risk_signals.review': {
    methods: ["POST"],
    pattern: '/risk-signals/:id/review',
    tokens: [{"old":"/risk-signals/:id/review","type":0,"val":"risk-signals","end":""},{"old":"/risk-signals/:id/review","type":1,"val":"id","end":""},{"old":"/risk-signals/:id/review","type":0,"val":"review","end":""}],
    types: placeholder as Registry['risk_signals.review']['types'],
  },
  'brands.store': {
    methods: ["POST"],
    pattern: '/brands',
    tokens: [{"old":"/brands","type":0,"val":"brands","end":""}],
    types: placeholder as Registry['brands.store']['types'],
  },
  'brands.update': {
    methods: ["POST"],
    pattern: '/brands/:id',
    tokens: [{"old":"/brands/:id","type":0,"val":"brands","end":""},{"old":"/brands/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['brands.update']['types'],
  },
  'brands.delete': {
    methods: ["POST"],
    pattern: '/brands/:id/delete',
    tokens: [{"old":"/brands/:id/delete","type":0,"val":"brands","end":""},{"old":"/brands/:id/delete","type":1,"val":"id","end":""},{"old":"/brands/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['brands.delete']['types'],
  },
  'categories.store': {
    methods: ["POST"],
    pattern: '/categories',
    tokens: [{"old":"/categories","type":0,"val":"categories","end":""}],
    types: placeholder as Registry['categories.store']['types'],
  },
  'categories.update': {
    methods: ["POST"],
    pattern: '/categories/:id',
    tokens: [{"old":"/categories/:id","type":0,"val":"categories","end":""},{"old":"/categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categories.update']['types'],
  },
  'categories.delete': {
    methods: ["POST"],
    pattern: '/categories/:id/delete',
    tokens: [{"old":"/categories/:id/delete","type":0,"val":"categories","end":""},{"old":"/categories/:id/delete","type":1,"val":"id","end":""},{"old":"/categories/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['categories.delete']['types'],
  },
  'products.store': {
    methods: ["POST"],
    pattern: '/products',
    tokens: [{"old":"/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.store']['types'],
  },
  'products.update': {
    methods: ["POST"],
    pattern: '/products/:id',
    tokens: [{"old":"/products/:id","type":0,"val":"products","end":""},{"old":"/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.update']['types'],
  },
  'products.delete': {
    methods: ["POST"],
    pattern: '/products/:id/delete',
    tokens: [{"old":"/products/:id/delete","type":0,"val":"products","end":""},{"old":"/products/:id/delete","type":1,"val":"id","end":""},{"old":"/products/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['products.delete']['types'],
  },
  'variants.store': {
    methods: ["POST"],
    pattern: '/products/:id/variants',
    tokens: [{"old":"/products/:id/variants","type":0,"val":"products","end":""},{"old":"/products/:id/variants","type":1,"val":"id","end":""},{"old":"/products/:id/variants","type":0,"val":"variants","end":""}],
    types: placeholder as Registry['variants.store']['types'],
  },
  'variants.delete': {
    methods: ["POST"],
    pattern: '/variants/:id/delete',
    tokens: [{"old":"/variants/:id/delete","type":0,"val":"variants","end":""},{"old":"/variants/:id/delete","type":1,"val":"id","end":""},{"old":"/variants/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['variants.delete']['types'],
  },
  'variants.update_stock': {
    methods: ["POST"],
    pattern: '/variants/:id/stock',
    tokens: [{"old":"/variants/:id/stock","type":0,"val":"variants","end":""},{"old":"/variants/:id/stock","type":1,"val":"id","end":""},{"old":"/variants/:id/stock","type":0,"val":"stock","end":""}],
    types: placeholder as Registry['variants.update_stock']['types'],
  },
  'channel_listings.store': {
    methods: ["POST"],
    pattern: '/channel-listings',
    tokens: [{"old":"/channel-listings","type":0,"val":"channel-listings","end":""}],
    types: placeholder as Registry['channel_listings.store']['types'],
  },
  'channel_listings.delete': {
    methods: ["POST"],
    pattern: '/channel-listings/:id/delete',
    tokens: [{"old":"/channel-listings/:id/delete","type":0,"val":"channel-listings","end":""},{"old":"/channel-listings/:id/delete","type":1,"val":"id","end":""},{"old":"/channel-listings/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['channel_listings.delete']['types'],
  },
  'seller_accounts.store': {
    methods: ["POST"],
    pattern: '/seller-accounts',
    tokens: [{"old":"/seller-accounts","type":0,"val":"seller-accounts","end":""}],
    types: placeholder as Registry['seller_accounts.store']['types'],
  },
  'seller_accounts.update': {
    methods: ["POST"],
    pattern: '/seller-accounts/:id',
    tokens: [{"old":"/seller-accounts/:id","type":0,"val":"seller-accounts","end":""},{"old":"/seller-accounts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['seller_accounts.update']['types'],
  },
  'seller_accounts.delete': {
    methods: ["POST"],
    pattern: '/seller-accounts/:id/delete',
    tokens: [{"old":"/seller-accounts/:id/delete","type":0,"val":"seller-accounts","end":""},{"old":"/seller-accounts/:id/delete","type":1,"val":"id","end":""},{"old":"/seller-accounts/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['seller_accounts.delete']['types'],
  },
  'shipments.store': {
    methods: ["POST"],
    pattern: '/shipments',
    tokens: [{"old":"/shipments","type":0,"val":"shipments","end":""}],
    types: placeholder as Registry['shipments.store']['types'],
  },
  'shipments.update_status': {
    methods: ["POST"],
    pattern: '/shipments/:id/status',
    tokens: [{"old":"/shipments/:id/status","type":0,"val":"shipments","end":""},{"old":"/shipments/:id/status","type":1,"val":"id","end":""},{"old":"/shipments/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['shipments.update_status']['types'],
  },
  'shipping_invoices.store': {
    methods: ["POST"],
    pattern: '/shipping-invoices',
    tokens: [{"old":"/shipping-invoices","type":0,"val":"shipping-invoices","end":""}],
    types: placeholder as Registry['shipping_invoices.store']['types'],
  },
  'shipping_invoices.update_status': {
    methods: ["POST"],
    pattern: '/shipping-invoices/:id/status',
    tokens: [{"old":"/shipping-invoices/:id/status","type":0,"val":"shipping-invoices","end":""},{"old":"/shipping-invoices/:id/status","type":1,"val":"id","end":""},{"old":"/shipping-invoices/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['shipping_invoices.update_status']['types'],
  },
  'returns.store': {
    methods: ["POST"],
    pattern: '/returns',
    tokens: [{"old":"/returns","type":0,"val":"returns","end":""}],
    types: placeholder as Registry['returns.store']['types'],
  },
  'returns.update_status': {
    methods: ["POST"],
    pattern: '/returns/:id/status',
    tokens: [{"old":"/returns/:id/status","type":0,"val":"returns","end":""},{"old":"/returns/:id/status","type":1,"val":"id","end":""},{"old":"/returns/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['returns.update_status']['types'],
  },
  'refunds.store': {
    methods: ["POST"],
    pattern: '/refunds',
    tokens: [{"old":"/refunds","type":0,"val":"refunds","end":""}],
    types: placeholder as Registry['refunds.store']['types'],
  },
  'claims.store': {
    methods: ["POST"],
    pattern: '/claims',
    tokens: [{"old":"/claims","type":0,"val":"claims","end":""}],
    types: placeholder as Registry['claims.store']['types'],
  },
  'claims.update_status': {
    methods: ["POST"],
    pattern: '/claims/:id/status',
    tokens: [{"old":"/claims/:id/status","type":0,"val":"claims","end":""},{"old":"/claims/:id/status","type":1,"val":"id","end":""},{"old":"/claims/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['claims.update_status']['types'],
  },
  'financial_accounts.store': {
    methods: ["POST"],
    pattern: '/financial-accounts',
    tokens: [{"old":"/financial-accounts","type":0,"val":"financial-accounts","end":""}],
    types: placeholder as Registry['financial_accounts.store']['types'],
  },
  'financial_accounts.update': {
    methods: ["POST"],
    pattern: '/financial-accounts/:id',
    tokens: [{"old":"/financial-accounts/:id","type":0,"val":"financial-accounts","end":""},{"old":"/financial-accounts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['financial_accounts.update']['types'],
  },
  'financial_accounts.delete': {
    methods: ["POST"],
    pattern: '/financial-accounts/:id/delete',
    tokens: [{"old":"/financial-accounts/:id/delete","type":0,"val":"financial-accounts","end":""},{"old":"/financial-accounts/:id/delete","type":1,"val":"id","end":""},{"old":"/financial-accounts/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['financial_accounts.delete']['types'],
  },
  'credit_cards.store': {
    methods: ["POST"],
    pattern: '/credit-cards',
    tokens: [{"old":"/credit-cards","type":0,"val":"credit-cards","end":""}],
    types: placeholder as Registry['credit_cards.store']['types'],
  },
  'credit_cards.update': {
    methods: ["POST"],
    pattern: '/credit-cards/:id',
    tokens: [{"old":"/credit-cards/:id","type":0,"val":"credit-cards","end":""},{"old":"/credit-cards/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['credit_cards.update']['types'],
  },
  'credit_cards.delete': {
    methods: ["POST"],
    pattern: '/credit-cards/:id/delete',
    tokens: [{"old":"/credit-cards/:id/delete","type":0,"val":"credit-cards","end":""},{"old":"/credit-cards/:id/delete","type":1,"val":"id","end":""},{"old":"/credit-cards/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['credit_cards.delete']['types'],
  },
  'financial_transactions.store': {
    methods: ["POST"],
    pattern: '/financial-transactions',
    tokens: [{"old":"/financial-transactions","type":0,"val":"financial-transactions","end":""}],
    types: placeholder as Registry['financial_transactions.store']['types'],
  },
  'financial_transactions.void': {
    methods: ["POST"],
    pattern: '/financial-transactions/:id/void',
    tokens: [{"old":"/financial-transactions/:id/void","type":0,"val":"financial-transactions","end":""},{"old":"/financial-transactions/:id/void","type":1,"val":"id","end":""},{"old":"/financial-transactions/:id/void","type":0,"val":"void","end":""}],
    types: placeholder as Registry['financial_transactions.void']['types'],
  },
  'tasks.store': {
    methods: ["POST"],
    pattern: '/tasks',
    tokens: [{"old":"/tasks","type":0,"val":"tasks","end":""}],
    types: placeholder as Registry['tasks.store']['types'],
  },
  'tasks.update': {
    methods: ["POST"],
    pattern: '/tasks/:id',
    tokens: [{"old":"/tasks/:id","type":0,"val":"tasks","end":""},{"old":"/tasks/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['tasks.update']['types'],
  },
  'tasks.complete': {
    methods: ["POST"],
    pattern: '/tasks/:id/complete',
    tokens: [{"old":"/tasks/:id/complete","type":0,"val":"tasks","end":""},{"old":"/tasks/:id/complete","type":1,"val":"id","end":""},{"old":"/tasks/:id/complete","type":0,"val":"complete","end":""}],
    types: placeholder as Registry['tasks.complete']['types'],
  },
  'tasks.delete': {
    methods: ["POST"],
    pattern: '/tasks/:id/delete',
    tokens: [{"old":"/tasks/:id/delete","type":0,"val":"tasks","end":""},{"old":"/tasks/:id/delete","type":1,"val":"id","end":""},{"old":"/tasks/:id/delete","type":0,"val":"delete","end":""}],
    types: placeholder as Registry['tasks.delete']['types'],
  },
  'saved_views.store': {
    methods: ["POST"],
    pattern: '/saved-views',
    tokens: [{"old":"/saved-views","type":0,"val":"saved-views","end":""}],
    types: placeholder as Registry['saved_views.store']['types'],
  },
  'admin.users.store': {
    methods: ["POST"],
    pattern: '/admin/users',
    tokens: [{"old":"/admin/users","type":0,"val":"admin","end":""},{"old":"/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.users.store']['types'],
  },
  'admin.users.toggle_status': {
    methods: ["POST"],
    pattern: '/admin/users/:id/status',
    tokens: [{"old":"/admin/users/:id/status","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/status","type":0,"val":"users","end":""},{"old":"/admin/users/:id/status","type":1,"val":"id","end":""},{"old":"/admin/users/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['admin.users.toggle_status']['types'],
  },
  'admin.users.assign_role': {
    methods: ["POST"],
    pattern: '/admin/users/:id/roles',
    tokens: [{"old":"/admin/users/:id/roles","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/roles","type":0,"val":"users","end":""},{"old":"/admin/users/:id/roles","type":1,"val":"id","end":""},{"old":"/admin/users/:id/roles","type":0,"val":"roles","end":""}],
    types: placeholder as Registry['admin.users.assign_role']['types'],
  },
  'admin.entitlements.toggle': {
    methods: ["POST"],
    pattern: '/admin/entitlements/:id/toggle',
    tokens: [{"old":"/admin/entitlements/:id/toggle","type":0,"val":"admin","end":""},{"old":"/admin/entitlements/:id/toggle","type":0,"val":"entitlements","end":""},{"old":"/admin/entitlements/:id/toggle","type":1,"val":"id","end":""},{"old":"/admin/entitlements/:id/toggle","type":0,"val":"toggle","end":""}],
    types: placeholder as Registry['admin.entitlements.toggle']['types'],
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
