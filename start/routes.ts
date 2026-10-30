import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

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
    router.get('/orders', [OrdersController, 'index']).as('pages.orders')
    router.get('/customers', [CustomersController, 'index']).as('pages.customers')
    router.get('/catalogs', [ProductsController, 'catalogsPage']).as('pages.catalogs')
    router.get('/products', [ProductsController, 'index']).as('pages.products')
    router.get('/listings', [ProductsController, 'listingsPage']).as('pages.listings')
    router.get('/inventory', [ProductsController, 'inventoryPage']).as('pages.inventory')
    router.get('/seller-accounts', [SellerAccountsController, 'index']).as('pages.accounts')
    router.get('/shipments', [ShipmentsController, 'index']).as('pages.shipments')
    router.get('/returns', [ReturnsController, 'index']).as('pages.returns')
    router.get('/claims', [ClaimsController, 'index']).as('pages.claims')
    router.get('/finance', [FinanceController, 'index']).as('pages.finance')
    router.get('/tasks', [ToolsController, 'tasksPage']).as('pages.tasks')
    router.get('/import', [ToolsController, 'importPage']).as('pages.import')
    router.get('/audit', [ToolsController, 'auditPage']).as('pages.audit')
    router.get('/address-cleanup', [AddressCleanupController, 'index']).as('pages.address_cleanup')
    router
      .get('/tools/address-cleanup', [AddressCleanupController, 'index'])
      .as('pages.tools_address_cleanup')
    router.get('/admin', [AdminController, 'index']).as('pages.admin')

    router.post('/logout', [SessionController, 'destroy']).as('session.destroy')

    /* ---------- Orders & bulk marketplace operations ---------- */
    router.post('/orders', [OrdersController, 'storeOrder']).as('orders.store')
    router
      .post('/orders/bulk-import', [OrdersController, 'importBulkOrders'])
      .as('orders.bulk_import')
    router
      .post('/orders/bulk/status', [OrdersController, 'bulkUpdateStatus'])
      .as('orders.bulk_status')
    router.post('/orders/bulk/export', [OrdersController, 'bulkExport']).as('orders.bulk_export')
    router
      .post('/orders/:id/status', [OrdersController, 'updateOrderStatus'])
      .as('orders.update_status')
    router.post('/orders/:id/delete', [OrdersController, 'deleteOrder']).as('orders.delete')

    /* ---------- Customers, merge & risk review ---------- */
    router.post('/customers', [CustomersController, 'storeCustomer']).as('customers.store')
    router.post('/customers/merge', [CustomersController, 'mergeCustomers']).as('customers.merge')
    router.post('/customers/:id', [CustomersController, 'updateCustomer']).as('customers.update')
    router
      .post('/customers/:id/delete', [CustomersController, 'deleteCustomer'])
      .as('customers.delete')
    router
      .post('/risk-signals/:id/review', [CustomersController, 'reviewRiskSignal'])
      .as('risk_signals.review')

    /* ---------- Catalog Pipeline: Medusa sync, CatalogItem CRUD, Preview/Convert, Platform Listing Transformers ---------- */
    router
      .post('/catalogs/sync-categories', [ProductsController, 'syncMedusaCategories'])
      .as('catalogs.sync_categories')
    router.post('/catalogs/import', [ProductsController, 'importCatalogJson']).as('catalogs.import')
    router
      .post('/catalogs/import-json', [ProductsController, 'importCatalogJson'])
      .as('catalogs.import_json')
    router.post('/catalog-items', [ProductsController, 'saveCatalogItem']).as('catalog_items.store')
    router
      .post('/catalog-items/:id', [ProductsController, 'saveCatalogItem'])
      .as('catalog_items.update')
    router
      .post('/catalog-items/:id/delete', [ProductsController, 'deleteCatalogItem'])
      .as('catalog_items.delete')
    router
      .post('/catalog-items/:id/preview', [ProductsController, 'previewCatalogConversion'])
      .as('catalog_items.preview')
    router
      .post('/catalog-items/:id/convert', [ProductsController, 'convertCatalogItemToProduct'])
      .as('catalog_items.convert')
    router
      .post('/catalogs/generate-listings', [ProductsController, 'generatePlatformListings'])
      .as('catalogs.generate_listings')

    /* ---------- Catalog: brands, categories, products, variants, listings ---------- */
    router.post('/brands', [ProductsController, 'storeBrand']).as('brands.store')
    router.post('/brands/:id', [ProductsController, 'updateBrand']).as('brands.update')
    router.post('/brands/:id/delete', [ProductsController, 'deleteBrand']).as('brands.delete')

    router.post('/categories', [ProductsController, 'storeCategory']).as('categories.store')
    router.post('/categories/:id', [ProductsController, 'updateCategory']).as('categories.update')
    router
      .post('/categories/:id/delete', [ProductsController, 'deleteCategory'])
      .as('categories.delete')

    router.post('/products', [ProductsController, 'storeProduct']).as('products.store')
    router.post('/products/:id', [ProductsController, 'updateProduct']).as('products.update')
    router.post('/products/:id/delete', [ProductsController, 'deleteProduct']).as('products.delete')

    router.post('/products/:id/variants', [ProductsController, 'storeVariant']).as('variants.store')
    router
      .post('/variants/:id/stock', [ProductsController, 'updateVariantStock'])
      .as('variants.update_stock')
    router.post('/variants/:id/delete', [ProductsController, 'deleteVariant']).as('variants.delete')

    router
      .post('/channel-listings', [ProductsController, 'storeChannelListing'])
      .as('listings.store')
    router
      .post('/channel-listings/publish-sku', [ProductsController, 'publishSkuGroup'])
      .as('listings.publish_sku')
    router
      .post('/channel-listings/:id', [ProductsController, 'updateChannelListing'])
      .as('listings.update')
    router
      .post('/channel-listings/:id/publish', [ProductsController, 'publishChannelListing'])
      .as('listings.publish')
    router
      .post('/channel-listings/:id/delete', [ProductsController, 'deleteChannelListing'])
      .as('listings.delete')

    /* ---------- Marketplace seller accounts ---------- */
    router
      .post('/seller-accounts', [SellerAccountsController, 'storeSellerAccount'])
      .as('seller_accounts.store')
    router
      .post('/seller-accounts/:id', [SellerAccountsController, 'updateSellerAccount'])
      .as('seller_accounts.update')
    router
      .post('/seller-accounts/:id/delete', [SellerAccountsController, 'deleteSellerAccount'])
      .as('seller_accounts.delete')

    /* ---------- Shipments & carrier invoices ---------- */
    router.post('/shipments', [ShipmentsController, 'storeShipment']).as('shipments.store')
    router
      .post('/shipments/bulk/status', [ShipmentsController, 'bulkUpdateShipmentStatus'])
      .as('shipments.bulk_status')
    router
      .post('/shipments/bulk/export', [ShipmentsController, 'bulkExport'])
      .as('shipments.bulk_export')
    router
      .post('/shipments/:id/status', [ShipmentsController, 'updateShipmentStatus'])
      .as('shipments.update_status')
    router
      .post('/shipments/:id/delete', [ShipmentsController, 'deleteShipment'])
      .as('shipments.delete')

    router
      .post('/carrier-invoices', [ShipmentsController, 'storeCarrierInvoice'])
      .as('carrier_invoices.store')
    router
      .post('/carrier-invoices/:id', [ShipmentsController, 'updateCarrierInvoice'])
      .as('carrier_invoices.update')
    router
      .post('/carrier-invoices/:id/status', [ShipmentsController, 'updateCarrierInvoice'])
      .as('carrier_invoices.update_status')
    router
      .post('/carrier-invoices/:id/delete', [ShipmentsController, 'deleteCarrierInvoice'])
      .as('carrier_invoices.delete')
    router
      .post('/shipping-invoices', [ShipmentsController, 'storeCarrierInvoice'])
      .as('shipping_invoices.store')
    router
      .post('/shipping-invoices/:id', [ShipmentsController, 'updateCarrierInvoice'])
      .as('shipping_invoices.update')
    router
      .post('/shipping-invoices/:id/status', [ShipmentsController, 'updateCarrierInvoice'])
      .as('shipping_invoices.update_status')
    router
      .post('/shipping-invoices/:id/delete', [ShipmentsController, 'deleteCarrierInvoice'])
      .as('shipping_invoices.delete')

    /* ---------- Returns (RMA) & refunds ---------- */
    router.post('/returns', [ReturnsController, 'storeReturn']).as('returns.store')
    router
      .post('/returns/:id/status', [ReturnsController, 'updateReturnStatus'])
      .as('returns.update_status')
    router.post('/returns/:id/delete', [ReturnsController, 'deleteReturn']).as('returns.delete')
    router.post('/refunds', [ReturnsController, 'storeRefund']).as('refunds.store')

    /* ---------- Marketplace claims & chargebacks ---------- */
    router.post('/claims', [ClaimsController, 'storeClaim']).as('claims.store')
    router.post('/claims/:id', [ClaimsController, 'updateClaim']).as('claims.update')
    router
      .post('/claims/:id/status', [ClaimsController, 'updateClaimStatus'])
      .as('claims.update_status')
    router.post('/claims/:id/delete', [ClaimsController, 'deleteClaim']).as('claims.delete')

    /* ---------- Finance: bank accounts, PCI-safe cards, categories, transactions, budgets, goals ---------- */
    router
      .post('/financial-accounts', [FinanceController, 'storeFinancialAccount'])
      .as('financial_accounts.store')
    router
      .post('/financial-accounts/:id', [FinanceController, 'updateFinancialAccount'])
      .as('financial_accounts.update')
    router
      .post('/financial-accounts/:id/delete', [FinanceController, 'deleteFinancialAccount'])
      .as('financial_accounts.delete')

    router
      .post('/finance-accounts', [FinanceController, 'storeFinanceAccount'])
      .as('finance_accounts.store')
    router
      .post('/finance-accounts/:id', [FinanceController, 'updateFinanceAccount'])
      .as('finance_accounts.update')
    router
      .post('/finance-accounts/:id/delete', [FinanceController, 'deleteFinanceAccount'])
      .as('finance_accounts.delete')

    router.post('/credit-cards', [FinanceController, 'storeCreditCard']).as('credit_cards.store')
    router
      .post('/credit-cards/:id', [FinanceController, 'updateCreditCard'])
      .as('credit_cards.update')
    router
      .post('/credit-cards/:id/delete', [FinanceController, 'deleteCreditCard'])
      .as('credit_cards.delete')

    router
      .post('/finance-categories', [FinanceController, 'storeFinanceCategory'])
      .as('finance_categories.store')
    router
      .post('/finance-categories/:id', [FinanceController, 'updateFinanceCategory'])
      .as('finance_categories.update')
    router
      .post('/finance-categories/:id/delete', [FinanceController, 'deleteFinanceCategory'])
      .as('finance_categories.delete')

    router
      .post('/financial-transactions', [FinanceController, 'storeFinancialTransaction'])
      .as('financial_transactions.store')
    router
      .post('/financial-transactions/:id/void', [FinanceController, 'voidFinancialTransaction'])
      .as('financial_transactions.void')

    /* ---------- Tasks, reminders, saved views & import jobs ---------- */
    router.post('/tasks', [ToolsController, 'storeTask']).as('tasks.store')
    router.post('/tasks/:id', [ToolsController, 'updateTask']).as('tasks.update')
    router.post('/tasks/:id/status', [ToolsController, 'updateTaskStatus']).as('tasks.status')
    router.post('/tasks/:id/complete', [ToolsController, 'completeTask']).as('tasks.complete')
    router.post('/tasks/:id/delete', [ToolsController, 'deleteTask']).as('tasks.delete')

    router.post('/saved-views', [ToolsController, 'storeSavedView']).as('saved_views.store')
    router
      .post('/saved-views/:id/delete', [ToolsController, 'deleteSavedView'])
      .as('saved_views.delete')

    router
      .post('/import/upload-catalog', [ToolsController, 'uploadCatalogImport'])
      .as('import.upload_catalog')
    router
      .post('/import/sync-accounts', [ToolsController, 'triggerAccountSync'])
      .as('import.sync_accounts')

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
    router
      .post('/address-cleanup/process', [AddressCleanupController, 'process'])
      .as('address_cleanup.process')
    router
      .post('/address-cleanup/export-docx', [AddressCleanupController, 'exportDocx'])
      .as('address_cleanup.export_docx')

    /* ---------- Super Admin: Users, RBAC roles, permissions & module entitlements ---------- */
    router.post('/admin/users', [AdminController, 'storeUser']).as('admin.users.store')
    router
      .post('/admin/users/:id/status', [AdminController, 'toggleUserStatus'])
      .as('admin.users.status')
    router.post('/admin/users/:id', [AdminController, 'updateUser']).as('admin.users.update')
    router.post('/admin/users/:id/delete', [AdminController, 'deleteUser']).as('admin.users.delete')
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
  .use(middleware.auth())
