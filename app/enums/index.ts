/**
 * Shared Enums & Constants matching PostgreSQL ENUM types 1:1
 */

export const UserStatus = {
  PENDING_ACTIVATION: 'pending_activation',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  LOCKED: 'locked',
  DEACTIVATED: 'deactivated',
} as const
export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus]

export const PermissionEffect = {
  ALLOW: 'allow',
  DENY: 'deny',
} as const
export type PermissionEffectType = (typeof PermissionEffect)[keyof typeof PermissionEffect]

export const ChannelType = {
  MARKETPLACE: 'marketplace',
  WEBSTORE: 'webstore',
  SHOPPING_FEED: 'shopping_feed',
  CUSTOM: 'custom',
} as const
export type ChannelTypeValue = (typeof ChannelType)[keyof typeof ChannelType]

export const SellerAccountStatus = {
  PENDING_SETUP: 'pending_setup',
  ACTIVE: 'active',
  AUTH_EXPIRED: 'auth_expired',
  RATE_LIMITED: 'rate_limited',
  SUSPENDED: 'suspended',
  DISCONNECTED: 'disconnected',
} as const
export type SellerAccountStatusType = (typeof SellerAccountStatus)[keyof typeof SellerAccountStatus]

export const HealthStatus = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown',
} as const
export type HealthStatusType = (typeof HealthStatus)[keyof typeof HealthStatus]

export const SyncJobType = {
  ORDER_IMPORT: 'order_import',
  CATALOG_SYNC: 'catalog_sync',
  INVENTORY_SYNC: 'inventory_sync',
  TRACKING_PUSH: 'tracking_push',
  SETTLEMENT_IMPORT: 'settlement_import',
  MANUAL_BULK_IMPORT: 'manual_bulk_import',
  EXPORT: 'export',
} as const
export type SyncJobTypeValue = (typeof SyncJobType)[keyof typeof SyncJobType]

export const SyncJobStatus = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const
export type SyncJobStatusType = (typeof SyncJobStatus)[keyof typeof SyncJobStatus]

export const CustomerRiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  UNDER_REVIEW: 'under_review',
  CLEARED: 'cleared',
} as const
export type CustomerRiskLevelType = (typeof CustomerRiskLevel)[keyof typeof CustomerRiskLevel]

export const AddressType = {
  SHIPPING: 'shipping',
  BILLING: 'billing',
  BOTH: 'both',
} as const
export type AddressTypeValue = (typeof AddressType)[keyof typeof AddressType]

export const RiskSignalType = {
  SHARED_ADDRESS_MISMATCH: 'shared_address_mismatch',
  PROXY_EMAIL_CHANGE: 'proxy_email_change',
  REPEATED_CHARGEBACKS: 'repeated_chargebacks',
  HIGH_RETURN_RATE: 'high_return_rate',
  VELOCITY_SPIKE: 'velocity_spike',
  ADDRESS_VERIFICATION_FAILED: 'address_verification_failed',
  MANUAL_FLAG: 'manual_flag',
} as const
export type RiskSignalTypeValue = (typeof RiskSignalType)[keyof typeof RiskSignalType]

export const RiskSeverity = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const
export type RiskSeverityType = (typeof RiskSeverity)[keyof typeof RiskSeverity]

export const RiskReviewStatus = {
  PENDING_REVIEW: 'pending_review',
  INVESTIGATING: 'investigating',
  CONFIRMED_RISK: 'confirmed_risk',
  FALSE_POSITIVE: 'false_positive',
  RESOLVED: 'resolved',
} as const
export type RiskReviewStatusType = (typeof RiskReviewStatus)[keyof typeof RiskReviewStatus]

export const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DISCONTINUED: 'discontinued',
} as const
export type ProductStatusType = (typeof ProductStatus)[keyof typeof ProductStatus]

export const VariantStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
} as const
export type VariantStatusType = (typeof VariantStatus)[keyof typeof VariantStatus]

export const ListingStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUPPRESSED: 'suppressed',
  ENDED: 'ended',
  ERROR: 'error',
} as const
export type ListingStatusType = (typeof ListingStatus)[keyof typeof ListingStatus]

export const PublicationStatus = {
  UNPUBLISHED: 'unpublished',
  QUEUED: 'queued',
  PUBLISHED: 'published',
  FAILED: 'failed',
} as const
export type PublicationStatusType = (typeof PublicationStatus)[keyof typeof PublicationStatus]

export const EntitySyncStatus = {
  NOT_APPLICABLE: 'not_applicable',
  SYNCED: 'synced',
  PENDING: 'pending',
  ERROR: 'error',
  STALE: 'stale',
} as const
export type EntitySyncStatusType = (typeof EntitySyncStatus)[keyof typeof EntitySyncStatus]

