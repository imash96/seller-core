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
    inventory: typeof routes['pages.inventory']
    catalogs: typeof routes['pages.catalogs']
    accounts: typeof routes['pages.accounts']
    shipments: typeof routes['pages.shipments']
    returns: typeof routes['pages.returns']
    claims: typeof routes['pages.claims']
    finance: typeof routes['pages.finance']
    tasks: typeof routes['pages.tasks']
    import: typeof routes['pages.import']
    audit: typeof routes['pages.audit']
    addressCleanup: typeof routes['pages.address_cleanup']
    admin: typeof routes['pages.admin']
  }
  orders: {
    store: typeof routes['orders.store']
    bulkImport: typeof routes['orders.bulk_import']
    bulkStatus: typeof routes['orders.bulk_status']
    bulkExport: typeof routes['orders.bulk_export']
    updateStatus: typeof routes['orders.update_status']
    delete: typeof routes['orders.delete']
  }
  customers: {
    store: typeof routes['customers.store']
    merge: typeof routes['customers.merge']
    update: typeof routes['customers.update']
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
    bulkStatus: typeof routes['shipments.bulk_status']
    bulkExport: typeof routes['shipments.bulk_export']
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
  financeCategories: {
    store: typeof routes['finance_categories.store']
    update: typeof routes['finance_categories.update']
    delete: typeof routes['finance_categories.delete']
  }
  tasks: {
    store: typeof routes['tasks.store']
    update: typeof routes['tasks.update']
    complete: typeof routes['tasks.complete']
    delete: typeof routes['tasks.delete']
  }
  savedViews: {
    store: typeof routes['saved_views.store']
    delete: typeof routes['saved_views.delete']
  }
  import: {
    uploadCatalog: typeof routes['import.upload_catalog']
    queueSync: typeof routes['import.queue_sync']
  }
  addressCleanup: {
    clean: typeof routes['address_cleanup.clean']
    saveCustomer: typeof routes['address_cleanup.save_customer']
  }
  api: {
    tools: {
      addressClean: typeof routes['api.tools.address_clean']
    }
  }
  admin: {
    users: {
      store: typeof routes['admin.users.store']
      delete: typeof routes['admin.users.delete']
      toggleStatus: typeof routes['admin.users.toggle_status']
      assignRole: typeof routes['admin.users.assign_role']
    }
    entitlements: {
      toggle: typeof routes['admin.entitlements.toggle']
    }
    queue: {
      overview: typeof routes['admin.queue.overview']
    }
  }
}
