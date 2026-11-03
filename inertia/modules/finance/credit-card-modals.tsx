import React from 'react'
import { FormModal, moneyAmountString, moneyCurrencyCode, type Row } from '~/lib/ui'

export const CARD_STATUS = ['active', 'frozen', 'expired', 'cancelled'] as const
export const CARD_USAGE = [
  'primary_billing',
  'ad_spend',
  'subscription_fee',
  'chargeback_backup',
  'shipping_labels',
] as const

export function CreateCreditCardModal({
  isOpen,
  onOpenChange,
  householdCreateAccess = false,
  sellerAccounts = [],
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  householdCreateAccess?: boolean
  sellerAccounts?: Row[]
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Add Card Metadata"
      subtitle="Record card metadata only. No vault or payment integration is configured; never enter a full card number or CVV."
      submitLabel="Add Card"
      action="/credit-cards"
      fields={[
        { name: 'cardLabel', label: 'Card Label', required: true },
        {
          name: 'brandName',
          label: 'Brand (e.g. Visa, Amex)',
          required: true,
          placeholder: 'Visa',
        },
        { name: 'cardholderName', label: 'Cardholder Name', required: true },
        { name: 'last4Digits', label: 'Last 4 Digits', required: true, placeholder: '4242' },
        { name: 'expMonth', label: 'Exp Month (1–12)', kind: 'number', required: true },
        { name: 'expYear', label: 'Exp Year (e.g. 2028)', kind: 'number', required: true },
        { name: 'currencyCode', label: 'Currency Code', default: 'USD' },
        {
          name: 'creditLimit',
          label: 'Credit Limit',
          kind: 'money',
          currencyFrom: 'currencyCode',
        },
        {
          name: 'currentBalance',
          label: 'Current Balance',
          kind: 'money',
          currencyFrom: 'currencyCode',
          default: '0',
        },
        {
          name: 'minimumPaymentDue',
          label: 'Minimum Payment Due',
          kind: 'money',
          currencyFrom: 'currencyCode',
        },
        { name: 'nextPaymentDueDate', label: 'Next Due Date', kind: 'date' },
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
        {
          name: 'sellerAccountId',
          label: 'Linked Seller Account',
          kind: 'select',
          options: sellerAccounts.map((s) => ({
            value: String(s.id),
            label: String(s.accountName ?? s.id),
          })),
        },
        {
          name: 'usagePurpose',
          label: 'Usage Purpose',
          kind: 'select',
          default: 'primary_billing',
          options: CARD_USAGE.map((u) => ({ value: u, label: u.replace(/_/g, ' ') })),
        },
      ]}
    />
  )
}

export function EditCreditCardModal({ card, onClose }: { card: Row | null; onClose: () => void }) {
  return (
    <FormModal
      isOpen={!!card}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={`Edit Card: ${String(card?.cardLabel ?? '')}`}
      submitLabel="Save Card"
      action={card ? `/credit-cards/${card.id}` : '/credit-cards/placeholder'}
      initialValues={
        card
          ? {
              cardLabel: String(card.cardLabel ?? ''),
              creditLimit: moneyAmountString(card.creditLimit),
              creditLimit__currency: moneyCurrencyCode(card.creditLimit),
              currentBalance: moneyAmountString(card.currentBalance),
              currentBalance__currency: moneyCurrencyCode(card.currentBalance),
              minimumPaymentDue: moneyAmountString(card.minimumPaymentDue),
              minimumPaymentDue__currency: moneyCurrencyCode(card.minimumPaymentDue),
              nextPaymentDueDate: card.nextPaymentDueDate
                ? String(card.nextPaymentDueDate).slice(0, 10)
                : '',
              status: String(card.status ?? 'active'),
            }
          : undefined
      }
      fields={[
        { name: 'cardLabel', label: 'Card Label', required: true },
        { name: 'creditLimit', label: 'Credit Limit', kind: 'money' },
        { name: 'currentBalance', label: 'Current Balance', kind: 'money' },
        { name: 'minimumPaymentDue', label: 'Minimum Payment Due', kind: 'money' },
        { name: 'nextPaymentDueDate', label: 'Next Due Date', kind: 'date' },
        {
          name: 'status',
          label: 'Status',
          kind: 'select',
          options: CARD_STATUS.map((s) => ({ value: s, label: s })),
        },
      ]}
    />
  )
}