export const OrderSourceType = {
  MANUAL: 'manual',
  MARKETPLACE_IMPORT: 'marketplace_import',
  API_BULK: 'api_bulk',
  WEBSTORE: 'webstore',
  REPLACEMENT: 'replacement',
} as const
export type OrderSourceTypeValue = (typeof OrderSourceType)[keyof typeof OrderSourceType]

export const OrderStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PARTIALLY_FULFILLED: 'partially_fulfilled',
  FULFILLED: 'fulfilled',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
} as const
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderPaymentStatus = {
  UNPAID: 'unpaid',
  AUTHORIZED: 'authorized',
  PAID: 'paid',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
  CHARGEBACK: 'chargeback',
  VOIDED: 'voided',
} as const
export type OrderPaymentStatusType = (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus]

export const FulfillmentStatus = {
  UNFULFILLED: 'unfulfilled',
  PARTIALLY_FULFILLED: 'partially_fulfilled',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const
export type FulfillmentStatusType = (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus]

export const ShipmentStatus = {
  PENDING: 'pending',
  LABEL_CREATED: 'label_created',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  DELAYED: 'delayed',
  EXCEPTION: 'exception',
  FAILED: 'failed',
  RETURNED_TO_SENDER: 'returned_to_sender',
} as const
export type ShipmentStatusType = (typeof ShipmentStatus)[keyof typeof ShipmentStatus]

export const InvoicePaymentStatus = {
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  DISPUTED: 'disputed',
  OVERDUE: 'overdue',
  VOIDED: 'voided',
} as const
export type InvoicePaymentStatusType =
  (typeof InvoicePaymentStatus)[keyof typeof InvoicePaymentStatus]

export const InvoiceReconciliationStatus = {
  UNRECONCILED: 'unreconciled',
  MATCHED: 'matched',
  VARIANCE_DETECTED: 'variance_detected',
  RESOLVED: 'resolved',
} as const
export type InvoiceReconciliationStatusType =
  (typeof InvoiceReconciliationStatus)[keyof typeof InvoiceReconciliationStatus]

export const ShippingChargeType = {
  BASE_FREIGHT: 'base_freight',
  FUEL_SURCHARGE: 'fuel_surcharge',
  RESIDENTIAL_FEE: 'residential_fee',
  REMOTE_AREA_SURCHARGE: 'remote_area_surcharge',
  CUSTOMS_DUTY: 'customs_duty',
  TAX: 'tax',
  SIGNATURE_FEE: 'signature_fee',
  DIMENSIONAL_WEIGHT_ADJUSTMENT: 'dimensional_weight_adjustment',
  ADDRESS_CORRECTION: 'address_correction',
  RETURN_SHIPPING: 'return_shipping',
  OTHER: 'other',
} as const
export type ShippingChargeTypeValue = (typeof ShippingChargeType)[keyof typeof ShippingChargeType]

export const ReturnStatus = {
  REQUESTED: 'requested',
  AUTHORIZED: 'authorized',
  REJECTED: 'rejected',
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  INSPECTED: 'inspected',
  REFUNDED: 'refunded',
  REPLACEMENT_SENT: 'replacement_sent',
  CLOSED: 'closed',
} as const
export type ReturnStatusType = (typeof ReturnStatus)[keyof typeof ReturnStatus]

export const ReturnReason = {
  DEFECTIVE: 'defective',
  WRONG_ITEM: 'wrong_item',
  DAMAGED_IN_TRANSIT: 'damaged_in_transit',
  NOT_AS_DESCRIBED: 'not_as_described',
  CHANGED_MIND: 'changed_mind',
  SIZE_FIT_ISSUE: 'size_fit_issue',
  LATE_DELIVERY: 'late_delivery',
  OTHER: 'other',
} as const
export type ReturnReasonType = (typeof ReturnReason)[keyof typeof ReturnReason]

export const ReturnResolutionType = {
  REFUND: 'refund',
  PARTIAL_REFUND: 'partial_refund',
  REPLACEMENT: 'replacement',
  STORE_CREDIT: 'store_credit',
  REJECTED: 'rejected',
} as const
export type ReturnResolutionTypeValue =
  (typeof ReturnResolutionType)[keyof typeof ReturnResolutionType]

export const ReturnItemCondition = {
  UNOPENED: 'unopened',
  LIKE_NEW: 'like_new',
  USED: 'used',
  DAMAGED: 'damaged',
  UNSELLABLE: 'unsellable',
} as const
export type ReturnItemConditionType = (typeof ReturnItemCondition)[keyof typeof ReturnItemCondition]

export const RefundStatus = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const
export type RefundStatusType = (typeof RefundStatus)[keyof typeof RefundStatus]

export const ClaimType = {
  A_TO_Z_GUARANTEE: 'a_to_z_guarantee',
  CHARGEBACK: 'chargeback',
  ITEM_NOT_RECEIVED: 'item_not_received',
  UNAUTHORIZED_PAYMENT: 'unauthorized_payment',
  NOT_AS_DESCRIBED: 'not_as_described',
  OTHER: 'other',
} as const
export type ClaimTypeValue = (typeof ClaimType)[keyof typeof ClaimType]

export const ClaimStatus = {
  OPENED: 'opened',
  UNDER_REVIEW: 'under_review',
  ACTION_REQUIRED: 'action_required',
  SELLER_FUNDED: 'seller_funded',
  MARKETPLACE_FUNDED: 'marketplace_funded',
  WON: 'won',
  LOST: 'lost',
  APPEALED: 'appealed',
  CLOSED: 'closed',
} as const
export type ClaimStatusType = (typeof ClaimStatus)[keyof typeof ClaimStatus]

export const FinancialAccountType = {
  BANK_CHECKING: 'bank_checking',
  BANK_SAVINGS: 'bank_savings',
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  MARKETPLACE_CLEARING: 'marketplace_clearing',
  PAYMENT_GATEWAY: 'payment_gateway',
} as const
export type FinancialAccountTypeValue =
  (typeof FinancialAccountType)[keyof typeof FinancialAccountType]

export const DataClassification = {
  BUSINESS: 'business',
  HOUSEHOLD_PERSONAL: 'household_personal',
} as const
export type DataClassificationType = (typeof DataClassification)[keyof typeof DataClassification]

export const CreditCardStatus = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const
export type CreditCardStatusType = (typeof CreditCardStatus)[keyof typeof CreditCardStatus]

export const CardChannelUsage = {
  AD_SPEND: 'ad_spend',
  SUBSCRIPTION_FEE: 'subscription_fee',
  CHARGEBACK_BACKUP: 'chargeback_backup',
  SHIPPING_LABELS: 'shipping_labels',
  PRIMARY_BILLING: 'primary_billing',
} as const
export type CardChannelUsageType = (typeof CardChannelUsage)[keyof typeof CardChannelUsage]

export const FinanceCategoryType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const
export type FinanceCategoryTypeValue =
  (typeof FinanceCategoryType)[keyof typeof FinanceCategoryType]

export const FinanceCostBucket = {
  COGS: 'cogs',
  SHIPPING: 'shipping',
  MARKETPLACE_FEE: 'marketplace_fee',
  MARKETING: 'marketing',
  SOFTWARE: 'software',
  OPERATIONS: 'operations',
  MANUFACTURING: 'manufacturing',
  TAX: 'tax',
  PERSONAL: 'personal',
  OTHER_INCOME: 'other_income',
  SALES_REVENUE: 'sales_revenue',
} as const
export type FinanceCostBucketType = (typeof FinanceCostBucket)[keyof typeof FinanceCostBucket]

export const FinancialTransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
  CREDIT_CARD_PAYMENT: 'credit_card_payment',
  REFUND_PAYOUT: 'refund_payout',
  MARKETPLACE_SETTLEMENT: 'marketplace_settlement',
} as const
export type FinancialTransactionTypeValue =
  (typeof FinancialTransactionType)[keyof typeof FinancialTransactionType]

