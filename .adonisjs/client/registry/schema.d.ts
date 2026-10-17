/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['index']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeOrder']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['importBulkOrders']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['importBulkOrders']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['updateOrderStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['updateOrderStatus']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['deleteOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['deleteOrder']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeCustomer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeCustomer']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['reviewRiskSignal']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['reviewRiskSignal']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeProduct']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeProduct']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['updateVariantStock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['updateVariantStock']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeSellerAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeSellerAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeShipment']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeShipment']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shipping_invoices.store': {
    methods: ["POST"]
    pattern: '/shipping-invoices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createShippingInvoiceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createShippingInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeShippingInvoice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeShippingInvoice']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'returns.store': {
    methods: ["POST"]
    pattern: '/returns'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/operations').createReturnRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/operations').createReturnRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeReturnRequest']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeReturnRequest']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeRefund']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeRefund']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeCreditCard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeCreditCard']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeFinancialTransaction']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeFinancialTransaction']>>> | { status: 422; response: { errors: SimpleError[] } }
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['completeTask']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['completeTask']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeUser']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['storeUser']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.users.toggle_status': {
    methods: ["POST"]
    pattern: '/admin/users/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['toggleUserStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['toggleUserStatus']>>>
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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['toggleModuleEntitlement']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/operations_controller').default['toggleModuleEntitlement']>>>
    }
  }
}
