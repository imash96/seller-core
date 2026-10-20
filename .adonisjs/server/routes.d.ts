import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'pages.orders': { paramsTuple?: []; params?: {} }
    'pages.customers': { paramsTuple?: []; params?: {} }
    'pages.products': { paramsTuple?: []; params?: {} }
    'pages.accounts': { paramsTuple?: []; params?: {} }
    'pages.shipments': { paramsTuple?: []; params?: {} }
    'pages.returns': { paramsTuple?: []; params?: {} }
    'pages.claims': { paramsTuple?: []; params?: {} }
    'pages.finance': { paramsTuple?: []; params?: {} }
    'pages.tasks': { paramsTuple?: []; params?: {} }
    'pages.admin': { paramsTuple?: []; params?: {} }
    'pages.audit': { paramsTuple?: []; params?: {} }
    'pages.import': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'orders.bulk_import': { paramsTuple?: []; params?: {} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.merge': { paramsTuple?: []; params?: {} }
    'customers.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'risk_signals.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.store': { paramsTuple?: []; params?: {} }
    'brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store': { paramsTuple?: []; params?: {} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.update_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channel_listings.store': { paramsTuple?: []; params?: {} }
    'channel_listings.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.store': { paramsTuple?: []; params?: {} }
    'seller_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipments.store': { paramsTuple?: []; params?: {} }
    'shipments.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.store': { paramsTuple?: []; params?: {} }
    'shipping_invoices.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'returns.store': { paramsTuple?: []; params?: {} }
    'returns.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'refunds.store': { paramsTuple?: []; params?: {} }
    'claims.store': { paramsTuple?: []; params?: {} }
    'claims.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.store': { paramsTuple?: []; params?: {} }
    'financial_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.store': { paramsTuple?: []; params?: {} }
    'credit_cards.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.store': { paramsTuple?: []; params?: {} }
    'financial_transactions.void': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.store': { paramsTuple?: []; params?: {} }
    'tasks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'saved_views.store': { paramsTuple?: []; params?: {} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.users.toggle_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.assign_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.entitlements.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'pages.orders': { paramsTuple?: []; params?: {} }
    'pages.customers': { paramsTuple?: []; params?: {} }
    'pages.products': { paramsTuple?: []; params?: {} }
    'pages.accounts': { paramsTuple?: []; params?: {} }
    'pages.shipments': { paramsTuple?: []; params?: {} }
    'pages.returns': { paramsTuple?: []; params?: {} }
    'pages.claims': { paramsTuple?: []; params?: {} }
    'pages.finance': { paramsTuple?: []; params?: {} }
    'pages.tasks': { paramsTuple?: []; params?: {} }
    'pages.admin': { paramsTuple?: []; params?: {} }
    'pages.audit': { paramsTuple?: []; params?: {} }
    'pages.import': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'pages.orders': { paramsTuple?: []; params?: {} }
    'pages.customers': { paramsTuple?: []; params?: {} }
    'pages.products': { paramsTuple?: []; params?: {} }
    'pages.accounts': { paramsTuple?: []; params?: {} }
    'pages.shipments': { paramsTuple?: []; params?: {} }
    'pages.returns': { paramsTuple?: []; params?: {} }
    'pages.claims': { paramsTuple?: []; params?: {} }
    'pages.finance': { paramsTuple?: []; params?: {} }
    'pages.tasks': { paramsTuple?: []; params?: {} }
    'pages.admin': { paramsTuple?: []; params?: {} }
    'pages.audit': { paramsTuple?: []; params?: {} }
    'pages.import': { paramsTuple?: []; params?: {} }
  }
  OPTIONS: {
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'orders.bulk_import': { paramsTuple?: []; params?: {} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.merge': { paramsTuple?: []; params?: {} }
    'customers.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'risk_signals.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.store': { paramsTuple?: []; params?: {} }
    'brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store': { paramsTuple?: []; params?: {} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.update_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channel_listings.store': { paramsTuple?: []; params?: {} }
    'channel_listings.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.store': { paramsTuple?: []; params?: {} }
    'seller_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipments.store': { paramsTuple?: []; params?: {} }
    'shipments.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.store': { paramsTuple?: []; params?: {} }
    'shipping_invoices.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'returns.store': { paramsTuple?: []; params?: {} }
    'returns.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'refunds.store': { paramsTuple?: []; params?: {} }
    'claims.store': { paramsTuple?: []; params?: {} }
    'claims.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.store': { paramsTuple?: []; params?: {} }
    'financial_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.store': { paramsTuple?: []; params?: {} }
    'credit_cards.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.store': { paramsTuple?: []; params?: {} }
    'financial_transactions.void': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.store': { paramsTuple?: []; params?: {} }
    'tasks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'saved_views.store': { paramsTuple?: []; params?: {} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.users.toggle_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.assign_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.entitlements.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
  }
  PATCH: {
  }
  DELETE: {
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}