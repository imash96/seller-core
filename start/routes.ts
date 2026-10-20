/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Public registration is strictly disabled per security policy: only
| authenticated System Super Administrators can provision new users.
|
*/
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const SessionController = () => import('#controllers/session_controller')
const OperationsController = () => import('#controllers/operations_controller')
const PagesController = () => import('#controllers/pages_controller')

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
    /* ---------- Read pages (full CRUD workspaces) ---------- */
    router.get('/dashboard', [OperationsController, 'index']).as('dashboard')
    router.get('/orders', [PagesController, 'ordersPage']).as('pages.orders')
    router.get('/customers', [PagesController, 'customersPage']).as('pages.customers')
    router.get('/products', [PagesController, 'productsPage']).as('pages.products')
    router.get('/seller-accounts', [PagesController, 'accountsPage']).as('pages.accounts')
    router.get('/shipments', [PagesController, 'shipmentsPage']).as('pages.shipments')
    router.get('/returns', [PagesController, 'returnsPage']).as('pages.returns')
    router.get('/claims', [PagesController, 'claimsPage']).as('pages.claims')
    router.get('/finance', [PagesController, 'financePage']).as('pages.finance')
    router.get('/tasks', [PagesController, 'tasksPage']).as('pages.tasks')
    router.get('/admin', [PagesController, 'adminPage']).as('pages.admin')
    router.get('/audit', [PagesController, 'auditPage']).as('pages.audit')
    router.get('/import', [PagesController, 'importPage']).as('pages.import')

    router.post('/logout', [SessionController, 'destroy']).as('session.destroy')

    /* ---------- Orders & bulk marketplace import ---------- */
    router.post('/orders', [OperationsController, 'storeOrder']).as('orders.store')
    router
      .post('/orders/bulk-import', [OperationsController, 'importBulkOrders'])
      .as('orders.bulk_import')
    router
      .post('/orders/:id/status', [OperationsController, 'updateOrderStatus'])
      .as('orders.update_status')
    router.post('/orders/:id/delete', [OperationsController, 'deleteOrder']).as('orders.delete')

    /* ---------- Customers, merge & risk review ---------- */
    router.post('/customers', [OperationsController, 'storeCustomer']).as('customers.store')
    router.post('/customers/:id', [OperationsController, 'updateCustomer']).as('customers.update')
    router.post('/customers/merge', [OperationsController, 'mergeCustomers']).as('customers.merge')
    router
      .post('/customers/:id/delete', [OperationsController, 'deleteCustomer'])
      .as('customers.delete')
    router
      .post('/risk-signals/:id/review', [OperationsController, 'reviewRiskSignal'])
      .as('risk_signals.review')

    /* ---------- Catalog: brands, categories, products, variants, listings ---------- */
    router.post('/brands', [OperationsController, 'storeBrand']).as('brands.store')
    router.post('/brands/:id', [OperationsController, 'updateBrand']).as('brands.update')
    router.post('/brands/:id/delete', [OperationsController, 'deleteBrand']).as('brands.delete')
    router.post('/categories', [OperationsController, 'storeCategory']).as('categories.store')
    router.post('/categories/:id', [OperationsController, 'updateCategory']).as('categories.update')
    router
      .post('/categories/:id/delete', [OperationsController, 'deleteCategory'])
      .as('categories.delete')
    router.post('/products', [OperationsController, 'storeProduct']).as('products.store')
    router.post('/products/:id', [OperationsController, 'updateProduct']).as('products.update')
    router
      .post('/products/:id/delete', [OperationsController, 'deleteProduct'])
      .as('products.delete')
    router
      .post('/products/:id/variants', [OperationsController, 'storeVariant'])
      .as('variants.store')
    router
      .post('/variants/:id/delete', [OperationsController, 'deleteVariant'])
      .as('variants.delete')
    router
      .post('/variants/:id/stock', [OperationsController, 'updateVariantStock'])
      .as('variants.update_stock')
    router
      .post('/channel-listings', [OperationsController, 'storeChannelListing'])
      .as('channel_listings.store')
    router
      .post('/channel-listings/:id/delete', [OperationsController, 'deleteChannelListing'])
      .as('channel_listings.delete')

    /* ---------- Marketplace seller accounts ---------- */
    router
      .post('/seller-accounts', [OperationsController, 'storeSellerAccount'])
      .as('seller_accounts.store')
    router
      .post('/seller-accounts/:id', [OperationsController, 'updateSellerAccount'])
      .as('seller_accounts.update')
    router
      .post('/seller-accounts/:id/delete', [OperationsController, 'deleteSellerAccount'])
      .as('seller_accounts.delete')

    /* ---------- Shipments & carrier invoices ---------- */
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

    /* ---------- Returns (RMA), refunds & claims ---------- */
    router.post('/returns', [OperationsController, 'storeReturnRequest']).as('returns.store')
    router
      .post('/returns/:id/status', [OperationsController, 'updateReturnStatus'])
      .as('returns.update_status')
    router.post('/refunds', [OperationsController, 'storeRefund']).as('refunds.store')
    router.post('/claims', [OperationsController, 'storeMarketplaceClaim']).as('claims.store')
    router
      .post('/claims/:id/status', [OperationsController, 'updateClaimStatus'])
      .as('claims.update_status')

    /* ---------- Financial accounts, credit cards & ledger ---------- */
    router
      .post('/financial-accounts', [OperationsController, 'storeFinancialAccount'])
      .as('financial_accounts.store')
    router
      .post('/financial-accounts/:id', [OperationsController, 'updateFinancialAccount'])
      .as('financial_accounts.update')
    router
      .post('/financial-accounts/:id/delete', [OperationsController, 'deleteFinancialAccount'])
      .as('financial_accounts.delete')
    router.post('/credit-cards', [OperationsController, 'storeCreditCard']).as('credit_cards.store')
    router
      .post('/credit-cards/:id', [OperationsController, 'updateCreditCard'])
      .as('credit_cards.update')
    router
      .post('/credit-cards/:id/delete', [OperationsController, 'deleteCreditCard'])
      .as('credit_cards.delete')
    router
      .post('/financial-transactions', [OperationsController, 'storeFinancialTransaction'])
      .as('financial_transactions.store')
    router
      .post('/financial-transactions/:id/void', [OperationsController, 'voidFinancialTransaction'])
      .as('financial_transactions.void')

    /* ---------- Tasks, reminders & saved views ---------- */
    router.post('/tasks', [OperationsController, 'storeTask']).as('tasks.store')
    router.post('/tasks/:id', [OperationsController, 'updateTask']).as('tasks.update')
    router.post('/tasks/:id/complete', [OperationsController, 'completeTask']).as('tasks.complete')
    router.post('/tasks/:id/delete', [OperationsController, 'deleteTask']).as('tasks.delete')
    router.post('/saved-views', [OperationsController, 'storeSavedView']).as('saved_views.store')

    /* ---------- Saved view delete ---------- */
    router
      .post('/saved-views/:id/delete', [OperationsController, 'deleteSavedView'])
      .as('saved_views.delete')

    /* ---------- Super-admin provisioning, RBAC & entitlements ---------- */
    router.post('/admin/users', [OperationsController, 'storeUser']).as('admin.users.store')
    router
      .post('/admin/users/:id/delete', [OperationsController, 'deleteUser'])
      .as('admin.users.delete')
    router
      .post('/admin/users/:id/status', [OperationsController, 'toggleUserStatus'])
      .as('admin.users.toggle_status')
    router
      .post('/admin/users/:id/roles', [OperationsController, 'assignUserRole'])
      .as('admin.users.assign_role')
    router
      .post('/admin/entitlements/:id/toggle', [OperationsController, 'toggleModuleEntitlement'])
      .as('admin.entitlements.toggle')

    /* ---------- File uploads — bodyparser multipart demo ---------- */
    // Multipart routes demonstrate config/bodyparser.ts handling:
    // autoProcess=true streams files to tmp/, validators check extnames/sizes,
    // handlers move files to permanent storage or enqueue processing jobs.
    router
      .post('/import/upload-catalog', [OperationsController, 'uploadCatalogFile'])
      .as('import.upload_catalog')
    router
      .post('/import/sync-accounts', [OperationsController, 'queueSellerSync'])
      .as('import.queue_sync')

    /* ---------- Queue ops — inspect/retry (super-admin) ---------- */
    router
      .get('/admin/queue/overview', [OperationsController, 'queueOverview'])
      .as('admin.queue.overview')
  })
  .use(middleware.auth())