export const FinancialTransactionStatus = {
  PENDING: 'pending',
  POSTED: 'posted',
  SETTLED: 'settled',
  RECONCILED: 'reconciled',
  VOIDED: 'voided',
  OVERDUE: 'overdue',
} as const
export type FinancialTransactionStatusType =
  (typeof FinancialTransactionStatus)[keyof typeof FinancialTransactionStatus]

export const TaskType = {
  CREDIT_CARD_DUE: 'credit_card_due',
  CONFIRM_SHIPMENT: 'confirm_shipment',
  MESSAGE_REPLY: 'message_reply',
  INVOICE_DUE: 'invoice_due',
  RETURN_REVIEW: 'return_review',
  FRAUD_REVIEW: 'fraud_review',
  RESTOCK_ALERT: 'restock_alert',
  CLAIM_DEADLINE: 'claim_deadline',
  GENERAL: 'general',
} as const
export type TaskTypeValue = (typeof TaskType)[keyof typeof TaskType]

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const
export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority]

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SNOOZED: 'snoozed',
  DISMISSED: 'dismissed',
} as const
export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus]

export const OutboxEventStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PUBLISHED: 'published',
  FAILED: 'failed',
  DEAD_LETTER: 'dead_letter',
} as const
export type OutboxEventStatusType = (typeof OutboxEventStatus)[keyof typeof OutboxEventStatus]

export const SupportedCurrencies = ['USD', 'CAD', 'MXN', 'INR', 'GBP', 'EUR'] as const
export type SupportedCurrencyCode = (typeof SupportedCurrencies)[number]

export const ModuleKeys = [
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
  'tasks',
  'users_rbac',
] as const
export type ModuleKey = (typeof ModuleKeys)[number]
