import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'store.product_categories': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'organizations.index': { paramsTuple?: []; params?: {} }
    'organizations.store': { paramsTuple?: []; params?: {} }
    'organizations.members.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'membershipId': ParamValue} }
    'pages.orders': { paramsTuple?: []; params?: {} }
    'pages.customers': { paramsTuple?: []; params?: {} }
    'pages.catalogs': { paramsTuple?: []; params?: {} }
    'pages.products': { paramsTuple?: []; params?: {} }
    'pages.listings': { paramsTuple?: []; params?: {} }
    'pages.inventory': { paramsTuple?: []; params?: {} }
    'pages.accounts': { paramsTuple?: []; params?: {} }
    'pages.shipments': { paramsTuple?: []; params?: {} }
    'pages.returns': { paramsTuple?: []; params?: {} }
    'pages.claims': { paramsTuple?: []; params?: {} }
    'pages.finance': { paramsTuple?: []; params?: {} }
    'pages.tasks': { paramsTuple?: []; params?: {} }
    'pages.import': { paramsTuple?: []; params?: {} }
    'pages.audit': { paramsTuple?: []; params?: {} }
    'pages.address_cleanup': { paramsTuple?: []; params?: {} }
    'pages.tools_address_cleanup': { paramsTuple?: []; params?: {} }
    'pages.admin': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'orders.bulk_import': { paramsTuple?: []; params?: {} }
    'orders.bulk_status': { paramsTuple?: []; params?: {} }
    'orders.bulk_export': { paramsTuple?: []; params?: {} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'customers.merge': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'risk_signals.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogs.sync_categories': { paramsTuple?: []; params?: {} }
    'catalogs.import': { paramsTuple?: []; params?: {} }
    'catalogs.import_json': { paramsTuple?: []; params?: {} }
    'catalog_items.store': { paramsTuple?: []; params?: {} }
    'catalog_items.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalog_items.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalog_items.preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalog_items.convert': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogs.generate_listings': { paramsTuple?: []; params?: {} }
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
    'variants.update_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listings.store': { paramsTuple?: []; params?: {} }
    'listings.publish_sku': { paramsTuple?: []; params?: {} }
    'listings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listings.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listings.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.store': { paramsTuple?: []; params?: {} }
    'seller_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.sync': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipments.store': { paramsTuple?: []; params?: {} }
    'shipments.bulk_status': { paramsTuple?: []; params?: {} }
    'shipments.bulk_export': { paramsTuple?: []; params?: {} }
    'shipments.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipments.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.store': { paramsTuple?: []; params?: {} }
    'shipping_invoices.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'returns.store': { paramsTuple?: []; params?: {} }
    'returns.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'returns.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'refunds.store': { paramsTuple?: []; params?: {} }
    'claims.store': { paramsTuple?: []; params?: {} }
    'claims.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'claims.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'claims.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.store': { paramsTuple?: []; params?: {} }
    'financial_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.store': { paramsTuple?: []; params?: {} }
    'credit_cards.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'finance_categories.store': { paramsTuple?: []; params?: {} }
    'finance_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'finance_categories.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.store': { paramsTuple?: []; params?: {} }
    'finance.reports.store': { paramsTuple?: []; params?: {} }
    'financial_transactions.reconcile': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.reverse_reconciliation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.void': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.store': { paramsTuple?: []; params?: {} }
    'tasks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'saved_views.store': { paramsTuple?: []; params?: {} }
    'saved_views.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'import.upload_catalog': { paramsTuple?: []; params?: {} }
    'import.sync_accounts': { paramsTuple?: []; params?: {} }
    'api.tools.address_clean': { paramsTuple?: []; params?: {} }
    'api.tools.address_clean_docx': { paramsTuple?: []; params?: {} }
    'address_cleanup.save_customer': { paramsTuple?: []; params?: {} }
    'address_cleanup.process': { paramsTuple?: []; params?: {} }
    'address_cleanup.export_docx': { paramsTuple?: []; params?: {} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.users.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.assign_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.module_access': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.entitlements.toggle': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'store.product_categories': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'organizations.index': { paramsTuple?: []; params?: {} }
    'pages.orders': { paramsTuple?: []; params?: {} }
    'pages.customers': { paramsTuple?: []; params?: {} }
    'pages.catalogs': { paramsTuple?: []; params?: {} }
    'pages.products': { paramsTuple?: []; params?: {} }
    'pages.listings': { paramsTuple?: []; params?: {} }
    'pages.inventory': { paramsTuple?: []; params?: {} }
    'pages.accounts': { paramsTuple?: []; params?: {} }
    'pages.shipments': { paramsTuple?: []; params?: {} }
    'pages.returns': { paramsTuple?: []; params?: {} }
    'pages.claims': { paramsTuple?: []; params?: {} }
    'pages.finance': { paramsTuple?: []; params?: {} }
    'pages.tasks': { paramsTuple?: []; params?: {} }
    'pages.import': { paramsTuple?: []; params?: {} }
    'pages.audit': { paramsTuple?: []; params?: {} }
    'pages.address_cleanup': { paramsTuple?: []; params?: {} }
    'pages.tools_address_cleanup': { paramsTuple?: []; params?: {} }
    'pages.admin': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'store.product_categories': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'organizations.index': { paramsTuple?: []; params?: {} }
    'pages.orders': { paramsTuple?: []; params?: {} }
    'pages.customers': { paramsTuple?: []; params?: {} }
    'pages.catalogs': { paramsTuple?: []; params?: {} }
    'pages.products': { paramsTuple?: []; params?: {} }
    'pages.listings': { paramsTuple?: []; params?: {} }
    'pages.inventory': { paramsTuple?: []; params?: {} }
    'pages.accounts': { paramsTuple?: []; params?: {} }
    'pages.shipments': { paramsTuple?: []; params?: {} }
    'pages.returns': { paramsTuple?: []; params?: {} }
    'pages.claims': { paramsTuple?: []; params?: {} }
    'pages.finance': { paramsTuple?: []; params?: {} }
    'pages.tasks': { paramsTuple?: []; params?: {} }
    'pages.import': { paramsTuple?: []; params?: {} }
    'pages.audit': { paramsTuple?: []; params?: {} }
    'pages.address_cleanup': { paramsTuple?: []; params?: {} }
    'pages.tools_address_cleanup': { paramsTuple?: []; params?: {} }
    'pages.admin': { paramsTuple?: []; params?: {} }
  }
  OPTIONS: {
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'organizations.store': { paramsTuple?: []; params?: {} }
    'organizations.members.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.members.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'membershipId': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'orders.bulk_import': { paramsTuple?: []; params?: {} }
    'orders.bulk_status': { paramsTuple?: []; params?: {} }
    'orders.bulk_export': { paramsTuple?: []; params?: {} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.store': { paramsTuple?: []; params?: {} }
    'customers.merge': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'risk_signals.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogs.sync_categories': { paramsTuple?: []; params?: {} }
    'catalogs.import': { paramsTuple?: []; params?: {} }
    'catalogs.import_json': { paramsTuple?: []; params?: {} }
    'catalog_items.store': { paramsTuple?: []; params?: {} }
    'catalog_items.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalog_items.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalog_items.preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalog_items.convert': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'catalogs.generate_listings': { paramsTuple?: []; params?: {} }
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
    'variants.update_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'variants.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listings.store': { paramsTuple?: []; params?: {} }
    'listings.publish_sku': { paramsTuple?: []; params?: {} }
    'listings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listings.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'listings.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.store': { paramsTuple?: []; params?: {} }
    'seller_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_accounts.sync': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipments.store': { paramsTuple?: []; params?: {} }
    'shipments.bulk_status': { paramsTuple?: []; params?: {} }
    'shipments.bulk_export': { paramsTuple?: []; params?: {} }
    'shipments.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipments.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.store': { paramsTuple?: []; params?: {} }
    'shipping_invoices.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shipping_invoices.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'returns.store': { paramsTuple?: []; params?: {} }
    'returns.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'returns.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'refunds.store': { paramsTuple?: []; params?: {} }
    'claims.store': { paramsTuple?: []; params?: {} }
    'claims.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'claims.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'claims.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.store': { paramsTuple?: []; params?: {} }
    'financial_accounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_accounts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.store': { paramsTuple?: []; params?: {} }
    'credit_cards.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credit_cards.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'finance_categories.store': { paramsTuple?: []; params?: {} }
    'finance_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'finance_categories.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.store': { paramsTuple?: []; params?: {} }
    'finance.reports.store': { paramsTuple?: []; params?: {} }
    'financial_transactions.reconcile': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.reverse_reconciliation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'financial_transactions.void': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.store': { paramsTuple?: []; params?: {} }
    'tasks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tasks.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'saved_views.store': { paramsTuple?: []; params?: {} }
    'saved_views.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'import.upload_catalog': { paramsTuple?: []; params?: {} }
    'import.sync_accounts': { paramsTuple?: []; params?: {} }
    'api.tools.address_clean': { paramsTuple?: []; params?: {} }
    'api.tools.address_clean_docx': { paramsTuple?: []; params?: {} }
    'address_cleanup.save_customer': { paramsTuple?: []; params?: {} }
    'address_cleanup.process': { paramsTuple?: []; params?: {} }
    'address_cleanup.export_docx': { paramsTuple?: []; params?: {} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.users.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.assign_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.module_access': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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