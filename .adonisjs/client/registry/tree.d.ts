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
  orders: {
    store: typeof routes['orders.store']
    bulkImport: typeof routes['orders.bulk_import']
    updateStatus: typeof routes['orders.update_status']
    delete: typeof routes['orders.delete']
  }
  customers: {
    store: typeof routes['customers.store']
  }
  riskSignals: {
    review: typeof routes['risk_signals.review']
  }
  products: {
    store: typeof routes['products.store']
  }
  variants: {
    updateStock: typeof routes['variants.update_stock']
  }
  sellerAccounts: {
    store: typeof routes['seller_accounts.store']
  }
  shipments: {
    store: typeof routes['shipments.store']
  }
  shippingInvoices: {
    store: typeof routes['shipping_invoices.store']
  }
  returns: {
    store: typeof routes['returns.store']
  }
  refunds: {
    store: typeof routes['refunds.store']
  }
  creditCards: {
    store: typeof routes['credit_cards.store']
  }
  financialTransactions: {
    store: typeof routes['financial_transactions.store']
  }
  tasks: {
    complete: typeof routes['tasks.complete']
  }
  admin: {
    users: {
      store: typeof routes['admin.users.store']
      toggleStatus: typeof routes['admin.users.toggle_status']
    }
    entitlements: {
      toggle: typeof routes['admin.entitlements.toggle']
    }
  }
}
