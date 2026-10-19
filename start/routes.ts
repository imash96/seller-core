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
    // Customers, Duplicate Merge & Fraud/Risk Review
    router.post('/customers', [OperationsController, 'storeCustomer']).as('customers.store')
    router.post('/customers/merge', [OperationsController, 'mergeCustomers']).as('customers.merge')
    router
      .post('/customers/:id/delete', [OperationsController, 'deleteCustomer'])
      .as('customers.delete')
    router
      .post('/risk-signals/:id/review', [OperationsController, 'reviewRiskSignal'])
      .as('risk_signals.review')
    // Catalog, Brands, Categories, Products, Variants & Channel Listings
    router.post('/brands', [OperationsController, 'storeBrand']).as('brands.store')
    router.post('/categories', [OperationsController, 'storeCategory']).as('categories.store')
    router.post('/products', [OperationsController, 'storeProduct']).as('products.store')
    router
      .post('/products/:id/delete', [OperationsController, 'deleteProduct'])
      .as('products.delete')
    router
      .post('/variants/:id/stock', [OperationsController, 'updateVariantStock'])
      .as('variants.update_stock')
    router
      .post('/channel-listings', [OperationsController, 'storeChannelListing'])
      .as('channel_listings.store')
    // Marketplace Seller Accounts
    router
      .post('/seller-accounts', [OperationsController, 'storeSellerAccount'])
      .as('seller_accounts.store')
    // Shipments & Carrier Invoices
    router.post('/shipments', [OperationsController, 'storeShipment']).as('shipments.store')
    router
      .post('/shipments/:id/status', [OperationsController, 'updateShipmentStatus'])
      .as('shipments.update_status')
    router
      .post('/shipping-invoices', [OperationsController, 'storeShippingInvoice'])
      .as('shipping_invoices.store')
    router
      .post('/shipping-invoices/:id/status', [OperationsController, 'updateInvoiceStatus'])
      .as('shipping_invoices.update_status')
    // Returns (RMA), Refunds & Marketplace Claims
    router.post('/returns', [OperationsController, 'storeReturnRequest']).as('returns.store')
    router
      .post('/returns/:id/status', [OperationsController, 'updateReturnStatus'])
      .as('returns.update_status')
    router.post('/refunds', [OperationsController, 'storeRefund']).as('refunds.store')
    router.post('/claims', [OperationsController, 'storeMarketplaceClaim']).as('claims.store')
    router
      .post('/claims/:id/status', [OperationsController, 'updateClaimStatus'])
      .as('claims.update_status')
    // Financial Accounts, Credit Cards & Multi-Currency Financial Ledger
    router
      .post('/financial-accounts', [OperationsController, 'storeFinancialAccount'])
      .as('financial_accounts.store')
    router.post('/credit-cards', [OperationsController, 'storeCreditCard']).as('credit_cards.store')
    router
      .post('/credit-cards/:id/delete', [OperationsController, 'deleteCreditCard'])
      .as('credit_cards.delete')
    router
      .post('/financial-transactions', [OperationsController, 'storeFinancialTransaction'])
      .as('financial_transactions.store')
    router
      .post('/financial-transactions/:id/void', [OperationsController, 'voidFinancialTransaction'])
      .as('financial_transactions.void')
    // Tasks, Reminders & Saved Views
    router.post('/tasks', [OperationsController, 'storeTask']).as('tasks.store')
    router.post('/tasks/:id/complete', [OperationsController, 'completeTask']).as('tasks.complete')
    router.post('/saved-views', [OperationsController, 'storeSavedView']).as('saved_views.store')
    // Super-Admin User Provisioning, RBAC & Module Entitlements
    router.post('/admin/users', [OperationsController, 'storeUser']).as('admin.users.store')
    router
      .post('/admin/users/:id/status', [OperationsController, 'toggleUserStatus'])
      .as('admin.users.toggle_status')
    router
      .post('/admin/users/:id/roles', [OperationsController, 'assignUserRole'])
      .as('admin.users.assign_role')
    router
      .post('/admin/entitlements/:id/toggle', [OperationsController, 'toggleModuleEntitlement'])
      .as('admin.entitlements.toggle')
  })
  .use(middleware.auth())
