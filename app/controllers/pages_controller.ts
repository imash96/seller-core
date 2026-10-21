import type { HttpContext } from '@adonisjs/core/http'
import OrdersController from './orders_controller.js'
import CustomersController from './customers_controller.js'
import ProductsController from './products_controller.js'
import SellerAccountsController from './seller_accounts_controller.js'
import ShipmentsController from './shipments_controller.js'
import ReturnsController from './returns_controller.js'
import ClaimsController from './claims_controller.js'
import FinanceController from './finance_controller.js'
import ToolsController from './tools_controller.js'
import AdminController from './admin_controller.js'
import AddressCleanupController from './address_cleanup_controller.js'

/**
 * Delegating facade preserving backwards compatibility with routes/types that
 * reference PagesController while individual feature controllers handle each domain.
 */
export default class PagesController {
  ordersPage(ctx: HttpContext) {
    return new OrdersController().index(ctx)
  }
  customersPage(ctx: HttpContext) {
    return new CustomersController().index(ctx)
  }
  productsPage(ctx: HttpContext) {
    return new ProductsController().index(ctx)
  }
  inventoryPage(ctx: HttpContext) {
    return new ProductsController().inventoryPage(ctx)
  }
  catalogsPage(ctx: HttpContext) {
    return new ProductsController().catalogsPage(ctx)
  }
  accountsPage(ctx: HttpContext) {
    return new SellerAccountsController().index(ctx)
  }
  shipmentsPage(ctx: HttpContext) {
    return new ShipmentsController().index(ctx)
  }
  returnsPage(ctx: HttpContext) {
    return new ReturnsController().index(ctx)
  }
  claimsPage(ctx: HttpContext) {
    return new ClaimsController().index(ctx)
  }
  financePage(ctx: HttpContext) {
    return new FinanceController().index(ctx)
  }
  tasksPage(ctx: HttpContext) {
    return new ToolsController().tasksPage(ctx)
  }
  adminPage(ctx: HttpContext) {
    return new AdminController().index(ctx)
  }
  auditPage(ctx: HttpContext) {
    return new ToolsController().auditPage(ctx)
  }
  importPage(ctx: HttpContext) {
    return new ToolsController().importPage(ctx)
  }
  addressCleanupPage(ctx: HttpContext) {
    return new AddressCleanupController().index(ctx)
  }
}
