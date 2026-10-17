import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import RolePermission from '#models/role_permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import SalesChannel from '#models/sales_channel'
import SellerAccount from '#models/seller_account'
import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import CustomerRiskSignal from '#models/customer_risk_signal'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import CreditCardSellerAccount from '#models/credit_card_seller_account'
import FinanceCategory from '#models/finance_category'
import FinancialTransaction from '#models/financial_transaction'
import TasksReminder from '#models/tasks_reminder'
import SavedView from '#models/saved_view'
import MarketplaceClaim from '#models/marketplace_claim'
import { CatalogService } from '../../app/services/catalog_service.js'
import { OrderService } from '../../app/services/order_service.js'
import { FulfillmentAndReturnsService } from '../../app/services/fulfillment_and_returns_service.js'
import { RbacService } from '../../app/services/rbac_service.js'
import {
  UserStatus,
  PermissionEffect,
  ChannelType,
  SellerAccountStatus,
  HealthStatus,
  ModuleKeys,
  FinancialAccountType,
  DataClassification,
  CreditCardStatus,
  CardChannelUsage,
  FinanceCategoryType,
  FinanceCostBucket,
  FinancialTransactionType,
  FinancialTransactionStatus,
  TaskType,
  TaskPriority,
  TaskStatus,
  ShipmentStatus,
  ShippingChargeType,
  ReturnReason,
  ClaimType,
  ClaimStatus,
  RiskSignalType,
  RiskSeverity,
  RiskReviewStatus,
} from '../../app/enums/index.js'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // Idempotency guard: skip if super admin already exists
    const existingAdmin = await User.findBy('email', 'admin@sellercore.io')
    if (existingAdmin) {
      return
    }

    // 1. Seed Granular Permissions
    const resources = [
      'orders',
      'customers',
      'catalog',
      'integrations',
      'shipments',
      'returns',
      'finance',
      'household_finance',
      'credit_cards',
      'analytics',
      'users_rbac',
    ]
    const actions = ['read', 'create', 'update', 'delete', 'export']

    const permissionMap = new Map<string, Permission>()
    for (const resource of resources) {
      const wildcardPerm = await Permission.create({
        slug: resource,
        resource,
        action: '*',
        description: `Full access to ${resource} module`,
      })
      permissionMap.set(wildcardPerm.slug, wildcardPerm)

      for (const action of actions) {
        const slug = `${resource}.${action}`
        const perm = await Permission.create({
          slug,
          resource,
          action,
          description: `Can ${action} records in ${resource}`,
        })
        permissionMap.set(slug, perm)
      }
    }

    // 2. Seed Roles & Role Permissions (including explicit DENY override precedence)
    const superAdminRole = await Role.create({
      slug: 'super_admin',
      name: 'System Super Administrator',
      description: 'Full platform control including user provisioning, RBAC, and all modules',
      isSystem: true,
    })

    const opsManagerRole = await Role.create({
      slug: 'operations_manager',
      name: 'E-Commerce Operations Manager',
      description: 'Manages orders, catalog, marketplace accounts, shipments, and returns',
      isSystem: true,
    })

    const financeManagerRole = await Role.create({
      slug: 'finance_manager',
      name: 'Finance & Profitability Controller',
      description: 'Manages business income, expenses, credit cards, invoices, and P&L reporting',
      isSystem: true,
    })

    const restrictedAuditorRole = await Role.create({
      slug: 'restricted_auditor',
      name: 'Restricted Compliance Auditor',
      description: 'Read-only access with explicit DENY on destructive delete actions',
      isSystem: true,
    })

    for (const perm of permissionMap.values()) {
      await RolePermission.create({
        roleId: superAdminRole.id,
        permissionId: perm.id,
        effect: PermissionEffect.ALLOW,
      })

      if (
        ['orders', 'customers', 'catalog', 'integrations', 'shipments', 'returns'].includes(
          perm.resource
        )
      ) {
        await RolePermission.create({
          roleId: opsManagerRole.id,
          permissionId: perm.id,
          effect: PermissionEffect.ALLOW,
        })
      }

      if (
        ['finance', 'credit_cards', 'analytics', 'orders'].includes(perm.resource) &&
        perm.action !== 'delete'
      ) {
        await RolePermission.create({
          roleId: financeManagerRole.id,
          permissionId: perm.id,
          effect: PermissionEffect.ALLOW,
        })
      }

      if (perm.action === 'read' || perm.action === 'export') {
        await RolePermission.create({
          roleId: restrictedAuditorRole.id,
          permissionId: perm.id,
          effect: PermissionEffect.ALLOW,
        })
      } else if (perm.action === 'delete') {
        await RolePermission.create({
          roleId: restrictedAuditorRole.id,
          permissionId: perm.id,
          effect: PermissionEffect.DENY,
        })
      }
    }

    // 3. Seed Primary Super Admin User & Secondary Merchant User
    const adminUser = await User.create({
      email: 'admin@sellercore.io',
      fullName: 'Aarav Mehta (Super Admin)',
      phone: '+1-415-890-4410',
      password: 'Password123!',
      status: UserStatus.ACTIVE,
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
      preferences: { dashboardLayout: 'astryx-dense' },
    })

    await UserRole.create({
      userId: adminUser.id,
      roleId: superAdminRole.id,
      assignedByUserId: adminUser.id,
    })
    await UserRole.create({
      userId: adminUser.id,
      roleId: opsManagerRole.id,
      assignedByUserId: adminUser.id,
    })

    for (const moduleKey of ModuleKeys) {
      await ModuleEntitlement.create({
        userId: adminUser.id,
        moduleKey,
        isEnabled: true,
        planTier: 'enterprise',
        limits: { maxOrdersPerMonth: 100000, maxSellerAccounts: 25 },
        updatedByUserId: adminUser.id,
      })
    }

    // Secondary user provisioned by Super Admin to demonstrate multi-user isolation
    const secondUser = await RbacService.createUserBySuperAdmin(adminUser, {
      email: 'ops@sellercore.io',
      fullName: 'Elena Rostova (Operations Lead)',
      password: 'Password123!',
      phone: '+1-650-443-9921',
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
      isSuperAdmin: false,
      roleSlugs: ['operations_manager', 'finance_manager'],
      enabledModules: [
        'orders',
        'customers',
        'catalog',
        'integrations',
        'shipments',
        'returns',
        'finance',
        'credit_cards',
        'analytics',
        'tasks',
      ],
    })

    // 4. Seed Sales Channels
    const amazonChannel = await SalesChannel.create({
      code: 'amazon',
      name: 'Amazon Seller Central (SP-API)',
      channelType: ChannelType.MARKETPLACE,
      supportsOauth: true,
      defaultConfig: { referralFeePct: 15 },
      isActive: true,
    })

    const ebayChannel = await SalesChannel.create({
      code: 'ebay',
      name: 'eBay Global Commerce',
      channelType: ChannelType.MARKETPLACE,
      supportsOauth: true,
      defaultConfig: { finalValueFeePct: 12.9 },
      isActive: true,
    })

    const etsyChannel = await SalesChannel.create({
      code: 'etsy',
      name: 'Etsy Marketplace v3',
      channelType: ChannelType.MARKETPLACE,
      supportsOauth: true,
      defaultConfig: { transactionFeePct: 6.5 },
      isActive: true,
    })

    const websiteChannel = await SalesChannel.create({
      code: 'website',
      name: 'Direct Brand Storefront (DTC)',
      channelType: ChannelType.WEBSTORE,
      supportsOauth: false,
      defaultConfig: { gatewayFeePct: 2.9 },
      isActive: true,
    })

    await SalesChannel.create({
      code: 'google_shopping',
      name: 'Google Merchant Center Feed',
      channelType: ChannelType.SHOPPING_FEED,
      supportsOauth: true,
      defaultConfig: {},
      isActive: true,
    })

    // 5. Seed Seller Accounts across Regions & Currencies (USD, CAD, MXN, INR)
    const amzUs = new SellerAccount()
    amzUs.userId = adminUser.id
    amzUs.salesChannelId = amazonChannel.id
    amzUs.accountName = 'Astryx Gear - Amazon US'
    amzUs.externalSellerId = 'A29KLM8810US'
    amzUs.marketplaceRegion = 'US'
    amzUs.defaultCurrency = 'USD'
    amzUs.status = SellerAccountStatus.ACTIVE
    amzUs.healthStatus = HealthStatus.HEALTHY
    amzUs.setPlainCredentials({
      lwaClientId: 'amzn1.application-oa2-client.8912a',
      refreshToken: 'Atzr|IwEBIF92x...encrypted',
    })
    amzUs.oauthScopes = 'sellingpartnerapi::orders sellingpartnerapi::listings'
    amzUs.tokenExpiresAt = DateTime.now().plus({ days: 30 })
    amzUs.lastCredentialRotatedAt = DateTime.now().minus({ days: 5 })
    amzUs.rateLimitRpm = 120
    amzUs.lastSyncedAt = DateTime.now().minus({ minutes: 12 })
    await amzUs.save()

    const amzIn = new SellerAccount()
    amzIn.userId = adminUser.id
    amzIn.salesChannelId = amazonChannel.id
    amzIn.accountName = 'Astryx Commerce - Amazon India'
    amzIn.externalSellerId = 'A91MUMBAI77IN'
    amzIn.marketplaceRegion = 'IN'
    amzIn.defaultCurrency = 'INR'
    amzIn.status = SellerAccountStatus.ACTIVE
    amzIn.healthStatus = HealthStatus.HEALTHY
    amzIn.setPlainCredentials({
      lwaClientId: 'amzn1.application-oa2-client.in77',
      refreshToken: 'Atzr|IwEBI_IN_encrypted',
    })
    amzIn.rateLimitRpm = 90
    amzIn.lastSyncedAt = DateTime.now().minus({ minutes: 28 })
    await amzIn.save()

    const ebayNa = new SellerAccount()
    ebayNa.userId = adminUser.id
    ebayNa.salesChannelId = ebayChannel.id
    ebayNa.accountName = 'Astryx Outlet - eBay North America'
    ebayNa.externalSellerId = 'EBAY-ASTRYX-CA'
    ebayNa.marketplaceRegion = 'CA'
    ebayNa.defaultCurrency = 'CAD'
    ebayNa.status = SellerAccountStatus.ACTIVE
    ebayNa.healthStatus = HealthStatus.HEALTHY
    ebayNa.setPlainCredentials({
      ebayOAuthToken: 'v^1.1#i^1#p^3...encrypted',
    })
    ebayNa.rateLimitRpm = 100
    ebayNa.lastSyncedAt = DateTime.now().minus({ minutes: 45 })
    await ebayNa.save()

    const etsyMx = new SellerAccount()
    etsyMx.userId = adminUser.id
    etsyMx.salesChannelId = etsyChannel.id
    etsyMx.accountName = 'Astryx Studio - Etsy LATAM/MX'
    etsyMx.externalSellerId = 'ETSY-MX-4029'
    etsyMx.marketplaceRegion = 'MX'
    etsyMx.defaultCurrency = 'MXN'
    etsyMx.status = SellerAccountStatus.ACTIVE
    etsyMx.healthStatus = HealthStatus.WARNING
    etsyMx.setPlainCredentials({
      etsyKeystring: 'etsy_oauth_encrypted',
    })
    etsyMx.rateLimitRpm = 60
    etsyMx.lastSyncedAt = DateTime.now().minus({ hours: 2 })
    await etsyMx.save()

    const dtcWeb = new SellerAccount()
    dtcWeb.userId = adminUser.id
    dtcWeb.salesChannelId = websiteChannel.id
    dtcWeb.accountName = 'Astryx Official Storefront'
    dtcWeb.externalSellerId = 'WEB-ASTRYX-GLOBAL'
    dtcWeb.marketplaceRegion = 'US'
    dtcWeb.defaultCurrency = 'USD'
    dtcWeb.status = SellerAccountStatus.ACTIVE
    dtcWeb.healthStatus = HealthStatus.HEALTHY
    dtcWeb.setPlainCredentials({ webhookSecret: 'whsec_encrypted_9921' })
    dtcWeb.rateLimitRpm = 300
    dtcWeb.lastSyncedAt = DateTime.now().minus({ minutes: 4 })
    await dtcWeb.save()

    // 6. Seed Brands, Categories, Standalone Product & Multi-Variation Product
    const brandAstryx = await Brand.create({
      userId: adminUser.id,
      name: 'Astryx Hardware Labs',
      slug: 'astryx-hardware-labs',
      websiteUrl: 'https://astryx.example.com',
      isActive: true,
    })

    const catAudio = await ProductCategory.create({
      userId: adminUser.id,
      name: 'Spatial Audio & Wearables',
      slug: 'spatial-audio-wearables',
      taxonomyPath: 'Electronics > Audio & Video > Spatial Wearables',
      attributesSchema: ['color', 'size', 'storage'],
    })

    // Standalone Product (hasVariants = false)
    const standaloneDock = await CatalogService.createProduct({
      userId: adminUser.id,
      brandId: brandAstryx.id,
      categoryId: catAudio.id,
      title: 'Astryx Magnetic Charging Dock Pro',
      skuPrefix: 'AST-DOCK',
      description: 'Standalone 45W fast magnetic charging dock with anodized aluminum base.',
      hasVariants: false,
      weightGrams: 420,
      variants: [
        {
          sku: 'AST-DOCK-PRO-01',
          title: 'Astryx Magnetic Charging Dock Pro',
          barcodeUpcEan: '840192837101',
          mpn: 'MPN-DOCK-01',
          asin: 'B09ASTRYX1',
          currencyCode: 'USD',
          retailPrice: 89.0,
          costPrice: 24.5,
          manufacturingCost: 6.0,
          packagingCost: 2.5,
          stockOnHand: 185,
          reorderPoint: 25,
          listings: [
            {
              sellerAccountId: amzUs.id,
              externalListingId: 'AMZ-LIST-B09ASTRYX1',
              asin: 'B09ASTRYX1',
              channelTitle: 'Astryx Magnetic Fast Charging Dock Pro - Official',
              listedPrice: 89.0,
              allocatedQuantity: 120,
            },
            {
              sellerAccountId: dtcWeb.id,
              externalListingId: 'WEB-DOCK-PRO-01',
              channelTitle: 'Magnetic Charging Dock Pro',
              listedPrice: 85.0,
              allocatedQuantity: 65,
            },
          ],
        },
      ],
    })

    // Multi-Variation Product (hasVariants = true, dimensions: color, size)
    const multiVariantHeadset = await CatalogService.createProduct({
      userId: adminUser.id,
      brandId: brandAstryx.id,
      categoryId: catAudio.id,
      title: 'Astryx Horizon Spatial Headset X1',
      skuPrefix: 'AST-HX1',
      description: 'Flagship wireless spatial headset with adaptive acoustic cancellation.',
      hasVariants: true,
      variationDimensions: ['color', 'size'],
      weightGrams: 680,
      variants: [
        {
          sku: 'AST-HX1-OBSIDIAN-STD',
          title: 'Astryx Horizon X1 - Obsidian Black / Standard',
          barcodeUpcEan: '840192837201',
          mpn: 'MPN-HX1-BLK-S',
          asin: 'B09ASTRYX2',
          currencyCode: 'USD',
          retailPrice: 349.0,
          costPrice: 118.0,
          manufacturingCost: 22.0,
          packagingCost: 5.5,
          stockOnHand: 92,
          reorderPoint: 15,
          attributes: { color: 'Obsidian Black', size: 'Standard' },
          listings: [
            {
              sellerAccountId: amzUs.id,
              externalListingId: 'AMZ-LIST-B09ASTRYX2',
              asin: 'B09ASTRYX2',
              channelTitle: 'Astryx Horizon X1 Spatial Headset (Obsidian Black)',
              listedPrice: 349.0,
              allocatedQuantity: 70,
            },
          ],
        },
        {
          sku: 'AST-HX1-LUNAR-LRG',
          title: 'Astryx Horizon X1 - Lunar Silver / Large',
          barcodeUpcEan: '840192837202',
          mpn: 'MPN-HX1-SLV-L',
          asin: 'B09ASTRYX3',
          currencyCode: 'USD',
          retailPrice: 369.0,
          costPrice: 124.0,
          manufacturingCost: 24.0,
          packagingCost: 5.5,
          stockOnHand: 64,
          reorderPoint: 15,
          attributes: { color: 'Lunar Silver', size: 'Large' },
          listings: [
            {
              sellerAccountId: ebayNa.id,
              externalListingId: 'EBAY-ITEM-33920184',
              asin: 'B09ASTRYX3',
              channelTitle: 'Astryx Horizon X1 Spatial Headset - Lunar Silver Large',
              listedPrice: 489.0,
              allocatedQuantity: 40,
            },
          ],
        },
      ],
    })

    await standaloneDock.load('variants')
    await multiVariantHeadset.load('variants')
    const dockVariant = standaloneDock.variants[0]
    const headsetBlackVariant = multiVariantHeadset.variants[0]
    const headsetSilverVariant = multiVariantHeadset.variants[1]

    // 7. Seed Orders across USD, CAD, INR, MXN + Shipments + Invoices + Returns
    const order1 = await OrderService.createOrder({
      userId: adminUser.id,
      actorUserId: adminUser.id,
      sellerAccountId: amzUs.id,
      orderNumber: 'ORD-AMZ-2026-1001',
      externalOrderId: '114-8920411-7721042',
      sourceType: 'marketplace_import',
      marketplaceCode: 'amazon',
      status: 'confirmed',
      paymentStatus: 'paid',
      currencyCode: 'USD',
      reportingCurrencyCode: 'USD',
      exchangeRate: 1.0,
      shippingCostAmount: 14.5,
      customer: {
        externalCustomerId: 'AMZ-CUST-9910',
        fullName: 'Marcus Vance',
        email: 'marcus.vance@example.com',
        proxyEmail: 'm.vance.proxy@marketplace.amazon.com',
        phone: '+1-206-555-0192',
      },
      shippingAddress: {
        recipientName: 'Marcus Vance',
        line1: '742 Evergreen Terrace',
        city: 'Seattle',
        stateProvince: 'WA',
        postalCode: '98101',
        countryCode: 'US',
        phone: '+1-206-555-0192',
      },
      lines: [
        {
          productVariantId: headsetBlackVariant.id,
          externalOrderLineId: 'AMZ-LINE-01',
          sku: headsetBlackVariant.sku,
          title: headsetBlackVariant.title,
          quantityOrdered: 2,
          unitPrice: 349.0,
          taxAmount: 62.82,
          shippingAmount: 0,
        },
        {
          productVariantId: dockVariant.id,
          externalOrderLineId: 'AMZ-LINE-02',
          sku: dockVariant.sku,
          title: dockVariant.title,
          quantityOrdered: 1,
          unitPrice: 89.0,
          taxAmount: 8.01,
          shippingAmount: 0,
        },
      ],
      rawPayload: {
        AmazonOrderId: '114-8920411-7721042',
        PurchaseDate: '2026-10-15T14:22:00Z',
        FulfillmentChannel: 'MFN',
      },
    })

    // Repeat purchase by same customer (demonstrates repeat-customer detection!)
    const order2 = await OrderService.createOrder({
      userId: adminUser.id,
      actorUserId: adminUser.id,
      sellerAccountId: dtcWeb.id,
      orderNumber: 'ORD-WEB-2026-1002',
      externalOrderId: 'WEB-CHK-55102',
      sourceType: 'webstore',
      marketplaceCode: 'website',
      status: 'processing',
      paymentStatus: 'paid',
      currencyCode: 'USD',
      reportingCurrencyCode: 'USD',
      exchangeRate: 1.0,
      shippingCostAmount: 9.25,
      customer: {
        fullName: 'Marcus Vance',
        email: 'marcus.vance@example.com',
        phone: '+1-206-555-0192',
      },
      shippingAddress: {
        recipientName: 'Marcus Vance',
        line1: '742 Evergreen Terrace',
        city: 'Seattle',
        stateProvince: 'WA',
        postalCode: '98101',
        countryCode: 'US',
      },
      lines: [
        {
          productVariantId: dockVariant.id,
          sku: dockVariant.sku,
          title: dockVariant.title,
          quantityOrdered: 2,
          unitPrice: 85.0,
          discountAmount: 10.0,
          taxAmount: 14.4,
          shippingAmount: 12.0,
        },
      ],
    })

    // International Order in CAD (eBay Canada)
    const order3 = await OrderService.createOrder({
      userId: adminUser.id,
      actorUserId: adminUser.id,
      sellerAccountId: ebayNa.id,
      orderNumber: 'ORD-EBY-2026-1003',
      externalOrderId: '24-11920-88412',
      sourceType: 'marketplace_import',
      marketplaceCode: 'ebay',
      status: 'confirmed',
      paymentStatus: 'paid',
      currencyCode: 'CAD',
      reportingCurrencyCode: 'USD',
      exchangeRate: 0.73529412,
      shippingCostAmount: 22.0,
      customer: {
        externalCustomerId: 'EBAY-CA-4410',
        fullName: 'Sophie Tremblay',
        email: 'sophie.tremblay@example.ca',
        phone: '+1-514-555-0148',
      },
      shippingAddress: {
        recipientName: 'Sophie Tremblay',
        line1: '1250 Rene-Levesque Blvd W',
        city: 'Montreal',
        stateProvince: 'QC',
        postalCode: 'H3B 4W8',
        countryCode: 'CA',
      },
      lines: [
        {
          productVariantId: headsetSilverVariant.id,
          externalOrderLineId: 'EBAY-LINE-991',
          sku: headsetSilverVariant.sku,
          title: headsetSilverVariant.title,
          quantityOrdered: 1,
          unitPrice: 489.0,
          taxAmount: 63.57,
          shippingAmount: 25.0,
        },
      ],
    })

    // International Order in INR (Amazon India)
    await OrderService.createOrder({
      userId: adminUser.id,
      actorUserId: adminUser.id,
      sellerAccountId: amzIn.id,
      orderNumber: 'ORD-IN-2026-1004',
      externalOrderId: '404-9918271-6629104',
      sourceType: 'marketplace_import',
      marketplaceCode: 'amazon',
      status: 'confirmed',
      paymentStatus: 'paid',
      currencyCode: 'INR',
      reportingCurrencyCode: 'USD',
      exchangeRate: 0.01190476,
      shippingCostAmount: 450.0,
      customer: {
        externalCustomerId: 'AMZ-IN-8821',
        fullName: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@example.in',
        phone: '+91-98201-55102',
      },
      shippingAddress: {
        recipientName: 'Rohan Deshmukh',
        line1: 'Plot 42, Bandra Kurla Complex',
        city: 'Mumbai',
        stateProvince: 'MH',
        postalCode: '400051',
        countryCode: 'IN',
      },
      lines: [
        {
          productVariantId: dockVariant.id,
          externalOrderLineId: 'AMZ-IN-L1',
          sku: dockVariant.sku,
          title: dockVariant.title,
          quantityOrdered: 3,
          unitPrice: 7499.0,
          unitCostAmount: 2650.0,
          taxAmount: 4049.46,
          shippingAmount: 0,
        },
      ],
    })

    // Seed Customer Risk Signal (explainable manual review workflow)
    await CustomerRiskSignal.create({
      userId: adminUser.id,
      customerId: order3.customerId,
      orderId: order3.id,
      signalType: RiskSignalType.PROXY_EMAIL_CHANGE,
      severity: RiskSeverity.MEDIUM,
      reviewStatus: RiskReviewStatus.PENDING_REVIEW,
      reason:
        'Buyer relay email changed across two high-value electronics orders within 48 hours; requires manual verification before express dispatch.',
      evidence: {
        previousEmail: 'anon-buyer-11@relay.ebay.ca',
        currentEmail: 'sophie.tremblay@example.ca',
        orderValueCad: 577.57,
      },
    })

    // 8. Seed Shipments, Partial Fulfillment & Carrier Invoices
    await order1.load('lineItems')
    const order1Lines = order1.lineItems

    const shipment1 = await FulfillmentAndReturnsService.createShipment({
      userId: adminUser.id,
      orderId: order1.id,
      shipmentNumber: 'SHP-2026-5001',
      carrierCode: 'ups',
      carrierName: 'UPS Ground Commercial',
      serviceLevel: 'UPS Ground',
      trackingNumber: '1Z999AA10123456784',
      packagingType: 'corrugated_box_m',
      lengthCm: 36,
      widthCm: 28,
      heightCm: 18,
      deadWeightGrams: 1850,
      estimatedShippingCost: 14.5,
      status: ShipmentStatus.DELIVERED,
      items: order1Lines.map((l) => ({
        orderLineItemId: l.id,
        quantityShipped: l.quantityOrdered,
        serialNumbers: [`SN-${l.sku}-001`],
      })),
    })

    // Financial Accounts (Business & Household/Personal)
    const businessBank = await FinancialAccount.create({
      userId: adminUser.id,
      accountName: 'Mercury Business Operating Checking',
      accountType: FinancialAccountType.BANK_CHECKING,
      institutionName: 'Mercury / Choice Financial',
      accountNumberLast4: '8841',
      currencyCode: 'USD',
      currentBalance: '148250.00',
      dataClassification: DataClassification.BUSINESS,
      isActive: true,
    })

    const householdBank = await FinancialAccount.create({
      userId: adminUser.id,
      accountName: 'Personal Family Reserve Checking',
      accountType: FinancialAccountType.BANK_CHECKING,
      institutionName: 'Chase Private Client',
      accountNumberLast4: '2109',
      currencyCode: 'USD',
      currentBalance: '34900.00',
      dataClassification: DataClassification.HOUSEHOLD_PERSONAL,
      isActive: true,
    })

    // Carrier Shipping Invoice with variance detection
    await FulfillmentAndReturnsService.createShippingInvoice({
      userId: adminUser.id,
      financialAccountId: businessBank.id,
      carrierCode: 'ups',
      carrierName: 'UPS Supply Chain Billing',
      invoiceNumber: 'UPS-INV-2026-1091',
      currencyCode: 'USD',
      taxAmount: 1.2,
      invoiceDate: '2026-10-16',
      dueDate: '2026-10-30',
      lines: [
        {
          shipmentId: shipment1.id,
          trackingNumber: shipment1.trackingNumber,
          chargeType: ShippingChargeType.BASE_FREIGHT,
          description: 'UPS Ground Commercial Zone 4',
          expectedAmount: 12.5,
          billedAmount: 13.75,
        },
        {
          shipmentId: shipment1.id,
          trackingNumber: shipment1.trackingNumber,
          chargeType: ShippingChargeType.FUEL_SURCHARGE,
          description: 'Fuel Surcharge 11.5%',
          expectedAmount: 2.0,
          billedAmount: 2.45,
        },
      ],
    })

    // 9. Seed Return Request & Partial Refund + Marketplace Claim
    const returnReq = await FulfillmentAndReturnsService.createReturnRequest({
      userId: adminUser.id,
      orderId: order1.id,
      orderLineItemId: order1Lines[0].id,
      rmaNumber: 'RMA-2026-001',
      returnReason: ReturnReason.CHANGED_MIND,
      resolutionType: 'partial_refund',
      quantityRequested: 1,
      restockingFeeAmount: 25.0,
      returnShippingCost: 8.5,
      customerComments: 'Ordered 2 headsets by mistake; returning 1 unopened unit.',
    })

    await FulfillmentAndReturnsService.processRefund({
      userId: adminUser.id,
      actorUserId: adminUser.id,
      orderId: order1.id,
      orderLineItemId: order1Lines[0].id,
      returnRequestId: returnReq.id,
      financialAccountId: businessBank.id,
      refundNumber: 'REF-2026-001',
      itemsRefundAmount: 349.0,
      shippingRefundAmount: 0,
      taxRefundAmount: 31.41,
      restockingFeeDeducted: 25.0,
      reason: 'Customer returned 1 unit; 25 USD restocking fee applied per policy.',
    })

    await MarketplaceClaim.create({
      userId: adminUser.id,
      orderId: order2.id,
      sellerAccountId: dtcWeb.id,
      customerId: order2.customerId,
      claimNumber: 'CLM-2026-041',
      externalClaimId: 'DP-8819201',
      claimType: ClaimType.ITEM_NOT_RECEIVED,
      status: ClaimStatus.UNDER_REVIEW,
      currencyCode: 'USD',
      disputedAmount: '186.40',
      sellerLiabilityAmount: '0.00',
      reason: 'Carrier scan delayed at regional hub; proof of dispatch uploaded.',
      evidenceSubmitted: { carrierReceipt: 'UPS-SCAN-9912', signedProof: false },
      respondByAt: DateTime.now().plus({ days: 5 }),
    })

    // 10. Seed Credit Cards & Channel Links (Never storing full PAN or CVV)
    const amexPlt = await CreditCard.create({
      userId: adminUser.id,
      financialAccountId: businessBank.id,
      cardLabel: 'Amex Business Platinum - Ad Spend & Inventory',
      brandName: 'American Express',
      issuerBank: 'American Express US',
      cardholderName: 'AARAV MEHTA',
      last4Digits: '1008',
      expMonth: 9,
      expYear: 2029,
      vaultTokenReference: 'tok_vault_amex_biz_1008',
      currencyCode: 'USD',
      creditLimit: '75000.00',
      currentBalance: '14280.50',
      statementBalance: '11400.00',
      minimumPaymentDue: '1140.00',
      billingCycleDay: 22,
      paymentDueDay: 25,
      nextPaymentDueDate: DateTime.now().plus({ days: 8 }),
      reminderDaysBefore: 5,
      autoPayEnabled: true,
      dataClassification: DataClassification.BUSINESS,
      status: CreditCardStatus.ACTIVE,
    })

    const chaseInk = await CreditCard.create({
      userId: adminUser.id,
      financialAccountId: businessBank.id,
      cardLabel: 'Chase Ink Business Preferred - Carrier & SaaS',
      brandName: 'Visa',
      issuerBank: 'JPMorgan Chase',
      cardholderName: 'AARAV MEHTA',
      last4Digits: '4492',
      expMonth: 11,
      expYear: 2028,
      vaultTokenReference: 'tok_vault_visa_ink_4492',
      currencyCode: 'USD',
      creditLimit: '50000.00',
      currentBalance: '6840.00',
      statementBalance: '6840.00',
      minimumPaymentDue: '684.00',
      billingCycleDay: 1,
      paymentDueDay: 21,
      nextPaymentDueDate: DateTime.now().plus({ days: 4 }),
      reminderDaysBefore: 5,
      autoPayEnabled: false,
      dataClassification: DataClassification.BUSINESS,
      status: CreditCardStatus.ACTIVE,
    })

    await CreditCardSellerAccount.create({
      userId: adminUser.id,
      creditCardId: amexPlt.id,
      sellerAccountId: amzUs.id,
      usagePurpose: CardChannelUsage.AD_SPEND,
      isPrimary: true,
    })

    await CreditCardSellerAccount.create({
      userId: adminUser.id,
      creditCardId: chaseInk.id,
      sellerAccountId: ebayNa.id,
      usagePurpose: CardChannelUsage.PRIMARY_BILLING,
      isPrimary: true,
    })

    // 11. Seed Finance Categories & Multi-Currency Financial Transactions (Business & Household)
    const catSettlement = await FinanceCategory.create({
      userId: adminUser.id,
      name: 'Marketplace Settlement Payouts',
      slug: 'marketplace-settlement-payouts',
      categoryType: FinanceCategoryType.INCOME,
      dataClassification: DataClassification.BUSINESS,
      costBucket: FinanceCostBucket.SALES_REVENUE,
      isTaxDeductible: false,
      isActive: true,
    })

    const catAdSpend = await FinanceCategory.create({
      userId: adminUser.id,
      name: 'Amazon Sponsored Products & PPC',
      slug: 'amazon-sponsored-products-ppc',
      categoryType: FinanceCategoryType.EXPENSE,
      dataClassification: DataClassification.BUSINESS,
      costBucket: FinanceCostBucket.MARKETING,
      isTaxDeductible: true,
      isActive: true,
    })

    const catHousehold = await FinanceCategory.create({
      userId: adminUser.id,
      name: 'Household Utilities & Home Office',
      slug: 'household-utilities-home-office',
      categoryType: FinanceCategoryType.EXPENSE,
      dataClassification: DataClassification.HOUSEHOLD_PERSONAL,
      costBucket: FinanceCostBucket.PERSONAL,
      isTaxDeductible: false,
      isActive: true,
    })

    await FinancialTransaction.create({
      userId: adminUser.id,
      financialAccountId: businessBank.id,
      financeCategoryId: catSettlement.id,
      sellerAccountId: amzUs.id,
      referenceNumber: 'TX-SET-2026-901',
      transactionType: FinancialTransactionType.MARKETPLACE_SETTLEMENT,
      dataClassification: DataClassification.BUSINESS,
      status: FinancialTransactionStatus.RECONCILED,
      description: 'Amazon North America Bi-Weekly Settlement Transfer',
      vendorOrPayer: 'Amazon Services LLC',
      originalCurrencyCode: 'USD',
      originalAmount: '18420.00',
      exchangeRate: '1.00000000',
      reportingCurrencyCode: 'USD',
      reportingAmount: '18420.00',
      taxAmount: '0.00',
      transactionDate: DateTime.now().minus({ days: 2 }),
      settledAt: DateTime.now().minus({ days: 2 }),
      reconciledAt: DateTime.now().minus({ days: 1 }),
    })

    await FinancialTransaction.create({
      userId: adminUser.id,
      financialAccountId: businessBank.id,
      creditCardId: amexPlt.id,
      financeCategoryId: catAdSpend.id,
      sellerAccountId: amzUs.id,
      referenceNumber: 'TX-EXP-2026-902',
      transactionType: FinancialTransactionType.EXPENSE,
      dataClassification: DataClassification.BUSINESS,
      status: FinancialTransactionStatus.POSTED,
      description: 'Amazon Advertising PPC Campaign - Horizon X1 Launch',
      vendorOrPayer: 'Amazon Advertising LLC',
      originalCurrencyCode: 'USD',
      originalAmount: '1450.00',
      exchangeRate: '1.00000000',
      reportingCurrencyCode: 'USD',
      reportingAmount: '1450.00',
      taxAmount: '0.00',
      transactionDate: DateTime.now().minus({ days: 1 }),
    })

    await FinancialTransaction.create({
      userId: adminUser.id,
      financialAccountId: householdBank.id,
      financeCategoryId: catHousehold.id,
      referenceNumber: 'TX-HHD-2026-903',
      transactionType: FinancialTransactionType.EXPENSE,
      dataClassification: DataClassification.HOUSEHOLD_PERSONAL,
      status: FinancialTransactionStatus.POSTED,
      description: 'Home Fiber Internet & Household Electricity Bill',
      vendorOrPayer: 'Pacific Gas & Fiber',
      originalCurrencyCode: 'USD',
      originalAmount: '310.00',
      exchangeRate: '1.00000000',
      reportingCurrencyCode: 'USD',
      reportingAmount: '310.00',
      taxAmount: '18.50',
      transactionDate: DateTime.now(),
    })

    // 12. Seed Tasks/Reminders & Saved Views
    await TasksReminder.create({
      userId: adminUser.id,
      creditCardId: chaseInk.id,
      relatedEntityType: 'credit_cards',
      relatedEntityId: chaseInk.id,
      title: 'Pay Chase Ink Business Preferred Statement ($6,840.00)',
      description: 'Auto-pay is disabled on Chase Ink •••• 4492. Statement due in 4 days.',
      taskType: TaskType.CREDIT_CARD_DUE,
      priority: TaskPriority.URGENT,
      status: TaskStatus.PENDING,
      dueAt: DateTime.now().plus({ days: 4 }),
      remindAt: DateTime.now().plus({ days: 1 }),
    })

    await TasksReminder.create({
      userId: adminUser.id,
      relatedEntityType: 'customer_risk_signals',
      title: 'Review Medium-Risk eBay Order ORD-EBY-2026-1003',
      description: 'Verify buyer proxy email change before international shipment to Montreal.',
      taskType: TaskType.FRAUD_REVIEW,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      dueAt: DateTime.now().plus({ days: 1 }),
    })

    await SavedView.create({
      userId: adminUser.id,
      moduleKey: 'orders',
      name: 'High-Value Unfulfilled Orders',
      filters: { fulfillmentStatus: 'unfulfilled', minTotal: 200 },
      sortConfig: { field: 'orderedAt', direction: 'desc' },
      columnsConfig: ['orderNumber', 'marketplaceCode', 'totalAmount', 'netProfitAmount', 'status'],
      isDefault: true,
    })

    // Seed isolated data for secondary user to verify multi-user isolation
    await CatalogService.createProduct({
      userId: secondUser.id,
      title: 'Elena Exclusive Ceramic Mug',
      hasVariants: false,
      variants: [
        {
          sku: 'ELENA-MUG-01',
          retailPrice: 32.0,
          costPrice: 8.0,
          stockOnHand: 50,
        },
      ],
    })
  }
}
