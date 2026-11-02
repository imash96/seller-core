import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import db from '@adonisjs/lucid/services/db'

const SessionController = () => import('#controllers/session_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const OrdersController = () => import('#controllers/orders_controller')
const ProductsController = () => import('#controllers/products_controller')
const CustomersController = () => import('#controllers/customers_controller')
const SellerAccountsController = () => import('#controllers/seller_accounts_controller')
const ShipmentsController = () => import('#controllers/shipments_controller')
const ReturnsController = () => import('#controllers/returns_controller')
const ClaimsController = () => import('#controllers/claims_controller')
const FinanceController = () => import('#controllers/finance_controller')
const ToolsController = () => import('#controllers/tools_controller')
const AddressCleanupController = () => import('#controllers/address_cleanup_controller')
const AdminController = () => import('#controllers/admin_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')

// No tenant data or credentials are exposed by probes. Readiness verifies the primary database.
router.get('/health/live', ({ response }) => response.ok({ status: 'ok' }))
router.get('/health/ready', async ({ response }) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      db.rawQuery('SELECT 1'),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Database probe timed out')), 2000)
      }),
    ])
    return response.ok({ status: 'ready' })
  } catch {
    return response.serviceUnavailable({ status: 'not_ready' })
  } finally {
    if (timer) clearTimeout(timer)
  }
})

router.any('/signup', ({ response, session }) => {
  session.flash(
    'error',
    'Public registration is disabled. User accounts can only be provisioned by a System Super Administrator.'
  )
  return response.redirect('/')
})

router.any('/login', ({ request, response }) => {
  const qs = request.qs()
  const query = new URLSearchParams(qs as Record<string, string>).toString()
  return response.redirect(query ? `/?${query}` : '/')
})

/* ---------- Medusa Storefront Compatible Category Endpoint ---------- */
router
  .get('/store/product-categories', [ProductsController, 'medusaCategoriesEndpoint'])
  .as('store.product_categories')

router
  .group(() => {
    router.get('/', [SessionController, 'create']).as('session.create')
    router.post('/', [SessionController, 'store']).as('session.store')
  })
  .use(middleware.guest())

