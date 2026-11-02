import React from 'react'
import { FormModal, moneyAmountString, moneyCurrencyCode, type Row } from '~/lib/ui'

export const ACCOUNT_TYPES = [
  'bank_checking',
  'bank_savings',
  'credit_card_clearing',
  'marketplace_clearing',
  'cash_on_hand',
  'petty_cash',
] as const

export function CreateAccountModal({
  isOpen,
  onOpenChange,
  householdCreateAccess = false,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  householdCreateAccess?: boolean
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Create Financial Account"
      subtitle="Bank checking, savings, cash, and marketplace clearing accounts."
      submitLabel="Create Account"
      action="/financial-accounts"
      fields={[
        { name: 'accountName', label: 'Account Name', required: true },
        {
          name: 'accountType',
          label: 'Account Type',
          kind: 'select',
          default: 'bank_checking',
          options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
        },
        { name: 'institutionName', label: 'Institution Name' },
        { name: 'accountNumberLast4', label: 'Last 4 Digits', placeholder: '4401' },
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
          name: 'currentBalance',
          label: 'Opening Balance',
          kind: 'money',
          currencyFrom: 'currencyCode',
          default: '0',
        },
        { name: 'currencyCode', label: 'Currency', default: 'USD' },
        {
          name: 'isActive',
          label: 'Active Status',
          kind: 'select',
          default: 'true',
          options: [
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ],
        },
      ]}
    />
  )
}

export function EditAccountModal({
  account,
  onClose,
  householdUpdateAccess = false,
}: {
  account: Row | null
  onClose: () => void
  householdUpdateAccess?: boolean
}) {
  return (
    <FormModal
      isOpen={!!account}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={`Edit Account: ${String(account?.accountName ?? '')}`}
      submitLabel="Save Account"
      action={account ? `/financial-accounts/${account.id}` : '/financial-accounts/placeholder'}
      initialValues={
        account
          ? {
              accountName: String(account.accountName ?? ''),
              accountType: String(account.accountType ?? 'bank_checking'),
              institutionName: String(account.institutionName ?? ''),
              accountNumberLast4: String(account.accountNumberLast4 ?? ''),
              dataClassification: String(account.dataClassification ?? 'business'),
              currentBalance: moneyAmountString(account.currentBalance),
              currentBalance__currency: moneyCurrencyCode(account.currentBalance),
              currencyCode: String(account.currencyCode ?? 'USD'),
              isActive: String(account.isActive ?? 'true'),
            }
          : undefined
      }
      fields={[
        { name: 'accountName', label: 'Account Name', required: true },
        {
          name: 'accountType',
          label: 'Account Type',
          kind: 'select',
          options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
        },
        { name: 'institutionName', label: 'Institution Name' },
        { name: 'accountNumberLast4', label: 'Last 4 Digits' },
        {
          name: 'dataClassification',
          label: 'Classification',
          kind: 'select',
          options: [
            { value: 'business', label: 'Business' },
            ...(householdUpdateAccess
              ? [{ value: 'household_personal', label: 'Household / personal' }]
              : []),
          ],
        },
        { name: 'currentBalance', label: 'Balance', kind: 'number' },
        { name: 'currencyCode', label: 'Currency' },
        {
          name: 'isActive',
          label: 'Active',
          kind: 'select',
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ],
        },
      ]}
    />
  )
}
