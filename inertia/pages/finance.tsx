import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'

import {
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  short,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'

type Props = {
  financialAccounts: Row[]
  creditCards: Row[]
  financialTransactions: Row[]
  financeCategories: Row[]
  sellerAccounts: Row[]
  orders: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  orderLineItems: Row[]
  savedViews?: Row[]
}



const ACCOUNT_TYPES = [
  'bank_checking',
  'bank_savings',
  'cash',
  'credit_card',
  'marketplace_clearing',
  'payment_gateway',
]
const CARD_STATUS = ['active', 'frozen', 'expired', 'cancelled']
const TX_TYPES = [
  'income',
  'expense',
  'transfer',
  'credit_card_payment',
  'refund_payout',
  'marketplace_settlement',
]
const CARD_USAGE = [
  'ad_spend',
  'subscription_fee',
  'chargeback_backup',
  'shipping_labels',
  'primary_billing',
]

export default function Finance({
  financialAccounts,
  creditCards,
  financialTransactions,
  financeCategories,
  sellerAccounts,
  savedViews,
}: Props) {
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [editAccountRow, setEditAccountRow] = useState<Row | null>(null)
  const [createCardOpen, setCreateCardOpen] = useState(false)
  const [editCardRow, setEditCardRow] = useState<Row | null>(null)
  const [createTxOpen, setCreateTxOpen] = useState(false)

  return (
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button
            label="+ Financial Account"
            variant="primary"
            onClick={() => setCreateAccountOpen(true)}
          />
          <Button
            label="+ Credit Card"
            variant="secondary"
            onClick={() => setCreateCardOpen(true)}
          />
          <Button label="+ Transaction" variant="ghost" onClick={() => setCreateTxOpen(true)} />
          <Text type="supporting" as="div">
            {financialAccounts.length} accounts · {creditCards.length} cards ·{' '}
            {financialTransactions.length} transactions
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      <FormModal
        isOpen={createAccountOpen}
        onOpenChange={setCreateAccountOpen}
        title="Create financial account"
        subtitle="Bank, cash and marketplace clearing accounts."
        submitLabel="Create account"
        action="/financial-accounts"
        fields={[
          { name: 'accountName', label: 'Account name', required: true },
          {
            name: 'accountType',
            label: 'Type',
            kind: 'select',
            default: 'bank_checking',
            options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
          },
          { name: 'institutionName', label: 'Institution' },
          { name: 'accountNumberLast4', label: 'Last 4 digits', placeholder: '0000' },
          {
            name: 'dataClassification',
            label: 'Classification',
            kind: 'select',
            default: 'business',
            options: [
              { value: 'business', label: 'Business' },
              { value: 'household_personal', label: 'Household / personal' },
            ],
          },
          { name: 'currentBalance', label: 'Opening balance', kind: 'number', default: '0' },
          { name: 'currencyCode', label: 'Currency', default: 'USD' },
        ]}
      />

      <FormModal
        isOpen={!!editAccountRow}
        onOpenChange={(o) => {
          if (!o) setEditAccountRow(null)
        }}
        title={`Edit account: ${String(editAccountRow?.accountName ?? '')}`}
        submitLabel="Save account"
        action={
          editAccountRow
            ? `/financial-accounts/${editAccountRow.id}`
            : '/financial-accounts/placeholder'
        }
        initialValues={
          editAccountRow
            ? {
                accountName: String(editAccountRow.accountName ?? ''),
                currentBalance: String(editAccountRow.currentBalance ?? 0),
              }
            : undefined
        }
        fields={[
          { name: 'accountName', label: 'Account name' },
          { name: 'currentBalance', label: 'Balance', kind: 'number' },
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

      <FormModal
        isOpen={createCardOpen}
        onOpenChange={setCreateCardOpen}
        title="Add credit card (PCI-safe)"
        subtitle="Last four digits only — no PAN, no CVV."
        submitLabel="Add card"
        action="/credit-cards"
        fields={[
          { name: 'cardLabel', label: 'Card label', required: true },
          { name: 'brandName', label: 'Brand', required: true, placeholder: 'Visa' },
          { name: 'cardholderName', label: 'Cardholder', required: true },
          { name: 'last4Digits', label: 'Last 4', required: true, placeholder: '4242' },
          { name: 'expMonth', label: 'Exp month', kind: 'number', required: true },
          { name: 'expYear', label: 'Exp year', kind: 'number', required: true },
          { name: 'creditLimit', label: 'Credit limit', kind: 'number' },
          { name: 'minimumPaymentDue', label: 'Min payment', kind: 'number' },
          { name: 'nextPaymentDueDate', label: 'Next due date', kind: 'date' },
          {
            name: 'dataClassification',
            label: 'Classification',
            kind: 'select',
            default: 'business',
            options: [
              { value: 'business', label: 'Business' },
              { value: 'household_personal', label: 'Household / personal' },
            ],
          },
          {
            name: 'sellerAccountId',
            label: 'Link seller account',
            kind: 'select',
            options: sellerAccounts.map((s) => ({
              value: String(s.id),
              label: String(s.accountName ?? s.id),
            })),
          },
          {
            name: 'usagePurpose',
            label: 'Usage',
            kind: 'select',
            default: 'primary_billing',
            options: CARD_USAGE.map((u) => ({ value: u, label: u.replace(/_/g, ' ') })),
          },
        ]}
      />

      <FormModal
        isOpen={!!editCardRow}
        onOpenChange={(o) => {
          if (!o) setEditCardRow(null)
        }}
        title={`Edit card: ${String(editCardRow?.cardLabel ?? '')}`}
        submitLabel="Save card"
        action={editCardRow ? `/credit-cards/${editCardRow.id}` : '/credit-cards/placeholder'}
        initialValues={
          editCardRow
            ? {
                cardLabel: String(editCardRow.cardLabel ?? ''),
                creditLimit: String(editCardRow.creditLimit ?? 0),
                minimumPaymentDue: String(editCardRow.minimumPaymentDue ?? 0),
                nextPaymentDueDate: editCardRow.nextPaymentDueDate
                  ? String(editCardRow.nextPaymentDueDate).slice(0, 10)
                  : '',
                status: String(editCardRow.status ?? 'active'),
              }
            : undefined
        }
        fields={[
          { name: 'cardLabel', label: 'Card label' },
          { name: 'creditLimit', label: 'Credit limit', kind: 'number' },
          { name: 'minimumPaymentDue', label: 'Min payment', kind: 'number' },
          { name: 'nextPaymentDueDate', label: 'Next due date', kind: 'date' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: CARD_STATUS.map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      <FormModal
        isOpen={createTxOpen}
        onOpenChange={setCreateTxOpen}
        title="Record financial transaction"
        subtitle="Multi-currency ledger — never floats, always numeric(14,2)."
        submitLabel="Record transaction"
        action="/financial-transactions"
        fields={[
          { name: 'referenceNumber', label: 'Reference number', required: true },
          {
            name: 'transactionType',
            label: 'Type',
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
              { value: 'household_personal', label: 'Household / personal' },
            ],
          },
          { name: 'description', label: 'Description', required: true },
          { name: 'vendorOrPayer', label: 'Vendor / payer' },
          { name: 'originalCurrencyCode', label: 'Currency', default: 'USD' },
          { name: 'originalAmount', label: 'Amount', kind: 'number', required: true },
          { name: 'exchangeRate', label: 'Exchange rate', kind: 'number', default: '1' },
          { name: 'taxAmount', label: 'Tax', kind: 'number' },
          { name: 'transactionDate', label: 'Transaction date', kind: 'date', required: true },
          {
            name: 'financialAccountId',
            label: 'Financial account',
            kind: 'select',
            options: financialAccounts.map((a) => ({
              value: String(a.id),
              label: String(a.accountName),
            })),
          },
          {
            name: 'creditCardId',
            label: 'Credit card',
            kind: 'select',
            options: creditCards.map((c) => ({
              value: String(c.id),
              label: `${c.cardLabel} ··${c.last4Digits}`,
            })),
          },
          {
            name: 'sellerAccountId',
            label: 'Seller account',
            kind: 'select',
            options: sellerAccounts.map((s) => ({
              value: String(s.id),
              label: String(s.accountName ?? s.id),
            })),
          },
        ]}
      />

      <PageSection
        title="Financial accounts"
        description="Bank, cash and marketplace clearing accounts."
      >
        <ResponsiveDataView
          rows={financialAccounts}
          searchKeys={['accountName', 'institutionName']}
          filterKey="dataClassification"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'business', label: 'Business' },
            { value: 'household_personal', label: 'Household' },
          ]}
          createLabel="+ Account"
          onCreateClick={() => setCreateAccountOpen(true)}
          toCard={(row) => ({
            title: String(row.accountName),
            statusBadge: {
              label: String(row.accountType).replace(/_/g, ' '),
              variant: row.accountType === 'credit_card' ? 'info' : 'neutral',
            },
            metrics: [
              {
                label: 'Balance',
                value: money(String(row.currencyCode ?? 'USD'), row.currentBalance),
              },
              { label: 'Classification', value: String(row.dataClassification).replace(/_/g, ' ') },
              { label: 'Institution', value: String(row.institutionName ?? '—') },
            ],
            actions: (
              <Stack direction="horizontal" gap={2}>
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditAccountRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this financial account?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/financial-accounts/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            ),
          })}
          columns={[
            col.text('accountName', 'Name', 130),
            col.badge('accountType', 'Type', {
              credit_card: 'info',
              bank_checking: 'neutral',
              cash: 'success',
            }),
            col.money('currentBalance', 'Balance', 'currencyCode'),
            col.badge('dataClassification', 'Class', {
              business: 'info',
              household_personal: 'teal',
            }),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2}>
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditAccountRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this financial account?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/financial-accounts/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Credit cards (PCI-safe)"
        description="Last four digits only — no PAN, no CVV."
      >
        <ResponsiveDataView
          rows={creditCards}
          searchKeys={['cardLabel', 'last4Digits', 'brandName']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'frozen', label: 'Frozen' },
            { value: 'expired', label: 'Expired' },
          ]}
          createLabel="+ Card"
          onCreateClick={() => setCreateCardOpen(true)}
          toCard={(row) => ({
            title: `${row.cardLabel} ··${row.last4Digits}`,
            statusBadge: {
              label: String(row.status),
              variant:
                row.status === 'active'
                  ? 'success'
                  : row.status === 'frozen'
                    ? 'warning'
                    : 'neutral',
            },
            metrics: [
              { label: 'Limit', value: money(String(row.currencyCode ?? 'USD'), row.creditLimit) },
              {
                label: 'Min due',
                value: money(String(row.currencyCode ?? 'USD'), row.minimumPaymentDue),
              },
              {
                label: 'Due date',
                value: row.nextPaymentDueDate
                  ? new Date(String(row.nextPaymentDueDate)).toLocaleDateString()
                  : '—',
              },
            ],
            actions: (
              <Stack direction="horizontal" gap={2}>
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditCardRow(row)}
                />
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Remove this card?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/credit-cards/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            ),
          })}
          columns={[
            col.text('cardLabel', 'Label', 130),
            col.text('brandName', 'Brand', 80),
            col.text('last4Digits', 'Last 4', 65),
            col.money('creditLimit', 'Limit', 'currencyCode'),
            col.money('minimumPaymentDue', 'Min due', 'currencyCode'),
            col.badge('status', 'Status', {
              active: 'success',
              frozen: 'warning',
              expired: 'neutral',
              cancelled: 'error',
            }),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2}>
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditCardRow(row)}
                />
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Remove this card?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/credit-cards/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Financial ledger"
        description="Void incorrect entries — history stays intact."
      >
        <ResponsiveDataView
          rows={financialTransactions}
          searchKeys={['referenceNumber', 'description', 'vendorOrPayer']}
          filterKey="dataClassification"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'business', label: 'Business' },
            { value: 'household_personal', label: 'Household' },
          ]}
          createLabel="+ Transaction"
          onCreateClick={() => setCreateTxOpen(true)}
          toCard={(row) => ({
            title: String(row.referenceNumber),
            statusBadge: {
              label: String(row.transactionType).replace(/_/g, ' '),
              variant:
                row.transactionType === 'income'
                  ? 'success'
                  : row.transactionType === 'expense'
                    ? 'warning'
                    : 'info',
            },
            metrics: [
              {
                label: 'Amount',
                value: money(String(row.originalCurrencyCode), row.originalAmount),
              },
              {
                label: 'Reporting',
                value: money(String(row.reportingCurrencyCode), row.reportingAmount),
              },
              { label: 'Class', value: String(row.dataClassification).replace(/_/g, ' ') },
              {
                label: 'Date',
                value: row.transactionDate
                  ? new Date(String(row.transactionDate)).toLocaleDateString()
                  : '—',
              },
            ],
            actions:
              String(row.status) !== 'voided' ? (
                <Button
                  label="Void"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Void this transaction?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/financial-transactions/${row.id}/void`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              ) : (
                <Text type="supporting" as="span">
                  Voided
                </Text>
              ),
          })}
          columns={[
            col.text('referenceNumber', 'Reference', 130),
            col.badge('transactionType', 'Type', {
              income: 'success',
              expense: 'warning',
              transfer: 'info',
            }),
            col.badge('dataClassification', 'Class', {
              business: 'info',
              household_personal: 'teal',
            }),
            col.badge('status', 'Status', STATUS_TONES),
            col.money('originalAmount', 'Amount', 'originalCurrencyCode'),
            col.money('reportingAmount', 'Reporting', 'reportingCurrencyCode'),
            col.text('description', 'Description', 160),
            col.date('transactionDate', 'Date'),
            col.action('Action', (row) =>
              String(row.status) === 'voided' ? (
                <Text type="supporting" as="span">
                  Voided
                </Text>
              ) : (
                <Button
                  label="Void"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Void this transaction?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/financial-transactions/${row.id}/void`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              )
            ),
          ]}
        />
      </PageSection>

      <PageSection
        title="Finance categories"
        description="Income/expense categories with cost buckets."
      >
        <ResponsiveDataView
          rows={financeCategories}
          searchKeys={['name']}
          filterKey="categoryType"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]}
          toCard={(row) => ({
            title: String(row.name),
            statusBadge: {
              label: String(row.categoryType),
              variant: row.categoryType === 'income' ? 'success' : 'warning',
            },
            metrics: [
              { label: 'Cost bucket', value: String(row.costBucket ?? '—').replace(/_/g, ' ') },
              { label: 'Class', value: String(row.dataClassification ?? '—').replace(/_/g, ' ') },
            ],
          })}
          columns={[
            col.text('name', 'Name', 150),
            col.badge('categoryType', 'Type', { income: 'success', expense: 'warning' }),
            col.badge('costBucket', 'Cost bucket', {
              cogs: 'error',
              shipping: 'info',
              marketing: 'teal',
              operations: 'neutral',
            }),
            col.badge('dataClassification', 'Class', {
              business: 'info',
              household_personal: 'teal',
            }),
            col.text('isTaxDeductible', 'Tax deductible', 110),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
