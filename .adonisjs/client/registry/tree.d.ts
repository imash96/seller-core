/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  store: {
    productCategories: typeof routes['store.product_categories']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  dashboard: typeof routes['dashboard']
  organizations: {
    index: typeof routes['organizations.index']
    store: typeof routes['organizations.store']
    members: {
      store: typeof routes['organizations.members.store']
      delete: typeof routes['organizations.members.delete']
    }
  }
  pages: {
    orders: typeof routes['pages.orders']
    customers: typeof routes['pages.customers']
    catalogs: typeof routes['pages.catalogs']
    products: typeof routes['pages.products']
    listings: typeof routes['pages.listings']
    inventory: typeof routes['pages.inventory']
    accounts: typeof routes['pages.accounts']
    shipments: typeof routes['pages.shipments']
    returns: typeof routes['pages.returns']
    claims: typeof routes['pages.claims']
    finance: typeof routes['pages.finance']
    tasks: typeof routes['pages.tasks']
    import: typeof routes['pages.import']
    audit: typeof routes['pages.audit']
    addressCleanup: typeof routes['pages.address_cleanup']
    toolsAddressCleanup: typeof routes['pages.tools_address_cleanup']
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
  catalogs: {
    syncCategories: typeof routes['catalogs.sync_categories']
    import: typeof routes['catalogs.import']
    importJson: typeof routes['catalogs.import_json']
    generateListings: typeof routes['catalogs.generate_listings']
  }
  catalogItems: {
    store: typeof routes['catalog_items.store']
    update: typeof routes['catalog_items.update']
    delete: typeof routes['catalog_items.delete']
    preview: typeof routes['catalog_items.preview']
    convert: typeof routes['catalog_items.convert']
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
    updateStock: typeof routes['variants.update_stock']
    delete: typeof routes['variants.delete']
  }
  listings: {
    store: typeof routes['listings.store']
    publishSku: typeof routes['listings.publish_sku']
    update: typeof routes['listings.update']
    publish: typeof routes['listings.publish']
    delete: typeof routes['listings.delete']
  }
  sellerAccounts: {
    store: typeof routes['seller_accounts.store']
    update: typeof routes['seller_accounts.update']
    delete: typeof routes['seller_accounts.delete']
    sync: typeof routes['seller_accounts.sync']
  }
  shipments: {
    store: typeof routes['shipments.store']
    bulkStatus: typeof routes['shipments.bulk_status']
    bulkExport: typeof routes['shipments.bulk_export']
    updateStatus: typeof routes['shipments.update_status']
    delete: typeof routes['shipments.delete']
  }
  shippingInvoices: {
    store: typeof routes['shipping_invoices.store']
    update: typeof routes['shipping_invoices.update']
    updateStatus: typeof routes['shipping_invoices.update_status']
    delete: typeof routes['shipping_invoices.delete']
  }
  returns: {
    store: typeof routes['returns.store']
    updateStatus: typeof routes['returns.update_status']
    delete: typeof routes['returns.delete']
  }
  refunds: {
    store: typeof routes['refunds.store']
  }
  claims: {
    store: typeof routes['claims.store']
    update: typeof routes['claims.update']
    updateStatus: typeof routes['claims.update_status']
    delete: typeof routes['claims.delete']
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
  financeCategories: {
    store: typeof routes['finance_categories.store']
    update: typeof routes['finance_categories.update']
    delete: typeof routes['finance_categories.delete']
  }
  financialTransactions: {
    store: typeof routes['financial_transactions.store']
    reconcile: typeof routes['financial_transactions.reconcile']
    reverseReconciliation: typeof routes['financial_transactions.reverse_reconciliation']
    void: typeof routes['financial_transactions.void']
  }
  finance: {
    reports: {
      store: typeof routes['finance.reports.store']
    }
  }
  tasks: {
    store: typeof routes['tasks.store']
    update: typeof routes['tasks.update']
    status: typeof routes['tasks.status']
    complete: typeof routes['tasks.complete']
    delete: typeof routes['tasks.delete']
  }
  savedViews: {
    store: typeof routes['saved_views.store']
    delete: typeof routes['saved_views.delete']
  }
  import: {
    uploadCatalog: typeof routes['import.upload_catalog']
    syncAccounts: typeof routes['import.sync_accounts']
  }
  api: {
    tools: {
      addressClean: typeof routes['api.tools.address_clean']
      addressCleanDocx: typeof routes['api.tools.address_clean_docx']
    }
  }
  addressCleanup: {
    saveCustomer: typeof routes['address_cleanup.save_customer']
    process: typeof routes['address_cleanup.process']
    exportDocx: typeof routes['address_cleanup.export_docx']
  }
  admin: {
    users: {
      store: typeof routes['admin.users.store']
      status: typeof routes['admin.users.status']
      update: typeof routes['admin.users.update']
      delete: typeof routes['admin.users.delete']
      assignRole: typeof routes['admin.users.assign_role']
      moduleAccess: typeof routes['admin.users.module_access']
    }
    entitlements: {
      toggle: typeof routes['admin.entitlements.toggle']
    }
  }
}
