import type { HttpContext } from '@adonisjs/core/http'
import DashboardController from './dashboard_controller.js'
import OrdersController from './orders_controller.js'
import ProductsController from './products_controller.js'
import CustomersController from './customers_controller.js'
import SellerAccountsController from './seller_accounts_controller.js'
import ShipmentsController from './shipments_controller.js'
import ReturnsController from './returns_controller.js'
import ClaimsController from './claims_controller.js'
import FinanceController from './finance_controller.js'
import ToolsController from './tools_controller.js'
import AdminController from './admin_controller.js'

/**
 * Delegating facade that routes legacy OperationsController calls to the
 * feature-split controllers (`orders_controller`, `products_controller`, etc.).
 */
export default class OperationsController {
  index(ctx: HttpContext) {
    return new DashboardController().index(ctx)
  }
  queueOverview(ctx: HttpContext) {
    return new DashboardController().queueOverview(ctx)
  }
  storeOrder(ctx: HttpContext) {
    return new OrdersController().storeOrder(ctx)
  }
  updateOrderStatus(ctx: HttpContext) {
    return new OrdersController().updateOrderStatus(ctx)
  }
  deleteOrder(ctx: HttpContext) {
    return new OrdersController().deleteOrder(ctx)
  }
  importBulkOrders(ctx: HttpContext) {
    return new OrdersController().importBulkOrders(ctx)
  }
  storeCustomer(ctx: HttpContext) {
    return new CustomersController().storeCustomer(ctx)
  }
  updateCustomer(ctx: HttpContext) {
    return new CustomersController().updateCustomer(ctx)
  }
  deleteCustomer(ctx: HttpContext) {
    return new CustomersController().deleteCustomer(ctx)
  }
  mergeCustomers(ctx: HttpContext) {
    return new CustomersController().mergeCustomers(ctx)
  }
  reviewRiskSignal(ctx: HttpContext) {
    return new CustomersController().reviewRiskSignal(ctx)
  }
  storeProduct(ctx: HttpContext) {
    return new ProductsController().storeProduct(ctx)
  }
  updateProduct(ctx: HttpContext) {
    return new ProductsController().updateProduct(ctx)
  }
  deleteProduct(ctx: HttpContext) {
    return new ProductsController().deleteProduct(ctx)
  }
  storeVariant(ctx: HttpContext) {
    return new ProductsController().storeVariant(ctx)
  }
  updateVariantStock(ctx: HttpContext) {
    return new ProductsController().updateVariantStock(ctx)
  }
  deleteVariant(ctx: HttpContext) {
    return new ProductsController().deleteVariant(ctx)
  }
  storeBrand(ctx: HttpContext) {
    return new ProductsController().storeBrand(ctx)
  }
  updateBrand(ctx: HttpContext) {
    return new ProductsController().updateBrand(ctx)
  }
  deleteBrand(ctx: HttpContext) {
    return new ProductsController().deleteBrand(ctx)
  }
  storeCategory(ctx: HttpContext) {
    return new ProductsController().storeCategory(ctx)
  }
  updateCategory(ctx: HttpContext) {
    return new ProductsController().updateCategory(ctx)
  }
  deleteCategory(ctx: HttpContext) {
    return new ProductsController().deleteCategory(ctx)
  }
  storeChannelListing(ctx: HttpContext) {
    return new ProductsController().storeChannelListing(ctx)
  }
  deleteChannelListing(ctx: HttpContext) {
    return new ProductsController().deleteChannelListing(ctx)
  }
  storeSellerAccount(ctx: HttpContext) {
    return new SellerAccountsController().storeSellerAccount(ctx)
  }
  updateSellerAccount(ctx: HttpContext) {
    return new SellerAccountsController().updateSellerAccount(ctx)
  }
  deleteSellerAccount(ctx: HttpContext) {
    return new SellerAccountsController().deleteSellerAccount(ctx)
  }
  queueSellerSync(ctx: HttpContext) {
    return new SellerAccountsController().queueSellerSync(ctx)
  }
  storeShipment(ctx: HttpContext) {
    return new ShipmentsController().storeShipment(ctx)
  }
  updateShipmentStatus(ctx: HttpContext) {
    return new ShipmentsController().updateShipmentStatus(ctx)
  }
  storeShippingInvoice(ctx: HttpContext) {
    return new ShipmentsController().storeShippingInvoice(ctx)
  }
  updateInvoiceStatus(ctx: HttpContext) {
    return new ShipmentsController().updateInvoiceStatus(ctx)
  }
  storeReturnRequest(ctx: HttpContext) {
    return new ReturnsController().storeReturnRequest(ctx)
  }
  updateReturnStatus(ctx: HttpContext) {
    return new ReturnsController().updateReturnStatus(ctx)
  }
  storeRefund(ctx: HttpContext) {
    return new ReturnsController().storeRefund(ctx)
  }
  storeMarketplaceClaim(ctx: HttpContext) {
    return new ClaimsController().storeMarketplaceClaim(ctx)
  }
  updateClaimStatus(ctx: HttpContext) {
    return new ClaimsController().updateClaimStatus(ctx)
  }
  storeFinancialAccount(ctx: HttpContext) {
    return new FinanceController().storeFinancialAccount(ctx)
  }
  updateFinancialAccount(ctx: HttpContext) {
    return new FinanceController().updateFinancialAccount(ctx)
  }
  deleteFinancialAccount(ctx: HttpContext) {
    return new FinanceController().deleteFinancialAccount(ctx)
  }
  storeCreditCard(ctx: HttpContext) {
    return new FinanceController().storeCreditCard(ctx)
  }
  updateCreditCard(ctx: HttpContext) {
    return new FinanceController().updateCreditCard(ctx)
  }
  deleteCreditCard(ctx: HttpContext) {
    return new FinanceController().deleteCreditCard(ctx)
  }
  storeFinancialTransaction(ctx: HttpContext) {
    return new FinanceController().storeFinancialTransaction(ctx)
  }
  voidFinancialTransaction(ctx: HttpContext) {
    return new FinanceController().voidFinancialTransaction(ctx)
  }
  storeTask(ctx: HttpContext) {
    return new ToolsController().storeTask(ctx)
  }
  updateTask(ctx: HttpContext) {
    return new ToolsController().updateTask(ctx)
  }
  completeTask(ctx: HttpContext) {
    return new ToolsController().completeTask(ctx)
  }
  deleteTask(ctx: HttpContext) {
    return new ToolsController().deleteTask(ctx)
  }
  storeSavedView(ctx: HttpContext) {
    return new ToolsController().storeSavedView(ctx)
  }
  deleteSavedView(ctx: HttpContext) {
    return new ToolsController().deleteSavedView(ctx)
  }
  uploadCatalogFile(ctx: HttpContext) {
    return new ToolsController().uploadCatalogFile(ctx)
  }
  storeUser(ctx: HttpContext) {
    return new AdminController().storeUser(ctx)
  }
  toggleUserStatus(ctx: HttpContext) {
    return new AdminController().toggleUserStatus(ctx)
  }
  deleteUser(ctx: HttpContext) {
    return new AdminController().deleteUser(ctx)
  }
  assignUserRole(ctx: HttpContext) {
    return new AdminController().assignUserRole(ctx)
  }
  toggleModuleEntitlement(ctx: HttpContext) {
    return new AdminController().toggleModuleEntitlement(ctx)
  }
}
