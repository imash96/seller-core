/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
| Note: Public registration is strictly disabled per security policy.
| Only authenticated system super administrators can provision new users.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const SessionController = () => import('#controllers/session_controller')
const OperationsController = () => import('#controllers/operations_controller')

router.on('/').renderInertia('home', {}).as('home')

// Explicitly block public registration
router.any('/signup', ({ response, session }) => {
  session.flash(
    'error',
    'Public registration is disabled. User accounts can only be provisioned by a System Super Administrator.'
  )
  return response.redirect('/login')
})

router
  .group(() => {
    router.get('login', [SessionController, 'create']).as('session.create')
    router.post('login', [SessionController, 'store']).as('session.store')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('/dashboard', [OperationsController, 'index']).as('dashboard')
    router.post('/logout', [SessionController, 'destroy']).as('session.destroy')

    // Orders & Bulk Marketplace Import
    router.post('/orders', [OperationsController, 'storeOrder']).as('orders.store')
    router
      .post('/orders/bulk-import', [OperationsController, 'importBulkOrders'])
      .as('orders.bulk_import')
    router
      .post('/orders/:id/status', [OperationsController, 'updateOrderStatus'])
      .as('orders.update_status')
    router.post('/orders/:id/delete', [OperationsController, 'deleteOrder']).as('orders.delete')

    // Customers & Fraud/Risk Review
    router.post('/customers', [OperationsController, 'storeCustomer']).as('customers.store')
    router
      .post('/risk-signals/:id/review', [OperationsController, 'reviewRiskSignal'])
      .as('risk_signals.review')

    // Catalog, Products & Variants
    router.post('/products', [OperationsController, 'storeProduct']).as('products.store')
    router
      .post('/variants/:id/stock', [OperationsController, 'updateVariantStock'])
      .as('variants.update_stock')

    // Marketplace Seller Accounts
    router
      .post('/seller-accounts', [OperationsController, 'storeSellerAccount'])
      .as('seller_accounts.store')

    // Shipments & Carrier Invoices
    router.post('/shipments', [OperationsController, 'storeShipment']).as('shipments.store')
    router
      .post('/shipping-invoices', [OperationsController, 'storeShippingInvoice'])
      .as('shipping_invoices.store')

    // Returns & Refunds
    router.post('/returns', [OperationsController, 'storeReturnRequest']).as('returns.store')
    router.post('/refunds', [OperationsController, 'storeRefund']).as('refunds.store')

    // Credit Cards & Multi-Currency Financial Ledger
    router.post('/credit-cards', [OperationsController, 'storeCreditCard']).as('credit_cards.store')
    router
      .post('/financial-transactions', [OperationsController, 'storeFinancialTransaction'])
      .as('financial_transactions.store')

    // Tasks & Reminders
    router.post('/tasks/:id/complete', [OperationsController, 'completeTask']).as('tasks.complete')

    // Super-Admin User Provisioning, RBAC & Module Entitlements
    router.post('/admin/users', [OperationsController, 'storeUser']).as('admin.users.store')
    router
      .post('/admin/users/:id/status', [OperationsController, 'toggleUserStatus'])
      .as('admin.users.toggle_status')
    router
      .post('/admin/entitlements/:id/toggle', [OperationsController, 'toggleModuleEntitlement'])
      .as('admin.entitlements.toggle')
  })
  .use(middleware.auth())
