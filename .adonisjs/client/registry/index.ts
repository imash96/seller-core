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
  'risk_signals.review': {
    methods: ["POST"],
    pattern: '/risk-signals/:id/review',
    tokens: [{"old":"/risk-signals/:id/review","type":0,"val":"risk-signals","end":""},{"old":"/risk-signals/:id/review","type":1,"val":"id","end":""},{"old":"/risk-signals/:id/review","type":0,"val":"review","end":""}],
    types: placeholder as Registry['risk_signals.review']['types'],
  },
  'products.store': {
    methods: ["POST"],
    pattern: '/products',
    tokens: [{"old":"/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.store']['types'],
  },
  'variants.update_stock': {
    methods: ["POST"],
    pattern: '/variants/:id/stock',
    tokens: [{"old":"/variants/:id/stock","type":0,"val":"variants","end":""},{"old":"/variants/:id/stock","type":1,"val":"id","end":""},{"old":"/variants/:id/stock","type":0,"val":"stock","end":""}],
    types: placeholder as Registry['variants.update_stock']['types'],
  },
  'seller_accounts.store': {
    methods: ["POST"],
    pattern: '/seller-accounts',
    tokens: [{"old":"/seller-accounts","type":0,"val":"seller-accounts","end":""}],
    types: placeholder as Registry['seller_accounts.store']['types'],
  },
  'shipments.store': {
    methods: ["POST"],
    pattern: '/shipments',
    tokens: [{"old":"/shipments","type":0,"val":"shipments","end":""}],
    types: placeholder as Registry['shipments.store']['types'],
  },
  'shipping_invoices.store': {
    methods: ["POST"],
    pattern: '/shipping-invoices',
    tokens: [{"old":"/shipping-invoices","type":0,"val":"shipping-invoices","end":""}],
    types: placeholder as Registry['shipping_invoices.store']['types'],
  },
  'returns.store': {
    methods: ["POST"],
    pattern: '/returns',
    tokens: [{"old":"/returns","type":0,"val":"returns","end":""}],
    types: placeholder as Registry['returns.store']['types'],
  },
  'refunds.store': {
    methods: ["POST"],
    pattern: '/refunds',
    tokens: [{"old":"/refunds","type":0,"val":"refunds","end":""}],
    types: placeholder as Registry['refunds.store']['types'],
  },
  'credit_cards.store': {
    methods: ["POST"],
    pattern: '/credit-cards',
    tokens: [{"old":"/credit-cards","type":0,"val":"credit-cards","end":""}],
    types: placeholder as Registry['credit_cards.store']['types'],
  },
  'financial_transactions.store': {
    methods: ["POST"],
    pattern: '/financial-transactions',
    tokens: [{"old":"/financial-transactions","type":0,"val":"financial-transactions","end":""}],
    types: placeholder as Registry['financial_transactions.store']['types'],
  },
  'tasks.complete': {
    methods: ["POST"],
    pattern: '/tasks/:id/complete',
    tokens: [{"old":"/tasks/:id/complete","type":0,"val":"tasks","end":""},{"old":"/tasks/:id/complete","type":1,"val":"id","end":""},{"old":"/tasks/:id/complete","type":0,"val":"complete","end":""}],
    types: placeholder as Registry['tasks.complete']['types'],
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
