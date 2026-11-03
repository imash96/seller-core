import React from 'react'
import { FormModal, type Row } from '~/lib/ui'

export const TX_TYPES = [
  'income',
  'expense',
  'transfer',
  'credit_card_payment',
  'refund_payout',
  'marketplace_settlement',
] as const

export function CreateTransactionModal({
  isOpen,
  onOpenChange,
  householdCreateAccess = false,
  financialAccounts = [],
  creditCards = [],
  financeCategories = [],
  sellerAccounts = [],
  orders = [],
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  householdCreateAccess?: boolean
  financialAccounts?: Row[]
  creditCards?: Row[]
  financeCategories?: Row[]
  sellerAccounts?: Row[]
  orders?: Row[]
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Record Financial Transaction"
      subtitle="Record a local ledger entry. Linked accounts, cards and categories must match its classification."
      submitLabel="Record Transaction"
      action="/financial-transactions"
      fields={[
        { name: 'referenceNumber', label: 'Reference Number', required: true },
        {
          name: 'transactionType',
          label: 'Transaction Type',
          kind: 'select',
          required: true,
          options: TX_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
        },
        {
          name: 'dataClassification',
          label: 'Classification',
          kind: 'select',
          default: 'business',
          options: [
            { value: 'business', label: 'Business' },
            ...(householdCreateAccess
              ? [{ value: 'household_personal', label: 'Household / personal' }]
              : []),
          ],
        },
        { name: 'vendorOrPayer', label: 'Vendor / Payer' },
        { name: 'originalCurrencyCode', label: 'Currency', default: 'USD' },
        {
          name: 'originalAmount',
          label: 'Amount',
          kind: 'money',
          currencyFrom: 'originalCurrencyCode',
          required: true,
        },
        { name: 'exchangeRate', label: 'Exchange Rate to USD', kind: 'number', default: '1' },
        {
          name: 'taxAmount',
          label: 'Tax Amount',
          kind: 'money',
          currencyFrom: 'originalCurrencyCode',
        },
        { name: 'transactionDate', label: 'Transaction Date', kind: 'date', required: true },
        {
          name: 'financialAccountId',
          label: 'Financial Account',
          kind: 'select',
          options: (values: any) =>
            financialAccounts
              .filter((a) => a.dataClassification === (values.dataClassification || 'business'))
              .map((a) => ({
                value: String(a.id),
                label: `${a.accountName} (${a.dataClassification})`,
              })),
        },
        {
          name: 'creditCardId',
          label: 'Credit Card',
          kind: 'select',
          options: (values: any) =>
            creditCards
              .filter((c) => c.dataClassification === (values.dataClassification || 'business'))
              .map((c) => ({
                value: String(c.id),
                label: `${c.cardLabel} ··${c.last4Digits} (${c.dataClassification})`,
              })),
        },
        {
          name: 'financeCategoryId',
          label: 'Finance Category',
          kind: 'select',
          options: (values: any) =>
            financeCategories
              .filter((fc) => fc.dataClassification === (values.dataClassification || 'business'))
              .map((fc) => ({
                value: String(fc.id),
                label: `${fc.name} (${fc.dataClassification})`,
              })),
        },
        {
          name: 'sellerAccountId',
          label: 'Seller Account',
          kind: 'select',
          options: sellerAccounts.map((s) => ({
            value: String(s.id),
            label: String(s.accountName ?? s.id),
          })),
        },
        {
          name: 'orderId',
          label: 'Linked Order (optional)',
          kind: 'select',
          options: orders.map((o) => ({
            value: String(o.id),
            label: String(o.orderNumber),
          })),
        },
        {
          name: 'description',
          label: 'Description',
          required: true,
          fullWidth: true,
        },
      ]}
    />
  )
}
