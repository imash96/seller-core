/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  dashboard: typeof routes['dashboard']
  pages: {
    orders: typeof routes['pages.orders']
    customers: typeof routes['pages.customers']
    products: typeof routes['pages.products']
    accounts: typeof routes['pages.accounts']
    shipments: typeof routes['pages.shipments']
    returns: typeof routes['pages.returns']
    claims: typeof routes['pages.claims']
    finance: typeof routes['pages.finance']
    tasks: typeof routes['pages.tasks']
    admin: typeof routes['pages.admin']
    audit: typeof routes['pages.audit']
    import: typeof routes['pages.import']
  }
  orders: {
    store: typeof routes['orders.store']
    bulkImport: typeof routes['orders.bulk_import']
    updateStatus: typeof routes['orders.update_status']
    delete: typeof routes['orders.delete']
  }
  customers: {
    store: typeof routes['customers.store']
    update: typeof routes['customers.update']
    merge: typeof routes['customers.merge']
    delete: typeof routes['customers.delete']
  }
  riskSignals: {
    review: typeof routes['risk_signals.review']
  }
  brands: {
    store: typeof routes['brands.store']
    update: typeof routes['brands.update']
    delete: typeof routes['brands.delete']
  }
  categories: {
    store: typeof routes['categories.store']
    update: typeof routes['categories.update']
    delete: typeof routes['categories.delete']
  }
  products: {
    store: typeof routes['products.store']
    update: typeof routes['products.update']
    delete: typeof routes['products.delete']
  }
  variants: {
    store: typeof routes['variants.store']
    delete: typeof routes['variants.delete']
    updateStock: typeof routes['variants.update_stock']
  }
  channelListings: {
    store: typeof routes['channel_listings.store']
    delete: typeof routes['channel_listings.delete']
  }
  sellerAccounts: {
    store: typeof routes['seller_accounts.store']
    update: typeof routes['seller_accounts.update']
    delete: typeof routes['seller_accounts.delete']
  }
  shipments: {
    store: typeof routes['shipments.store']
    updateStatus: typeof routes['shipments.update_status']
  }
  shippingInvoices: {
    store: typeof routes['shipping_invoices.store']
    updateStatus: typeof routes['shipping_invoices.update_status']
  }
  returns: {
    store: typeof routes['returns.store']
    updateStatus: typeof routes['returns.update_status']
  }
  refunds: {
    store: typeof routes['refunds.store']
  }
  claims: {
    store: typeof routes['claims.store']
    updateStatus: typeof routes['claims.update_status']
  }
  financialAccounts: {
    store: typeof routes['financial_accounts.store']
    update: typeof routes['financial_accounts.update']
    delete: typeof routes['financial_accounts.delete']
  }
  creditCards: {
    store: typeof routes['credit_cards.store']
    update: typeof routes['credit_cards.update']
    delete: typeof routes['credit_cards.delete']
  }
  financialTransactions: {
    store: typeof routes['financial_transactions.store']
    void: typeof routes['financial_transactions.void']
  }
  tasks: {
    store: typeof routes['tasks.store']
    update: typeof routes['tasks.update']
    complete: typeof routes['tasks.complete']
    delete: typeof routes['tasks.delete']
  }
  savedViews: {
    store: typeof routes['saved_views.store']
  }
  admin: {
    users: {
      store: typeof routes['admin.users.store']
      toggleStatus: typeof routes['admin.users.toggle_status']
      assignRole: typeof routes['admin.users.assign_role']
    }
    entitlements: {
      toggle: typeof routes['admin.entitlements.toggle']
    }
  }
}