router
  .group(() => {
    /* ---------- Read pages (feature-split controllers) ---------- */
    router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
    router.get('/organizations', [OrganizationsController, 'index']).as('organizations.index')
    router.post('/organizations', [OrganizationsController, 'store']).as('organizations.store')
    router
      .post('/organizations/:id/members', [OrganizationsController, 'upsertMember'])
      .as('organizations.members.store')
    router
      .post('/organizations/:id/members/:membershipId/delete', [
        OrganizationsController,
        'removeMember',
      ])
      .as('organizations.members.delete')
    router
      .get('/orders', [OrdersController, 'index'])
      .as('pages.orders')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'read' }))
    router
      .get('/customers', [CustomersController, 'index'])
      .as('pages.customers')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'read' }))
    router
      .get('/catalogs', [ProductsController, 'catalogsPage'])
      .as('pages.catalogs')
      .use(middleware.catalogPermission({ action: 'read' }))
    router
      .get('/products', [ProductsController, 'index'])
      .as('pages.products')
      .use(middleware.catalogPermission({ action: 'read' }))
    router
      .get('/listings', [ProductsController, 'listingsPage'])
      .as('pages.listings')
      .use(middleware.catalogPermission({ action: 'read' }))
    router
      .get('/inventory', [ProductsController, 'inventoryPage'])
      .as('pages.inventory')
      .use(middleware.catalogPermission({ action: 'read' }))
    router
      .get('/seller-accounts', [SellerAccountsController, 'index'])
      .as('pages.accounts')
      .use(middleware.operationsPermission({ resource: 'integrations', action: 'read' }))
    router
      .get('/shipments', [ShipmentsController, 'index'])
      .as('pages.shipments')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'read' }))
    router
      .get('/returns', [ReturnsController, 'index'])
      .as('pages.returns')
      .use(middleware.operationsPermission({ resource: 'returns', action: 'read' }))
    router
      .get('/claims', [ClaimsController, 'index'])
      .as('pages.claims')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'read' }))
    router
      .get('/finance', [FinanceController, 'index'])
      .as('pages.finance')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'read' }))
    router
      .get('/tasks', [ToolsController, 'tasksPage'])
      .as('pages.tasks')
      .use(middleware.operationsPermission({ resource: 'tasks', action: 'read' }))
    router
      .get('/import', [ToolsController, 'importPage'])
      .as('pages.import')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'read' }))
    router.get('/audit', [ToolsController, 'auditPage']).as('pages.audit')
    router
      .get('/address-cleanup', [AddressCleanupController, 'index'])
      .as('pages.address_cleanup')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'read' }))
    router
      .get('/tools/address-cleanup', [AddressCleanupController, 'index'])
      .as('pages.tools_address_cleanup')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'read' }))
    router.get('/admin', [AdminController, 'index']).as('pages.admin').use(middleware.superAdmin())

    router.post('/logout', [SessionController, 'destroy']).as('session.destroy')

    /* ---------- Orders & bulk marketplace operations ---------- */
    router
      .post('/orders', [OrdersController, 'storeOrder'])
      .as('orders.store')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'create' }))
    router
      .post('/orders/bulk-import', [OrdersController, 'importBulkOrders'])
      .as('orders.bulk_import')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'create' }))
    router
      .post('/orders/bulk/status', [OrdersController, 'bulkUpdateStatus'])
      .as('orders.bulk_status')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'update' }))
    router
      .post('/orders/bulk/export', [OrdersController, 'bulkExport'])
      .as('orders.bulk_export')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'export' }))
    router
      .post('/orders/:id/status', [OrdersController, 'updateOrderStatus'])
      .as('orders.update_status')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'update' }))
    router
      .post('/orders/:id/delete', [OrdersController, 'deleteOrder'])
      .as('orders.delete')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'delete' }))

    /* ---------- Customers, merge & risk review ---------- */
    router
      .post('/customers', [CustomersController, 'storeCustomer'])
      .as('customers.store')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'create' }))
    router
      .post('/customers/merge', [CustomersController, 'mergeCustomers'])
      .as('customers.merge')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'update' }))
    router
      .post('/customers/:id', [CustomersController, 'updateCustomer'])
      .as('customers.update')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'update' }))
    router
      .post('/customers/:id/delete', [CustomersController, 'deleteCustomer'])
      .as('customers.delete')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'delete' }))
    router
      .post('/risk-signals/:id/review', [CustomersController, 'reviewRiskSignal'])
      .as('risk_signals.review')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'update' }))

    /* ---------- Catalog Pipeline: Medusa sync, CatalogItem CRUD, Preview/Convert, Platform Listing Transformers ---------- */
    router
      .post('/catalogs/sync-categories', [ProductsController, 'syncMedusaCategories'])
      .as('catalogs.sync_categories')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/catalogs/import', [ProductsController, 'importCatalogJson'])
      .as('catalogs.import')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/catalogs/import-json', [ProductsController, 'importCatalogJson'])
      .as('catalogs.import_json')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/catalog-items', [ProductsController, 'saveCatalogItem'])
      .as('catalog_items.store')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/catalog-items/:id', [ProductsController, 'saveCatalogItem'])
      .as('catalog_items.update')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/catalog-items/:id/delete', [ProductsController, 'deleteCatalogItem'])
      .as('catalog_items.delete')
      .use(middleware.catalogPermission({ action: 'delete' }))
    router
      .post('/catalog-items/:id/preview', [ProductsController, 'previewCatalogConversion'])
      .as('catalog_items.preview')
      .use(middleware.catalogPermission({ action: 'read' }))
    router
      .post('/catalog-items/:id/convert', [ProductsController, 'convertCatalogItemToProduct'])
      .as('catalog_items.convert')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/catalogs/generate-listings', [ProductsController, 'generatePlatformListings'])
      .as('catalogs.generate_listings')
      .use(middleware.catalogPermission({ action: 'create' }))

    /* ---------- Catalog: brands, categories, products, variants, listings ---------- */
    router
      .post('/brands', [ProductsController, 'storeBrand'])
      .as('brands.store')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/brands/:id', [ProductsController, 'updateBrand'])
      .as('brands.update')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/brands/:id/delete', [ProductsController, 'deleteBrand'])
      .as('brands.delete')
      .use(middleware.catalogPermission({ action: 'delete' }))

    router
      .post('/categories', [ProductsController, 'storeCategory'])
      .as('categories.store')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/categories/:id', [ProductsController, 'updateCategory'])
      .as('categories.update')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/categories/:id/delete', [ProductsController, 'deleteCategory'])
      .as('categories.delete')
      .use(middleware.catalogPermission({ action: 'delete' }))

    router
      .post('/products', [ProductsController, 'storeProduct'])
      .as('products.store')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/products/:id', [ProductsController, 'updateProduct'])
      .as('products.update')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/products/:id/delete', [ProductsController, 'deleteProduct'])
      .as('products.delete')
      .use(middleware.catalogPermission({ action: 'delete' }))

    router
      .post('/products/:id/variants', [ProductsController, 'storeVariant'])
      .as('variants.store')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/variants/:id/stock', [ProductsController, 'updateVariantStock'])
      .as('variants.update_stock')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/variants/:id/delete', [ProductsController, 'deleteVariant'])
      .as('variants.delete')
      .use(middleware.catalogPermission({ action: 'delete' }))

    router
      .post('/channel-listings', [ProductsController, 'storeChannelListing'])
      .as('listings.store')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/channel-listings/publish-sku', [ProductsController, 'publishSkuGroup'])
      .as('listings.publish_sku')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/channel-listings/:id', [ProductsController, 'updateChannelListing'])
      .as('listings.update')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/channel-listings/:id/publish', [ProductsController, 'publishChannelListing'])
      .as('listings.publish')
      .use(middleware.catalogPermission({ action: 'update' }))
    router
      .post('/channel-listings/:id/delete', [ProductsController, 'deleteChannelListing'])
      .as('listings.delete')
      .use(middleware.catalogPermission({ action: 'delete' }))

    /* ---------- Marketplace seller accounts ---------- */
    router
      .post('/seller-accounts', [SellerAccountsController, 'storeSellerAccount'])
      .as('seller_accounts.store')
      .use(middleware.operationsPermission({ resource: 'integrations', action: 'create' }))
    router
      .post('/seller-accounts/:id', [SellerAccountsController, 'updateSellerAccount'])
      .as('seller_accounts.update')
      .use(middleware.operationsPermission({ resource: 'integrations', action: 'update' }))
    router
      .post('/seller-accounts/:id/delete', [SellerAccountsController, 'deleteSellerAccount'])
      .as('seller_accounts.delete')
      .use(middleware.operationsPermission({ resource: 'integrations', action: 'delete' }))
    router
      .post('/seller-accounts/:id/sync', [SellerAccountsController, 'queueSellerSync'])
      .as('seller_accounts.sync')
      .use(middleware.operationsPermission({ resource: 'integrations', action: 'update' }))

    /* ---------- Shipments & carrier invoices ---------- */
    router
      .post('/shipments', [ShipmentsController, 'storeShipment'])
      .as('shipments.store')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'create' }))
    router
      .post('/shipments/bulk/status', [ShipmentsController, 'bulkUpdateShipmentStatus'])
      .as('shipments.bulk_status')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'update' }))
    router
      .post('/shipments/bulk/export', [ShipmentsController, 'bulkExport'])
      .as('shipments.bulk_export')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'export' }))
    router
      .post('/shipments/:id/status', [ShipmentsController, 'updateShipmentStatus'])
      .as('shipments.update_status')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'update' }))
    router
      .post('/shipments/:id/delete', [ShipmentsController, 'deleteShipment'])
      .as('shipments.delete')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'delete' }))

    router
      .post('/shipping-invoices', [ShipmentsController, 'storeCarrierInvoice'])
      .as('shipping_invoices.store')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'create' }))
    router
      .post('/shipping-invoices/:id', [ShipmentsController, 'updateCarrierInvoice'])
      .as('shipping_invoices.update')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'update' }))
    router
      .post('/shipping-invoices/:id/status', [ShipmentsController, 'updateCarrierInvoice'])
      .as('shipping_invoices.update_status')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'update' }))
    router
      .post('/shipping-invoices/:id/delete', [ShipmentsController, 'deleteCarrierInvoice'])
      .as('shipping_invoices.delete')
      .use(middleware.operationsPermission({ resource: 'shipments', action: 'delete' }))

    /* ---------- Returns (RMA) & refunds ---------- */
    router
      .post('/returns', [ReturnsController, 'storeReturn'])
      .as('returns.store')
      .use(middleware.operationsPermission({ resource: 'returns', action: 'create' }))
    router
      .post('/returns/:id/status', [ReturnsController, 'updateReturnStatus'])
      .as('returns.update_status')
      .use(middleware.operationsPermission({ resource: 'returns', action: 'update' }))
    router
      .post('/returns/:id/delete', [ReturnsController, 'deleteReturn'])
      .as('returns.delete')
      .use(middleware.operationsPermission({ resource: 'returns', action: 'delete' }))
    router
      .post('/refunds', [ReturnsController, 'storeRefund'])
      .as('refunds.store')
      .use(middleware.operationsPermission({ resource: 'returns', action: 'create' }))

    /* ---------- Marketplace claims & chargebacks ---------- */
    router
      .post('/claims', [ClaimsController, 'storeClaim'])
      .as('claims.store')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'create' }))
    router
      .post('/claims/:id', [ClaimsController, 'updateClaim'])
      .as('claims.update')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'update' }))
    router
      .post('/claims/:id/status', [ClaimsController, 'updateClaimStatus'])
      .as('claims.update_status')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'update' }))
    router
      .post('/claims/:id/delete', [ClaimsController, 'deleteClaim'])
      .as('claims.delete')
      .use(middleware.operationsPermission({ resource: 'orders', action: 'delete' }))

    /* ---------- Finance: bank accounts, PCI-safe cards, categories, transactions, budgets, goals ---------- */
    router
      .post('/financial-accounts', [FinanceController, 'storeFinancialAccount'])
      .as('financial_accounts.store')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'create' }))
    router
      .post('/financial-accounts/:id', [FinanceController, 'updateFinancialAccount'])
      .as('financial_accounts.update')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'update' }))
    router
      .post('/financial-accounts/:id/delete', [FinanceController, 'deleteFinancialAccount'])
      .as('financial_accounts.delete')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'delete' }))

    router
      .post('/credit-cards', [FinanceController, 'storeCreditCard'])
      .as('credit_cards.store')
      .use(middleware.operationsPermission({ resource: 'credit_cards', action: 'create' }))
    router
      .post('/credit-cards/:id', [FinanceController, 'updateCreditCard'])
      .as('credit_cards.update')
      .use(middleware.operationsPermission({ resource: 'credit_cards', action: 'update' }))
    router
      .post('/credit-cards/:id/delete', [FinanceController, 'deleteCreditCard'])
      .as('credit_cards.delete')
      .use(middleware.operationsPermission({ resource: 'credit_cards', action: 'delete' }))

    router
      .post('/finance-categories', [FinanceController, 'storeFinanceCategory'])
      .as('finance_categories.store')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'create' }))
    router
      .post('/finance-categories/:id', [FinanceController, 'updateFinanceCategory'])
      .as('finance_categories.update')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'update' }))
    router
      .post('/finance-categories/:id/delete', [FinanceController, 'deleteFinanceCategory'])
      .as('finance_categories.delete')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'delete' }))

    router
      .post('/financial-transactions', [FinanceController, 'storeFinancialTransaction'])
      .as('financial_transactions.store')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'create' }))
    router
      .post('/finance/reports', [FinanceController, 'generateReport'])
      .as('finance.reports.store')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'create' }))
    router
      .post('/financial-transactions/:id/reconcile', [FinanceController, 'reconcileTransaction'])
      .as('financial_transactions.reconcile')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'read' }))
      .use(middleware.operationsPermission({ resource: 'finance', action: 'update' }))
    router
      .post('/financial-transactions/:id/reconciliation/reverse', [
        FinanceController,
        'reverseReconciliation',
      ])
      .as('financial_transactions.reverse_reconciliation')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'read' }))
      .use(middleware.operationsPermission({ resource: 'finance', action: 'update' }))
    router
      .post('/financial-transactions/:id/void', [FinanceController, 'voidFinancialTransaction'])
      .as('financial_transactions.void')
      .use(middleware.operationsPermission({ resource: 'finance', action: 'update' }))

    /* ---------- Tasks, reminders, saved views & import jobs ---------- */
    router
      .post('/tasks', [ToolsController, 'storeTask'])
      .as('tasks.store')
      .use(middleware.operationsPermission({ resource: 'tasks', action: 'create' }))
    router
      .post('/tasks/:id', [ToolsController, 'updateTask'])
      .as('tasks.update')
      .use(middleware.operationsPermission({ resource: 'tasks', action: 'update' }))
    router
      .post('/tasks/:id/status', [ToolsController, 'updateTaskStatus'])
      .as('tasks.status')
      .use(middleware.operationsPermission({ resource: 'tasks', action: 'update' }))
    router
      .post('/tasks/:id/complete', [ToolsController, 'completeTask'])
      .as('tasks.complete')
      .use(middleware.operationsPermission({ resource: 'tasks', action: 'update' }))
    router
      .post('/tasks/:id/delete', [ToolsController, 'deleteTask'])
      .as('tasks.delete')
      .use(middleware.operationsPermission({ resource: 'tasks', action: 'delete' }))

    router.post('/saved-views', [ToolsController, 'storeSavedView']).as('saved_views.store')
    router
      .post('/saved-views/:id/delete', [ToolsController, 'deleteSavedView'])
      .as('saved_views.delete')

    router
      .post('/import/upload-catalog', [ToolsController, 'uploadCatalogImport'])
      .as('import.upload_catalog')
      .use(middleware.catalogPermission({ action: 'create' }))
    router
      .post('/import/sync-accounts', [ToolsController, 'triggerAccountSync'])
      .as('import.sync_accounts')
      .use(middleware.operationsPermission({ resource: 'integrations', action: 'update' }))

    /* ---------- Address cleanup tool ---------- */
    router
      .post('/api/tools/address-clean', [AddressCleanupController, 'clean'])
      .as('api.tools.address_clean')
    router
      .post('/api/tools/address-clean/docx', [AddressCleanupController, 'downloadDocx'])
      .as('api.tools.address_clean_docx')
    router
      .post('/address-cleanup/save-customer', [AddressCleanupController, 'saveToCustomer'])
      .as('address_cleanup.save_customer')
      .use(middleware.operationsPermission({ resource: 'customers', action: 'create' }))
    router
      .post('/address-cleanup/process', [AddressCleanupController, 'process'])
      .as('address_cleanup.process')
    router
      .post('/address-cleanup/export-docx', [AddressCleanupController, 'exportDocx'])
      .as('address_cleanup.export_docx')

    /* ---------- Super Admin: Users, RBAC roles, permissions & module entitlements ---------- */
    router
      .group(() => {
        router.post('/admin/users', [AdminController, 'storeUser']).as('admin.users.store')
        router
          .post('/admin/users/:id/status', [AdminController, 'toggleUserStatus'])
          .as('admin.users.status')
        router.post('/admin/users/:id', [AdminController, 'updateUser']).as('admin.users.update')
        router
          .post('/admin/users/:id/delete', [AdminController, 'deleteUser'])
          .as('admin.users.delete')
        router
          .post('/admin/users/:id/roles', [AdminController, 'assignUserRole'])
          .as('admin.users.assign_role')
        router
          .post('/admin/users/:id/modules', [AdminController, 'setModuleAccess'])
          .as('admin.users.module_access')
        router
          .post('/admin/entitlements/:id/toggle', [AdminController, 'toggleModuleEntitlement'])
          .as('admin.entitlements.toggle')
      })
      .use(middleware.superAdmin())
  })
  .use(middleware.auth())
