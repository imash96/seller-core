/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'store.product_categories': {
    methods: ["GET","HEAD"]
    pattern: '/store/product-categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['medusaCategoriesEndpoint']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['medusaCategoriesEndpoint']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['medusaCategoriesEndpoint']>>>
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
    }
  }
  'organizations.index': {
    methods: ["GET","HEAD"]
    pattern: '/organizations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['index']>>>
    }
  }
  'organizations.store': {
    methods: ["POST"]
    pattern: '/organizations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['store']>>>
    }
  }
  'organizations.members.store': {
    methods: ["POST"]
    pattern: '/organizations/:id/members'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['upsertMember']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['upsertMember']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['upsertMember']>>>
    }
  }
  'organizations.members.delete': {
    methods: ["POST"]
    pattern: '/organizations/:id/members/:membershipId/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; membershipId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['removeMember']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['removeMember']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/organizations_controller').default['removeMember']>>>
    }
  }
  'pages.orders': {
    methods: ["GET","HEAD"]
    pattern: '/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
    }
  }
  'pages.customers': {
    methods: ["GET","HEAD"]
    pattern: '/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>>
    }
  }
  'pages.catalogs': {
    methods: ["GET","HEAD"]
    pattern: '/catalogs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['catalogsPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['catalogsPage']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['catalogsPage']>>>
    }
  }
  'pages.products': {
    methods: ["GET","HEAD"]
    pattern: '/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
    }
  }
  'pages.listings': {
    methods: ["GET","HEAD"]
    pattern: '/listings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['listingsPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['listingsPage']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['listingsPage']>>>
    }
  }
  'pages.inventory': {
    methods: ["GET","HEAD"]
    pattern: '/inventory'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['inventoryPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['inventoryPage']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['inventoryPage']>>>
    }
  }
  'pages.accounts': {
    methods: ["GET","HEAD"]
    pattern: '/seller-accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['index']>>>
    }
  }
  'pages.shipments': {
    methods: ["GET","HEAD"]
    pattern: '/shipments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['index']>>>
    }
  }
  'pages.returns': {
    methods: ["GET","HEAD"]
    pattern: '/returns'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['index']>>>
    }
  }
  'pages.claims': {
    methods: ["GET","HEAD"]
    pattern: '/claims'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['index']>>>
    }
  }
  'pages.finance': {
    methods: ["GET","HEAD"]
    pattern: '/finance'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['index']>>>
    }
  }
  'pages.tasks': {
    methods: ["GET","HEAD"]
    pattern: '/tasks'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['tasksPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['tasksPage']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['tasksPage']>>>
    }
  }
  'pages.import': {
    methods: ["GET","HEAD"]
    pattern: '/import'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['importPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['importPage']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['importPage']>>>
    }
  }
  'pages.audit': {
    methods: ["GET","HEAD"]
    pattern: '/audit'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['auditPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['auditPage']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['auditPage']>>>
    }
  }
  'pages.address_cleanup': {
    methods: ["GET","HEAD"]
    pattern: '/address-cleanup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['index']>>>
    }
  }
  'pages.tools_address_cleanup': {
    methods: ["GET","HEAD"]
    pattern: '/tools/address-cleanup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['index']>>>
    }
  }
  'pages.admin': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['index']>>>
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'orders.store': {
    methods: ["POST"]
    pattern: '/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createOrderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['storeOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['storeOrder']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['storeOrder']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'orders.bulk_import': {
    methods: ["POST"]
    pattern: '/orders/bulk-import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').bulkOrderImportValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').bulkOrderImportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['importBulkOrders']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['importBulkOrders']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['importBulkOrders']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'orders.bulk_status': {
    methods: ["POST"]
    pattern: '/orders/bulk/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['bulkUpdateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['bulkUpdateStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['bulkUpdateStatus']>>>
    }
  }
  'orders.bulk_export': {
    methods: ["POST"]
    pattern: '/orders/bulk/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['bulkExport']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['bulkExport']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['bulkExport']>>>
    }
  }
  'orders.update_status': {
    methods: ["POST"]
    pattern: '/orders/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateOrderStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateOrderStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateOrderStatus']>>>
    }
  }
  'orders.delete': {
    methods: ["POST"]
    pattern: '/orders/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['deleteOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['deleteOrder']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['deleteOrder']>>>
    }
  }
  'customers.store': {
    methods: ["POST"]
    pattern: '/customers'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createCustomerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['storeCustomer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['storeCustomer']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['storeCustomer']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.merge': {
    methods: ["POST"]
    pattern: '/customers/merge'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['mergeCustomers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['mergeCustomers']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['mergeCustomers']>>>
    }
  }
  'customers.update': {
    methods: ["POST"]
    pattern: '/customers/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateCustomerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['updateCustomer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['updateCustomer']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['updateCustomer']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.delete': {
    methods: ["POST"]
    pattern: '/customers/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['deleteCustomer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['deleteCustomer']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['deleteCustomer']>>>
    }
  }
  'risk_signals.review': {
    methods: ["POST"]
    pattern: '/risk-signals/:id/review'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['reviewRiskSignal']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['reviewRiskSignal']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['reviewRiskSignal']>>>
    }
  }
  'catalogs.sync_categories': {
    methods: ["POST"]
    pattern: '/catalogs/sync-categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['syncMedusaCategories']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['syncMedusaCategories']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['syncMedusaCategories']>>>
    }
  }
  'catalogs.import': {
    methods: ["POST"]
    pattern: '/catalogs/import'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['importCatalogJson']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['importCatalogJson']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['importCatalogJson']>>>
    }
  }
  'catalogs.import_json': {
    methods: ["POST"]
    pattern: '/catalogs/import-json'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['importCatalogJson']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['importCatalogJson']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['importCatalogJson']>>>
    }
  }
  'catalog_items.store': {
    methods: ["POST"]
    pattern: '/catalog-items'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['saveCatalogItem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['saveCatalogItem']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['saveCatalogItem']>>>
    }
  }
  'catalog_items.update': {
    methods: ["POST"]
    pattern: '/catalog-items/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['saveCatalogItem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['saveCatalogItem']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['saveCatalogItem']>>>
    }
  }
  'catalog_items.delete': {
    methods: ["POST"]
    pattern: '/catalog-items/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteCatalogItem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteCatalogItem']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteCatalogItem']>>>
    }
  }
  'catalog_items.preview': {
    methods: ["POST"]
    pattern: '/catalog-items/:id/preview'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['previewCatalogConversion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['previewCatalogConversion']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['previewCatalogConversion']>>>
    }
  }
  'catalog_items.convert': {
    methods: ["POST"]
    pattern: '/catalog-items/:id/convert'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['convertCatalogItemToProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['convertCatalogItemToProduct']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['convertCatalogItemToProduct']>>>
    }
  }
  'catalogs.generate_listings': {
    methods: ["POST"]
    pattern: '/catalogs/generate-listings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['generatePlatformListings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['generatePlatformListings']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['generatePlatformListings']>>>
    }
  }
  'brands.store': {
    methods: ["POST"]
    pattern: '/brands'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeBrand']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeBrand']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeBrand']>>>
    }
  }
  'brands.update': {
    methods: ["POST"]
    pattern: '/brands/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateBrandValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateBrandValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateBrand']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateBrand']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateBrand']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'brands.delete': {
    methods: ["POST"]
    pattern: '/brands/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteBrand']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteBrand']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteBrand']>>>
    }
  }
  'categories.store': {
    methods: ["POST"]
    pattern: '/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeCategory']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeCategory']>>>
    }
  }
  'categories.update': {
    methods: ["POST"]
    pattern: '/categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateCategory']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateCategory']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categories.delete': {
    methods: ["POST"]
    pattern: '/categories/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteCategory']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteCategory']>>>
    }
  }
  'products.store': {
    methods: ["POST"]
    pattern: '/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createProductValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.update': {
    methods: ["POST"]
    pattern: '/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateProductValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.delete': {
    methods: ["POST"]
    pattern: '/products/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteProduct']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteProduct']>>>
    }
  }
  'variants.store': {
    methods: ["POST"]
    pattern: '/products/:id/variants'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createVariantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createVariantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeVariant']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeVariant']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeVariant']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'variants.update_stock': {
    methods: ["POST"]
    pattern: '/variants/:id/stock'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateVariantStock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateVariantStock']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateVariantStock']>>>
    }
  }
  'variants.delete': {
    methods: ["POST"]
    pattern: '/variants/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteVariant']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteVariant']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteVariant']>>>
    }
  }
  'listings.store': {
    methods: ["POST"]
    pattern: '/channel-listings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeChannelListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeChannelListing']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeChannelListing']>>>
    }
  }
  'listings.publish_sku': {
    methods: ["POST"]
    pattern: '/channel-listings/publish-sku'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['publishSkuGroup']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['publishSkuGroup']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['publishSkuGroup']>>>
    }
  }
  'listings.update': {
    methods: ["POST"]
    pattern: '/channel-listings/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateChannelListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateChannelListing']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['updateChannelListing']>>>
    }
  }
  'listings.publish': {
    methods: ["POST"]
    pattern: '/channel-listings/:id/publish'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['publishChannelListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['publishChannelListing']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['publishChannelListing']>>>
    }
  }
  'listings.delete': {
    methods: ["POST"]
    pattern: '/channel-listings/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteChannelListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteChannelListing']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/products_controller').default['deleteChannelListing']>>>
    }
  }
  'seller_accounts.store': {
    methods: ["POST"]
    pattern: '/seller-accounts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createSellerAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createSellerAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['storeSellerAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['storeSellerAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['storeSellerAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_accounts.update': {
    methods: ["POST"]
    pattern: '/seller-accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateSellerAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateSellerAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['updateSellerAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['updateSellerAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['updateSellerAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_accounts.delete': {
    methods: ["POST"]
    pattern: '/seller-accounts/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['deleteSellerAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['deleteSellerAccount']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['deleteSellerAccount']>>>
    }
  }
  'seller_accounts.sync': {
    methods: ["POST"]
    pattern: '/seller-accounts/:id/sync'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['queueSellerSync']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['queueSellerSync']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/seller_accounts_controller').default['queueSellerSync']>>>
    }
  }
  'shipments.store': {
    methods: ["POST"]
    pattern: '/shipments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createShipmentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createShipmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['storeShipment']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['storeShipment']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['storeShipment']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shipments.bulk_status': {
    methods: ["POST"]
    pattern: '/shipments/bulk/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['bulkUpdateShipmentStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['bulkUpdateShipmentStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['bulkUpdateShipmentStatus']>>>
    }
  }
  'shipments.bulk_export': {
    methods: ["POST"]
    pattern: '/shipments/bulk/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['bulkExport']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['bulkExport']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['bulkExport']>>>
    }
  }
  'shipments.update_status': {
    methods: ["POST"]
    pattern: '/shipments/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateShipmentStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateShipmentStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateShipmentStatus']>>>
    }
  }
  'shipments.delete': {
    methods: ["POST"]
    pattern: '/shipments/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['deleteShipment']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['deleteShipment']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['deleteShipment']>>>
    }
  }
  'shipping_invoices.store': {
    methods: ["POST"]
    pattern: '/shipping-invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['storeCarrierInvoice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['storeCarrierInvoice']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['storeCarrierInvoice']>>>
    }
  }
  'shipping_invoices.update': {
    methods: ["POST"]
    pattern: '/shipping-invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateCarrierInvoice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateCarrierInvoice']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateCarrierInvoice']>>>
    }
  }
  'shipping_invoices.update_status': {
    methods: ["POST"]
    pattern: '/shipping-invoices/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateCarrierInvoice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateCarrierInvoice']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['updateCarrierInvoice']>>>
    }
  }
  'shipping_invoices.delete': {
    methods: ["POST"]
    pattern: '/shipping-invoices/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['deleteCarrierInvoice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['deleteCarrierInvoice']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/shipments_controller').default['deleteCarrierInvoice']>>>
    }
  }
  'returns.store': {
    methods: ["POST"]
    pattern: '/returns'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['storeReturn']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['storeReturn']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['storeReturn']>>>
    }
  }
  'returns.update_status': {
    methods: ["POST"]
    pattern: '/returns/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['updateReturnStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['updateReturnStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['updateReturnStatus']>>>
    }
  }
  'returns.delete': {
    methods: ["POST"]
    pattern: '/returns/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['deleteReturn']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['deleteReturn']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['deleteReturn']>>>
    }
  }
  'refunds.store': {
    methods: ["POST"]
    pattern: '/refunds'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createRefundValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createRefundValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['storeRefund']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['storeRefund']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/returns_controller').default['storeRefund']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'claims.store': {
    methods: ["POST"]
    pattern: '/claims'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['storeClaim']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['storeClaim']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['storeClaim']>>>
    }
  }
  'claims.update': {
    methods: ["POST"]
    pattern: '/claims/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['updateClaim']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['updateClaim']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['updateClaim']>>>
    }
  }
  'claims.update_status': {
    methods: ["POST"]
    pattern: '/claims/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['updateClaimStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['updateClaimStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['updateClaimStatus']>>>
    }
  }
  'claims.delete': {
    methods: ["POST"]
    pattern: '/claims/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['deleteClaim']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['deleteClaim']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/claims_controller').default['deleteClaim']>>>
    }
  }
  'financial_accounts.store': {
    methods: ["POST"]
    pattern: '/financial-accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinancialAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinancialAccount']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinancialAccount']>>>
    }
  }
  'financial_accounts.update': {
    methods: ["POST"]
    pattern: '/financial-accounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateFinancialAccountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateFinancialAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateFinancialAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateFinancialAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateFinancialAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'financial_accounts.delete': {
    methods: ["POST"]
    pattern: '/financial-accounts/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteFinancialAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteFinancialAccount']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteFinancialAccount']>>>
    }
  }
  'credit_cards.store': {
    methods: ["POST"]
    pattern: '/credit-cards'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createCreditCardValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createCreditCardValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeCreditCard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeCreditCard']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeCreditCard']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'credit_cards.update': {
    methods: ["POST"]
    pattern: '/credit-cards/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateCreditCardValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateCreditCardValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateCreditCard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateCreditCard']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateCreditCard']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'credit_cards.delete': {
    methods: ["POST"]
    pattern: '/credit-cards/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteCreditCard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteCreditCard']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteCreditCard']>>>
    }
  }
  'finance_categories.store': {
    methods: ["POST"]
    pattern: '/finance-categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinanceCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinanceCategory']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinanceCategory']>>>
    }
  }
  'finance_categories.update': {
    methods: ["POST"]
    pattern: '/finance-categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateFinanceCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateFinanceCategory']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['updateFinanceCategory']>>>
    }
  }
  'finance_categories.delete': {
    methods: ["POST"]
    pattern: '/finance-categories/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteFinanceCategory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteFinanceCategory']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['deleteFinanceCategory']>>>
    }
  }
  'financial_transactions.store': {
    methods: ["POST"]
    pattern: '/financial-transactions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createFinancialTransactionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createFinancialTransactionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinancialTransaction']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinancialTransaction']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['storeFinancialTransaction']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'finance.reports.store': {
    methods: ["POST"]
    pattern: '/finance/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['generateReport']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['generateReport']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['generateReport']>>>
    }
  }
  'financial_transactions.reconcile': {
    methods: ["POST"]
    pattern: '/financial-transactions/:id/reconcile'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['reconcileTransaction']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['reconcileTransaction']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['reconcileTransaction']>>>
    }
  }
  'financial_transactions.reverse_reconciliation': {
    methods: ["POST"]
    pattern: '/financial-transactions/:id/reconciliation/reverse'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['reverseReconciliation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['reverseReconciliation']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['reverseReconciliation']>>>
    }
  }
  'financial_transactions.void': {
    methods: ["POST"]
    pattern: '/financial-transactions/:id/void'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['voidFinancialTransaction']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['voidFinancialTransaction']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/finance_controller').default['voidFinancialTransaction']>>>
    }
  }
  'tasks.store': {
    methods: ["POST"]
    pattern: '/tasks'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createTaskValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createTaskValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['storeTask']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['storeTask']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['storeTask']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'tasks.update': {
    methods: ["POST"]
    pattern: '/tasks/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').updateTaskValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').updateTaskValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['updateTask']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['updateTask']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['updateTask']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'tasks.status': {
    methods: ["POST"]
    pattern: '/tasks/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['updateTaskStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['updateTaskStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['updateTaskStatus']>>>
    }
  }
  'tasks.complete': {
    methods: ["POST"]
    pattern: '/tasks/:id/complete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['completeTask']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['completeTask']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['completeTask']>>>
    }
  }
  'tasks.delete': {
    methods: ["POST"]
    pattern: '/tasks/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['deleteTask']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['deleteTask']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['deleteTask']>>>
    }
  }
  'saved_views.store': {
    methods: ["POST"]
    pattern: '/saved-views'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['storeSavedView']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['storeSavedView']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['storeSavedView']>>>
    }
  }
  'saved_views.delete': {
    methods: ["POST"]
    pattern: '/saved-views/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['deleteSavedView']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['deleteSavedView']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['deleteSavedView']>>>
    }
  }
  'import.upload_catalog': {
    methods: ["POST"]
    pattern: '/import/upload-catalog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['uploadCatalogImport']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['uploadCatalogImport']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['uploadCatalogImport']>>>
    }
  }
  'import.sync_accounts': {
    methods: ["POST"]
    pattern: '/import/sync-accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['triggerAccountSync']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['triggerAccountSync']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/tools_controller').default['triggerAccountSync']>>>
    }
  }
  'api.tools.address_clean': {
    methods: ["POST"]
    pattern: '/api/tools/address-clean'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['clean']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['clean']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['clean']>>>
    }
  }
  'api.tools.address_clean_docx': {
    methods: ["POST"]
    pattern: '/api/tools/address-clean/docx'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['downloadDocx']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['downloadDocx']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['downloadDocx']>>>
    }
  }
  'address_cleanup.save_customer': {
    methods: ["POST"]
    pattern: '/address-cleanup/save-customer'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['saveToCustomer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['saveToCustomer']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['saveToCustomer']>>>
    }
  }
  'address_cleanup.process': {
    methods: ["POST"]
    pattern: '/address-cleanup/process'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['process']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['process']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['process']>>>
    }
  }
  'address_cleanup.export_docx': {
    methods: ["POST"]
    pattern: '/address-cleanup/export-docx'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['exportDocx']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['exportDocx']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/address_cleanup_controller').default['exportDocx']>>>
    }
  }
  'admin.users.store': {
    methods: ["POST"]
    pattern: '/admin/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['storeUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['storeUser']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['storeUser']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.users.status': {
    methods: ["POST"]
    pattern: '/admin/users/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['toggleUserStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['toggleUserStatus']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['toggleUserStatus']>>>
    }
  }
  'admin.users.update': {
    methods: ["POST"]
    pattern: '/admin/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['updateUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['updateUser']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['updateUser']>>>
    }
  }
  'admin.users.delete': {
    methods: ["POST"]
    pattern: '/admin/users/:id/delete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['deleteUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['deleteUser']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['deleteUser']>>>
    }
  }
  'admin.users.assign_role': {
    methods: ["POST"]
    pattern: '/admin/users/:id/roles'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['assignUserRole']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['assignUserRole']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['assignUserRole']>>>
    }
  }
  'admin.users.module_access': {
    methods: ["POST"]
    pattern: '/admin/users/:id/modules'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['setModuleAccess']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['setModuleAccess']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['setModuleAccess']>>>
    }
  }
  'admin.entitlements.toggle': {
    methods: ["POST"]
    pattern: '/admin/entitlements/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['toggleModuleEntitlement']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['toggleModuleEntitlement']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#controllers/admin_controller').default['toggleModuleEntitlement']>>>
    }
  }
}
