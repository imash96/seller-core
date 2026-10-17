import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'orders.bulk_import': { paramsTuple?: []; params?: {} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'risk_signals.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store': { paramsTuple?: []; params?: {} }
    'variants.update_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.store': { paramsTuple?: []; params?: {} }
    'shipments.store': { paramsTuple?: []; params?: {} }
    'shipping_invoices.store': { paramsTuple?: []; params?: {} }
    'returns.store': { paramsTuple?: []; params?: {} }
    'refunds.store': { paramsTuple?: []; params?: {} }
    'credit_cards.store': { paramsTuple?: []; params?: {} }
    'financial_transactions.store': { paramsTuple?: []; params?: {} }
    'tasks.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.users.toggle_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.entitlements.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
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
    'risk_signals.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store': { paramsTuple?: []; params?: {} }
    'variants.update_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.store': { paramsTuple?: []; params?: {} }
    'shipments.store': { paramsTuple?: []; params?: {} }
    'shipping_invoices.store': { paramsTuple?: []; params?: {} }
    'returns.store': { paramsTuple?: []; params?: {} }
    'refunds.store': { paramsTuple?: []; params?: {} }
    'credit_cards.store': { paramsTuple?: []; params?: {} }
    'financial_transactions.store': { paramsTuple?: []; params?: {} }
    'tasks.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.users.toggle_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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