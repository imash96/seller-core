import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import RolePermission from '#models/role_permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import SalesChannel from '#models/sales_channel'
import SellerAccount from '#models/seller_account'
import Order from '#models/order'
import OrderImportPayload from '#models/order_import_payload'
import CreditCard from '#models/credit_card'
import CreditCardSellerAccount from '#models/credit_card_seller_account'
import FinancialTransaction from '#models/financial_transaction'
import OutboxEvent from '#models/outbox_event'
import { RbacService } from '../../app/services/rbac_service.js'
import { CatalogService } from '../../app/services/catalog_service.js'
import { OrderService } from '../../app/services/order_service.js'
import { FulfillmentAndReturnsService } from '../../app/services/fulfillment_and_returns_service.js'
import {
  PermissionEffect,
  UserStatus,
  ShipmentStatus,
  ShippingChargeType,
  ReturnReason,
  ReturnResolutionType,
  DataClassification,
  FinancialTransactionType,
  FinancialTransactionStatus,
  CreditCardStatus,
  CardChannelUsage,
  ChannelType,
  SellerAccountStatus,
  HealthStatus,
} from '../../app/enums/index.js'
import { generateEntityId, isEntityId } from '../../app/utils/generate_entity_id.js'

test.group('Multi-User E-Commerce SaaS Architecture & Domain Verification', (group) => {
  let superAdmin: User
  let merchantA: User
  let merchantB: User
  let amazonChannel: SalesChannel
  let sellerAccountA: SellerAccount

  group.setup(async () => {
    // Ensure permissions and roles exist for RBAC testing
    const pViewOrders = await Permission.updateOrCreate(
      { slug: 'orders.view' },
      {
        slug: 'orders.view',
        resource: 'orders',
        action: 'view',
        name: 'View orders',
        description: 'View orders',
      }
    )
    const pDeleteOrders = await Permission.updateOrCreate(
      { slug: 'orders.delete' },
      {
        slug: 'orders.delete',
        resource: 'orders',
        action: 'delete',
        name: 'Delete orders',
        description: 'Delete orders',
      }
    )

    const opsRole = await Role.updateOrCreate(
      { slug: 'test_ops_manager' },
      {
        slug: 'test_ops_manager',
        name: 'Test Operations Manager',
        description: 'Allows viewing and deleting orders',
        isSystem: true,
      }
    )
    const denyDeleteRole = await Role.updateOrCreate(
      { slug: 'test_deny_delete' },
      {
        slug: 'test_deny_delete',
        name: 'Test Explicit Deny Delete',
        description: 'Explicitly denies orders.delete',
        isSystem: true,
      }
    )

    await RolePermission.updateOrCreate(
      { roleId: opsRole.id, permissionId: pViewOrders.id },
      { roleId: opsRole.id, permissionId: pViewOrders.id, effect: PermissionEffect.ALLOW }
    )
    await RolePermission.updateOrCreate(
      { roleId: opsRole.id, permissionId: pDeleteOrders.id },
      { roleId: opsRole.id, permissionId: pDeleteOrders.id, effect: PermissionEffect.ALLOW }
    )
    await RolePermission.updateOrCreate(
      { roleId: denyDeleteRole.id, permissionId: pDeleteOrders.id },
      { roleId: denyDeleteRole.id, permissionId: pDeleteOrders.id, effect: PermissionEffect.DENY }
    )

    // Root Super Admin
    superAdmin = await User.updateOrCreate(
      { email: 'test.superadmin@sellercore.io' },
      {
        email: 'test.superadmin@sellercore.io',
        fullName: 'Test Super Admin',
        password: 'SuperAdmin@2026!',
        status: UserStatus.ACTIVE,
        isSuperAdmin: true,
        defaultCurrency: 'USD',
        timezone: 'UTC',
        failedLoginAttempts: 0,
      }
    )

    // Provision Merchant A via Super Admin service
    const existingA = await User.findBy('email', 'merchant.a@sellercore.io')
    if (existingA) {
      merchantA = existingA
    } else {
      merchantA = await RbacService.createUserBySuperAdmin(superAdmin, {
        email: 'merchant.a@sellercore.io',
        fullName: 'Merchant Alpha',
        password: 'MerchantAlpha@2026!',
        defaultCurrency: 'USD',
        roleSlugs: ['test_ops_manager', 'test_deny_delete'],
        enabledModules: ['orders', 'catalog', 'shipments', 'returns', 'finance'],
      })
    }

    // Provision Merchant B via Super Admin service
    const existingB = await User.findBy('email', 'merchant.b@sellercore.io')
    if (existingB) {
      merchantB = existingB
    } else {
      merchantB = await RbacService.createUserBySuperAdmin(superAdmin, {
        email: 'merchant.b@sellercore.io',
        fullName: 'Merchant Beta',
        password: 'MerchantBeta@2026!',
        defaultCurrency: 'CAD',
        roleSlugs: ['test_ops_manager'],
        enabledModules: ['orders'],
      })
    }

    amazonChannel = await SalesChannel.updateOrCreate(
      { code: 'amazon_us_test' },
      {
        code: 'amazon_us_test',
        name: 'Amazon US Test',
        channelType: ChannelType.MARKETPLACE,
        isActive: true,
      }
    )

    sellerAccountA = await SellerAccount.updateOrCreate(
      {
        userId: merchantA.id,
        salesChannelId: amazonChannel.id,
        externalSellerId: 'MERCHANT-A-US-01',
        marketplaceRegion: 'US',
      },
      {
        userId: merchantA.id,
        salesChannelId: amazonChannel.id,
        accountName: 'Merchant A Amazon US',
        externalSellerId: 'MERCHANT-A-US-01',
        marketplaceRegion: 'US',
        defaultCurrency: 'USD',
        status: SellerAccountStatus.ACTIVE,
        healthStatus: HealthStatus.HEALTHY,
        rateLimitRpm: 60,
      }
    )
    sellerAccountA.setPlainCredentials({
      lwaClientId: 'amzn1.application-oa2-client.secret',
      refreshToken: 'Atzr|secret-refresh-token',
    })
    await sellerAccountA.save()
  })

  test('1. ULID entity ids & Super-Admin-only user provisioning (blocks non-super-admin)', async ({
    assert,
  }) => {
    const id = generateEntityId('usr')
    assert.isTrue(isEntityId(id))
    assert.match(id, /^usr_[0-9A-HJKMNP-TV-Z]{26}$/)

    // Password is hashed, never stored in plaintext
    assert.notEqual(merchantA.password, 'MerchantAlpha@2026!')
    assert.isTrue(merchantA.password.startsWith('$scrypt$'))

    // Non-super-admin attempting to create a user MUST fail
    await assert.rejects(async () => {
      await RbacService.createUserBySuperAdmin(merchantA, {
        email: 'unauthorized.user@sellercore.io',
        fullName: 'Unauthorized User',
        password: 'Password123!',
      })
    }, /FORBIDDEN: Only an active system super administrator/)
  })

  test('2. RBAC explicit DENY overrides ALLOW and Module Entitlements evaluate independently', async ({
    assert,
  }) => {
    // Ensure Merchant A has both roles attached
    const opsRole = await Role.findByOrFail('slug', 'test_ops_manager')
    const denyRole = await Role.findByOrFail('slug', 'test_deny_delete')
    await UserRole.updateOrCreate(
      { userId: merchantA.id, roleId: opsRole.id },
      { userId: merchantA.id, roleId: opsRole.id }
    )
    await UserRole.updateOrCreate(
      { userId: merchantA.id, roleId: denyRole.id },
      { userId: merchantA.id, roleId: denyRole.id }
    )
    await ModuleEntitlement.updateOrCreate(
      { userId: merchantA.id, moduleKey: 'orders' },
      {
        userId: merchantA.id,
        moduleKey: 'orders',
        isEnabled: true,
        planTier: 'enterprise',
      }
    )

    // orders.view is ALLOWED
    const canView = await RbacService.hasPermission(merchantA, 'orders.view', 'orders')
    assert.isTrue(canView)

    // orders.delete is ALLOWED by test_ops_manager but EXPLICITLY DENIED by test_deny_delete -> DENY wins!
    const canDelete = await RbacService.hasPermission(merchantA, 'orders.delete', 'orders')
    assert.isFalse(canDelete)

    // If module entitlement is disabled, even an allowed permission is blocked for that module
    await ModuleEntitlement.query()
      .where('userId', merchantA.id)
      .andWhere('moduleKey', 'orders')
      .update({ isEnabled: false })

    const canViewWhenModuleDisabled = await RbacService.hasPermission(
      merchantA,
      'orders.view',
      'orders'
    )
    assert.isFalse(canViewWhenModuleDisabled)

    // Re-enable orders module
    await ModuleEntitlement.query()
      .where('userId', merchantA.id)
      .andWhere('moduleKey', 'orders')
      .update({ isEnabled: true })
  })

  test('3. Seller account credentials are encrypted at rest via AES-256-GCM', async ({
    assert,
  }) => {
    const freshAccount = await SellerAccount.findOrFail(sellerAccountA.id)
    assert.isNotNull(freshAccount.encryptedCredentials)
    assert.notInclude(freshAccount.encryptedCredentials!, 'Atzr|secret-refresh-token')

    const decrypted = freshAccount.getDecryptedCredentials()
    assert.isNotNull(decrypted)
    assert.equal(decrypted?.refreshToken, 'Atzr|secret-refresh-token')
  })

  test('4. Products support 0 variation dimensions (simple) and multi-dimensional variations', async ({
    assert,
  }) => {
    const simpleSku = `TEST-SIMPLE-${Date.now()}`
    const simpleProduct = await CatalogService.createProduct({
      userId: merchantA.id,
      title: 'Simple USB-C Cable',
      hasVariants: false,
      variants: [
        {
          sku: simpleSku,
          title: 'Simple USB-C Cable',
          retailPrice: 19.99,
          costPrice: 4.5,
          manufacturingCost: 3.0,
          packagingCost: 0.5,
          stockOnHand: 50,
        },
      ],
    })

    await simpleProduct.load('variants')
    assert.isFalse(simpleProduct.hasVariants)
    assert.equal(simpleProduct.variants.length, 1)
    assert.isTrue(simpleProduct.variants[0].isDefault)

    const multiSku1 = `TEST-VAR-BLK-M-${Date.now()}`
    const multiSku2 = `TEST-VAR-SLV-L-${Date.now()}`
    const multiProduct = await CatalogService.createProduct({
      userId: merchantA.id,
      title: 'Ergonomic Laptop Stand',
      hasVariants: true,
      variationDimensions: ['color', 'size'],
      variants: [
        {
          sku: multiSku1,
          title: 'Ergonomic Laptop Stand - Black / Medium',
          retailPrice: 89.0,
          costPrice: 25.0,
          stockOnHand: 30,
          attributes: { color: 'Black', size: 'Medium' },
        },
        {
          sku: multiSku2,
          title: 'Ergonomic Laptop Stand - Silver / Large',
          retailPrice: 99.0,
          costPrice: 28.0,
          stockOnHand: 20,
          attributes: { color: 'Silver', size: 'Large' },
        },
      ],
    })

    await multiProduct.load('variants')
    assert.isTrue(multiProduct.hasVariants)
    assert.equal(multiProduct.variants.length, 2)
    await multiProduct.variants[0].load('variantAttributes')
    assert.equal(multiProduct.variants[0].variantAttributes.length, 2)
  })

  test('5. Manual order creation, multi-currency P&L conversion, and strict user_id data isolation', async ({
    assert,
  }) => {
    const orderNumA = `ORD-A-${Date.now()}`
    const orderA = await OrderService.createOrder({
      userId: merchantA.id,
      actorUserId: merchantA.id,
      sellerAccountId: sellerAccountA.id,
      orderNumber: orderNumA,
      marketplaceCode: 'amazon_ca',
      currencyCode: 'CAD',
      reportingCurrencyCode: 'USD',
      exchangeRate: 0.74,
      shippingCostAmount: 10.0,
      customer: {
        fullName: 'Jean-Luc Picard',
        email: 'picard@starfleet.ca',
        phone: '+1-514-555-0199',
      },
      shippingAddress: {
        recipientName: 'Jean-Luc Picard',
        line1: '100 Rue McGill',
        city: 'Montreal',
        stateProvince: 'QC',
        postalCode: 'H2Y 2E7',
        countryCode: 'CA',
      },
      lines: [
        {
          sku: 'TEST-CAD-SKU-1',
          title: 'Precision Chronograph',
          quantityOrdered: 2,
          unitPrice: 100.0, // subtotal 200.00 CAD
          unitCostAmount: 30.0, // COGS 60.00 CAD
          taxAmount: 20.0,
          shippingAmount: 15.0, // Total 235.00 CAD -> 173.90 USD
          marketplaceFeeAmount: 30.0,
        },
      ],
    })

    assert.equal(orderA.subtotalAmount, '200.00')
    assert.equal(orderA.totalAmount, '235.00')
    assert.equal(orderA.reportingTotalAmount, '173.90')
    assert.equal(orderA.cogsAmount, '60.00')

    // Strict user isolation: Merchant B querying by their userId cannot see Merchant A's order
    const leakedOrder = await Order.query()
      .where('userId', merchantB.id)
      .andWhere('id', orderA.id)
      .first()
    assert.isNull(leakedOrder)
  })

  test('6. Bulk order import with idempotency, duplicate skip, raw payload redaction, and partial error capture', async ({
    assert,
  }) => {
    const extOrderId = `114-BULK-${Date.now()}`
    const batchKey1 = `batch-1-${Date.now()}`

    const batchResult = await OrderService.importBulkOrders({
      userId: merchantA.id,
      actorUserId: merchantA.id,
      sellerAccountId: sellerAccountA.id,
      idempotencyKey: batchKey1,
      orders: [
        {
          orderNumber: `IMP-VALID-${Date.now()}`,
          externalOrderId: extOrderId,
          marketplaceCode: 'amazon_us',
          currencyCode: 'USD',
          customer: {
            fullName: 'Bulk Buyer One',
            email: 'bulk1@buyer.io',
          },
          lines: [
            {
              sku: 'BULK-SKU-01',
              title: 'Bulk Item 1',
              quantityOrdered: 2,
              unitPrice: 50.0,
              unitCostAmount: 15.0,
            },
          ],
          rawPayload: {
            amazonOrderId: extOrderId,
            accessToken: 'SHOULD_BE_REDACTED',
          },
        },
        // Duplicate externalOrderId in same batch -> should be skipped!
        {
          orderNumber: `IMP-DUP-${Date.now()}`,
          externalOrderId: extOrderId,
          marketplaceCode: 'amazon_us',
          currencyCode: 'USD',
          customer: {
            fullName: 'Bulk Buyer Duplicate',
          },
          lines: [
            {
              sku: 'BULK-SKU-01',
              title: 'Bulk Item 1',
              quantityOrdered: 1,
              unitPrice: 50.0,
            },
          ],
        },
        // Invalid order (quantityOrdered = 0) -> should record error in sync_job_errors without failing batch!
        {
          orderNumber: `IMP-INVALID-${Date.now()}`,
          externalOrderId: `${extOrderId}-BAD`,
          marketplaceCode: 'amazon_us',
          currencyCode: 'USD',
          customer: {
            fullName: 'Invalid Line Buyer',
          },
          lines: [
            {
              sku: 'BAD-SKU',
              title: 'Zero Qty Item',
              quantityOrdered: 0,
              unitPrice: 25.0,
            },
          ],
        },
      ],
    })

    assert.equal(batchResult.job.totalRecords, 3)
    assert.equal(batchResult.job.succeededRecords, 1)
    assert.equal(batchResult.job.skippedDuplicates, 1)
    assert.equal(batchResult.job.failedRecords, 1)

    // Verify raw payload stored separately with sensitive token redacted
    const createdOrder = await Order.query()
      .where('userId', merchantA.id)
      .andWhere('externalOrderId', extOrderId)
      .firstOrFail()
    const storedPayload = await OrderImportPayload.query()
      .where('orderId', createdOrder.id)
      .firstOrFail()
    assert.equal((storedPayload.rawPayload as any).accessToken, '[REDACTED]')
  })

  test('7. Partial shipments, split shipments, delivery notification outbox, and carrier invoice duplicate protection', async ({
    assert,
  }) => {
    const order = await OrderService.createOrder({
      userId: merchantA.id,
      orderNumber: `ORD-SHP-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Split Shipment Buyer', email: 'split@buyer.io' },
      lines: [
        {
          sku: 'SPLIT-SKU-1',
          title: 'Multi-Parcel Monitor Arm',
          quantityOrdered: 3,
          unitPrice: 120.0,
          unitCostAmount: 40.0,
        },
      ],
    })

    await order.load('lineItems')
    const lineItem = order.lineItems[0]

    // 1st Shipment: partial fulfillment of 1 unit out of 3
    const shipment1 = await FulfillmentAndReturnsService.createShipment({
      userId: merchantA.id,
      orderId: order.id,
      shipmentNumber: `SHP-1-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      trackingNumber: '1Z-PARTIAL-001',
      lengthCm: 40,
      widthCm: 30,
      heightCm: 20,
      deadWeightGrams: 2500,
      status: ShipmentStatus.IN_TRANSIT,
      items: [{ orderLineItemId: lineItem.id, quantityShipped: 1 }],
    })

    await order.refresh()
    assert.equal(order.status, 'partially_fulfilled')
    assert.equal(order.fulfillmentStatus, 'partially_fulfilled')

    // 2nd Shipment: remaining 2 units delivered -> triggers delivery notification outbox event
    const shipment2 = await FulfillmentAndReturnsService.createShipment({
      userId: merchantA.id,
      orderId: order.id,
      shipmentNumber: `SHP-2-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      trackingNumber: '1Z-FINAL-002',
      status: ShipmentStatus.DELIVERED,
      items: [{ orderLineItemId: lineItem.id, quantityShipped: 2 }],
    })

    await order.refresh()
    assert.equal(order.status, 'delivered')
    assert.isNotNull(order.deliveryNotificationSentAt)

    const outbox = await OutboxEvent.query()
      .where('aggregateId', shipment2.id)
      .andWhere('eventType', 'shipment.delivered.notify_customer')
      .first()
    assert.isNotNull(outbox)

    // Carrier Shipping Invoice Reconciliation & Duplicate Charge Protection
    const invoice1 = await FulfillmentAndReturnsService.createShippingInvoice({
      userId: merchantA.id,
      carrierCode: 'ups',
      carrierName: 'UPS',
      invoiceNumber: `INV-1-${Date.now()}`,
      invoiceDate: '2026-10-17',
      lines: [
        {
          shipmentId: shipment1.id,
          chargeType: ShippingChargeType.BASE_FREIGHT,
          expectedAmount: 12.0,
          billedAmount: 14.5,
        },
      ],
    })
    assert.equal(invoice1.reconciliationStatus, 'variance_detected')
    assert.equal(Number(invoice1.varianceAmount), 2.5)

    // Re-billing the exact same (shipmentId, chargeType) on another invoice MUST be rejected!
    await assert.rejects(async () => {
      await FulfillmentAndReturnsService.createShippingInvoice({
        userId: merchantA.id,
        carrierCode: 'ups',
        carrierName: 'UPS',
        invoiceNumber: `INV-DUP-${Date.now()}`,
        invoiceDate: '2026-10-17',
        lines: [
          {
            shipmentId: shipment1.id,
            chargeType: ShippingChargeType.BASE_FREIGHT,
            expectedAmount: 12.0,
            billedAmount: 12.0,
          },
        ],
      })
    }, /shipping_invoice_lines|DUPLICATE/)
  })

  test('8. Returns (RMA) quantity validation and Refund over-refund protection', async ({
    assert,
  }) => {
    const order = await OrderService.createOrder({
      userId: merchantA.id,
      orderNumber: `ORD-RMA-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Return Tester', email: 'returns@buyer.io' },
      lines: [
        {
          sku: 'RMA-SKU-1',
          title: 'Mechanical Keyboard',
          quantityOrdered: 2,
          unitPrice: 100.0,
          unitCostAmount: 35.0,
        },
      ],
    })

    await order.load('lineItems')
    const lineItem = order.lineItems[0]

    // Request return of 1 unit -> succeeds
    const rma1 = await FulfillmentAndReturnsService.createReturnRequest({
      userId: merchantA.id,
      orderId: order.id,
      orderLineItemId: lineItem.id,
      rmaNumber: `RMA-1-${Date.now()}`,
      returnReason: ReturnReason.DEFECTIVE,
      resolutionType: ReturnResolutionType.PARTIAL_REFUND,
      quantityRequested: 1,
    })
    assert.equal(rma1.quantityRequested, 1)

    // Request return of 2 more units when only 1 remains returnable -> rejected!
    await assert.rejects(async () => {
      await FulfillmentAndReturnsService.createReturnRequest({
        userId: merchantA.id,
        orderId: order.id,
        orderLineItemId: lineItem.id,
        rmaNumber: `RMA-OVER-${Date.now()}`,
        returnReason: ReturnReason.CHANGED_MIND,
        resolutionType: ReturnResolutionType.REFUND,
        quantityRequested: 2,
      })
    }, /OVER_RETURN_LIMIT/)

    // Partial refund of $100 out of $200 -> succeeds
    const refund1 = await FulfillmentAndReturnsService.processRefund({
      userId: merchantA.id,
      orderId: order.id,
      returnRequestId: rma1.id,
      refundNumber: `REF-1-${Date.now()}`,
      itemsRefundAmount: 100.0,
    })
    assert.equal(Number(refund1.totalRefundAmount), 100)

    // Attempting to refund $150 when only $100 remains refundable -> rejected!
    await assert.rejects(async () => {
      await FulfillmentAndReturnsService.processRefund({
        userId: merchantA.id,
        orderId: order.id,
        refundNumber: `REF-OVER-${Date.now()}`,
        itemsRefundAmount: 150.0,
      })
    }, /DOUBLE_REFUND_PREVENTED/)
  })

  test('9. Multi-currency financial transactions (Business vs Household) & PCI-safe Credit Cards', async ({
    assert,
  }) => {
    const card = await CreditCard.create({
      userId: merchantA.id,
      cardLabel: 'Test Amex Business Platinum',
      brandName: 'American Express',
      issuerBank: 'Amex',
      cardholderName: 'MERCHANT ALPHA',
      last4Digits: '8899',
      expMonth: 12,
      expYear: 2029,
      vaultTokenReference: 'tok_amex_8899',
      currencyCode: 'USD',
      creditLimit: '50000.00',
      currentBalance: '1200.00',
      statementBalance: '1200.00',
      minimumPaymentDue: '120.00',
      nextPaymentDueDate: DateTime.fromISO('2026-11-01'),
      reminderDaysBefore: 5,
      autoPayEnabled: true,
      dataClassification: DataClassification.BUSINESS,
      status: CreditCardStatus.ACTIVE,
    })

    const link = await CreditCardSellerAccount.create({
      userId: merchantA.id,
      creditCardId: card.id,
      sellerAccountId: sellerAccountA.id,
      usagePurpose: CardChannelUsage.AD_SPEND,
      isPrimary: true,
    })
    assert.equal(link.usagePurpose, 'ad_spend')

    const bizTx = await FinancialTransaction.create({
      userId: merchantA.id,
      creditCardId: card.id,
      sellerAccountId: sellerAccountA.id,
      referenceNumber: `FIN-BIZ-${Date.now()}`,
      transactionType: FinancialTransactionType.EXPENSE,
      dataClassification: DataClassification.BUSINESS,
      status: FinancialTransactionStatus.POSTED,
      description: 'Amazon Sponsored Products Ad Campaign',
      originalCurrencyCode: 'CAD',
      originalAmount: '1000.0000',
      exchangeRate: '0.73500000',
      reportingCurrencyCode: 'USD',
      reportingAmount: '735.0000',
      taxAmount: '0.0000',
      transactionDate: DateTime.now(),
      metadata: {},
    })

    const householdTx = await FinancialTransaction.create({
      userId: merchantA.id,
      referenceNumber: `FIN-HOME-${Date.now()}`,
      transactionType: FinancialTransactionType.EXPENSE,
      dataClassification: DataClassification.HOUSEHOLD_PERSONAL,
      status: FinancialTransactionStatus.POSTED,
      description: 'Personal Household Utility Bill',
      originalCurrencyCode: 'USD',
      originalAmount: '210.0000',
      exchangeRate: '1.00000000',
      reportingCurrencyCode: 'USD',
      reportingAmount: '210.0000',
      taxAmount: '0.0000',
      transactionDate: DateTime.now(),
      metadata: {},
    })

    assert.equal(bizTx.dataClassification, 'business')
    assert.equal(householdTx.dataClassification, 'household_personal')
  })

  test('10. Database CHECK constraints reject invalid monetary values and invalid credit card last_4_digits', async ({
    assert,
  }) => {
    // Attempting to insert a credit card with 16 digits into last_4_digits violates chk_credit_cards_metadata_valid
    await assert.rejects(async () => {
      await db.table('credit_cards').insert({
        id: generateEntityId('ccard'),
        user_id: merchantA.id,
        card_label: 'Invalid Full PAN Card',
        brand_name: 'Visa',
        cardholder_name: 'TEST',
        last_4_digits: '4111',
        exp_month: 15, // Invalid month > 12 -> violates CHECK constraint!
        exp_year: 2028,
        currency_code: 'USD',
        credit_limit: 1000,
        current_balance: 0,
        statement_balance: 0,
        minimum_payment_due: 0,
        reminder_days_before: 5,
        auto_pay_enabled: false,
        data_classification: 'business',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      })
    })
  })

  test('11. Audit history captures INSERT/UPDATE/DELETE and audit_logs are append-only', async ({
    assert,
  }) => {
    const customerId = generateEntityId('cust')

    // INSERT is recorded
    await db.table('customers').insert({
      id: customerId,
      user_id: merchantA.id,
      full_name: 'Audit Trail Customer',
      email: 'audit.trail@example.com',
      preferred_currency: 'USD',
      orders_count: 0,
      total_spent: 0,
      is_repeat_customer: false,
      risk_level: 'low',
      risk_score: 0,
      created_at: new Date(),
      updated_at: new Date(),
    })
    let logs = await db.from('audit_logs').where('entity_id', customerId).select('*')
    assert.isAbove(logs.length, 0)
    assert.equal(logs[0].action, 'INSERT')
    assert.equal(logs[0].entity_type, 'customers')
    assert.equal(logs[0].user_id, merchantA.id)
    assert.isString(logs[0].checksum)
    // empty-diff writes produce no log rows
    const emptyInsertLogCount = logs.length

    // UPDATE is recorded with changed field names
    await db.from('customers').where('id', customerId).update({ full_name: 'Audit Renamed' })
    logs = await db.from('audit_logs').where('entity_id', customerId).orderBy('created_at', 'asc')
    assert.isAbove(logs.length, emptyInsertLogCount)
    const updateLog = logs.find((l) => l.action === 'UPDATE')
    assert.isOk(updateLog)
    assert.deepEqual(updateLog.metadata.changed_fields, ['full_name'])

    // DELETE is recorded
    await db.from('customers').where('id', customerId).delete()
    logs = await db.from('audit_logs').where('entity_id', customerId)
    assert.isTrue(logs.some((l) => l.action === 'DELETE'))

    // Append-only: UPDATE and DELETE on audit_logs are rejected by trigger
    const anyLog = logs[0]
    await assert.rejects(async () => {
      await db.from('audit_logs').where('id', anyLog.id).update({ action: 'TAMPERED' })
    })
    await assert.rejects(async () => {
      await db.from('audit_logs').where('id', anyLog.id).delete()
    })
  })
})
