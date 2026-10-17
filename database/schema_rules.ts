import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

const enumRule = {
  decorators: [{ name: '@column' }],
  tsType: 'string',
}

const jsonbRule = {
  decorators: [
    {
      name: '@column',
      args: {
        prepare: (v: any) =>
          v === null || v === undefined || typeof v === 'string' ? v : JSON.stringify(v),
      },
    },
  ],
  tsType: 'any',
}

export default {
  types: {
    'jsonb': jsonbRule,
    'json': jsonbRule,
    'USER-DEFINED': enumRule,
    'user_status': enumRule,
    'permission_effect': enumRule,
    'channel_type': enumRule,
    'seller_account_status': enumRule,
    'health_status': enumRule,
    'sync_job_type': enumRule,
    'sync_job_status': enumRule,
    'customer_risk_level': enumRule,
    'address_type': enumRule,
    'risk_signal_type': enumRule,
    'risk_severity': enumRule,
    'risk_review_status': enumRule,
    'product_status': enumRule,
    'variant_status': enumRule,
    'listing_status': enumRule,
    'publication_status': enumRule,
    'entity_sync_status': enumRule,
    'order_source_type': enumRule,
    'order_status': enumRule,
    'order_payment_status': enumRule,
    'fulfillment_status': enumRule,
    'shipment_status': enumRule,
    'invoice_payment_status': enumRule,
    'invoice_reconciliation_status': enumRule,
    'shipping_charge_type': enumRule,
    'return_status': enumRule,
    'return_reason': enumRule,
    'return_resolution_type': enumRule,
    'return_item_condition': enumRule,
    'refund_status': enumRule,
    'claim_type': enumRule,
    'claim_status': enumRule,
    'financial_account_type': enumRule,
    'data_classification': enumRule,
    'credit_card_status': enumRule,
    'card_channel_usage': enumRule,
    'finance_category_type': enumRule,
    'finance_cost_bucket': enumRule,
    'financial_transaction_type': enumRule,
    'financial_transaction_status': enumRule,
    'task_type': enumRule,
    'task_priority': enumRule,
    'task_status': enumRule,
    'outbox_event_status': enumRule,
  },
} satisfies SchemaRules
