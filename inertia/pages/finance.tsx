import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { CreditCard } from 'lucide-react'

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
const COST_BUCKETS = ['cogs', 'shipping', 'marketing', 'operations', 'taxes', 'other']

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
  const [createCatOpen, setCreateCatOpen] = useState(false)
  const [editCatRow, setEditCatRow] = useState<Row | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance, PCI-Safe Cards & Multi-Currency Ledger"
        description="Manage bank/clearing accounts, tokenized credit cards (last 4 digits only), and Business vs. Household ledger entries."
        icon={CreditCard}
        badge={`${financialAccounts.length} accounts · ${creditCards.length} cards · ${financialTransactions.length} tx`}
        actions={
          <>
            <Button
              label="+ Category"
              variant="ghost"
              size="sm"
              onClick={() => setCreateCatOpen(true)}
            />
            <Button
              label="+ Credit Card"
              variant="secondary"
              size="sm"
              onClick={() => setCreateCardOpen(true)}
            />
            <Button
              label="+ Financial Account"
              variant="secondary"
              size="sm"
              onClick={() => setCreateAccountOpen(true)}
            />
            <Button
              label="+ Record Transaction"
              variant="primary"
              size="sm"
              onClick={() => setCreateTxOpen(true)}
            />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Create Financial Account Modal */}
      <FormModal
        isOpen={createAccountOpen}
        onOpenChange={setCreateAccountOpen}
        title="Create Financial Account"
        subtitle="Bank checking, savings, cash, and marketplace clearing accounts."
        submitLabel="Create Account"
        action="/financial-accounts"
        fields={[
          { name: 'accountName', label: 'Account name', required: true },
          {
            name: 'accountType',
            label: 'Account type',
            kind: 'select',
            default: 'bank_checking',
            options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
          },
          { name: 'institutionName', label: 'Institution name' },
          { name: 'accountNumberLast4', label: 'Last 4 digits', placeholder: '4401' },
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

      {/* Edit Financial Account Modal */}
      <FormModal
        isOpen={!!editAccountRow}
        onOpenChange={(o) => {
          if (!o) setEditAccountRow(null)
        }}
        title={`Edit Account: ${String(editAccountRow?.accountName ?? '')}`}
        submitLabel="Save Account"
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
                isActive: String(editAccountRow.isActive ?? 'true'),
              }
            : undefined
        }
        fields={[
          { name: 'accountName', label: 'Account name', required: true },
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

      {/* Create Credit Card Modal */}
      <FormModal
        isOpen={createCardOpen}
        onOpenChange={setCreateCardOpen}
        title="Add Credit Card (PCI-Safe)"
        subtitle="Stores last 4 digits and vault token reference only — never full PAN or CVV."
        submitLabel="Add Card"
        action="/credit-cards"
        fields={[
          { name: 'cardLabel', label: 'Card label', required: true },
          { name: 'brandName', label: 'Brand (e.g. Visa, Amex)', required: true, placeholder: 'Visa' },
          { name: 'cardholderName', label: 'Cardholder name', required: true },
          { name: 'last4Digits', label: 'Last 4 digits', required: true, placeholder: '4242' },
          { name: 'expMonth', label: 'Exp month (1–12)', kind: 'number', required: true },
          { name: 'expYear', label: 'Exp year (e.g. 2028)', kind: 'number', required: true },
          { name: 'creditLimit', label: 'Credit limit', kind: 'number' },
          { name: 'minimumPaymentDue', label: 'Minimum payment due', kind: 'number' },
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
            label: 'Linked seller account',
            kind: 'select',
            options: sellerAccounts.map((s) => ({
              value: String(s.id),
              label: String(s.accountName ?? s.id),
            })),
          },
          {
            name: 'usagePurpose',
            label: 'Usage purpose',
            kind: 'select',
            default: 'primary_billing',
            options: CARD_USAGE.map((u) => ({ value: u, label: u.replace(/_/g, ' ') })),
          },
        ]}
      />

      {/* Edit Credit Card Modal */}
      <FormModal
        isOpen={!!editCardRow}
        onOpenChange={(o) => {
          if (!o) setEditCardRow(null)
        }}
        title={`Edit Card: ${String(editCardRow?.cardLabel ?? '')}`}
        submitLabel="Save Card"
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
          { name: 'cardLabel', label: 'Card label', required: true },
          { name: 'creditLimit', label: 'Credit limit', kind: 'number' },
          { name: 'minimumPaymentDue', label: 'Minimum payment due', kind: 'number' },
          { name: 'nextPaymentDueDate', label: 'Next due date', kind: 'date' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: CARD_STATUS.map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      {/* Record Financial Transaction Modal */}
      <FormModal
        isOpen={createTxOpen}
        onOpenChange={setCreateTxOpen}
        title="Record Financial Transaction"
        subtitle="Multi-currency ledger entry with Business vs. Household segregation."
        submitLabel="Record Transaction"
        action="/financial-transactions"
        fields={[
          { name: 'referenceNumber', label: 'Reference number', required: true },
          {
            name: 'transactionType',
            label: 'Transaction type',
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
          { name: 'vendorOrPayer', label: 'Vendor / Payer' },
          { name: 'originalCurrencyCode', label: 'Currency', default: 'USD' },
          { name: 'originalAmount', label: 'Amount', kind: 'number', required: true },
          { name: 'exchangeRate', label: 'Exchange rate to USD', kind: 'number', default: '1' },
          { name: 'taxAmount', label: 'Tax amount', kind: 'number' },
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
          {
            name: 'description',
            label: 'Description',
            required: true,
            fullWidth: true,
          },
        ]}
      />

      {/* Create Finance Category Modal */}
      <FormModal
        isOpen={createCatOpen}
        onOpenChange={setCreateCatOpen}
        title="Create Finance Category"
        subtitle="Classify income and expense cost buckets for P&L and tax reporting."
        submitLabel="Save Category"
        action="/finance-categories"
        fields={[
          { name: 'name', label: 'Category name', required: true },
          {
            name: 'categoryType',
            label: 'Category type',
            kind: 'select',
            default: 'expense',
            options: [
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ],
          },
          {
            name: 'costBucket',
            label: 'Cost bucket',
            kind: 'select',
            default: 'operations',
            options: COST_BUCKETS.map((b) => ({ value: b, label: b.replace(/_/g, ' ') })),
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
          {
            name: 'isTaxDeductible',
            label: 'Tax deductible',
            kind: 'select',
            default: 'true',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ],
          },
        ]}
      />

      {/* Edit Finance Category Modal */}
      <FormModal
        isOpen={!!editCatRow}
        onOpenChange={(o) => {
          if (!o) setEditCatRow(null)
        }}
        title={`Edit Finance Category: ${String(editCatRow?.name ?? '')}`}
        submitLabel="Update Category"
        action={editCatRow ? `/finance-categories/${editCatRow.id}` : '/finance-categories/placeholder'}
        initialValues={
          editCatRow
            ? {
                name: String(editCatRow.name ?? ''),
                categoryType: String(editCatRow.categoryType ?? 'expense'),
                costBucket: String(editCatRow.costBucket ?? 'operations'),
                dataClassification: String(editCatRow.dataClassification ?? 'business'),
                isTaxDeductible: String(editCatRow.isTaxDeductible ?? 'true'),
              }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Category name', required: true },
          {
            name: 'categoryType',
            label: 'Category type',
            kind: 'select',
            options: [
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ],
          },
          {
            name: 'costBucket',
            label: 'Cost bucket',
            kind: 'select',
            options: COST_BUCKETS.map((b) => ({ value: b, label: b.replace(/_/g, ' ') })),
          },
          {
            name: 'dataClassification',
            label: 'Classification',
            kind: 'select',
            options: [
              { value: 'business', label: 'Business' },
              { value: 'household_personal', label: 'Household / personal' },
            ],
          },
          {
            name: 'isTaxDeductible',
            label: 'Tax deductible',
            kind: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ],
          },
        ]}
      />

      <PageSection
        title="Financial Accounts"
        description="Bank, cash, and marketplace clearing accounts."
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
              <div className="flex items-center gap-2">
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
                    if (window.confirm(`Delete financial account "${row.accountName}"?`)) {
                      router.post(
                        `/financial-accounts/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                />
              </div>
            ),
          })}
          columns={[
            col.text('accountName', 'Name', 150),
            col.badge('accountType', 'Type', {
              credit_card: 'info',
              bank_checking: 'neutral',
              cash: 'success',
            }),
            col.money('currentBalance', 'Balance', 'currencyCode'),
            col.badge('dataClassification', 'Class', {
              business: 'info',
              household_personal: 'purple',
            }),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5">
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
                    if (window.confirm(`Delete financial account "${row.accountName}"?`)) {
                      router.post(
                        `/financial-accounts/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                />
              </div>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Credit Cards (PCI-Safe)"
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
              <div className="flex items-center gap-2">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditCardRow(row)}
                />
                <Button
                  label="Cancel Card"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Cancel credit card "${row.cardLabel}"?`)) {
                      router.post(`/credit-cards/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
            ),
          })}
          columns={[
            col.text('cardLabel', 'Label', 150),
            col.text('brandName', 'Brand', 90),
            col.text('last4Digits', 'Last 4', 70),
            col.money('creditLimit', 'Limit', 'currencyCode'),
            col.money('minimumPaymentDue', 'Min due', 'currencyCode'),
            col.badge('status', 'Status', {
              active: 'success',
              frozen: 'warning',
              expired: 'neutral',
              cancelled: 'error',
            }),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditCardRow(row)}
                />
                <Button
                  label="Cancel"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Cancel credit card "${row.cardLabel}"?`)) {
                      router.post(`/credit-cards/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Financial Ledger"
        description="Void incorrect entries — historical audit trail stays intact."
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
                    if (window.confirm(`Void transaction ${row.referenceNumber}?`)) {
                      router.post(
                        `/financial-transactions/${row.id}/void`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">Voided</span>
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
              household_personal: 'purple',
            }),
            col.badge('status', 'Status', STATUS_TONES),
            col.money('originalAmount', 'Amount', 'originalCurrencyCode'),
            col.money('reportingAmount', 'Reporting', 'reportingCurrencyCode'),
            col.text('description', 'Description', 160),
            col.date('transactionDate', 'Date'),
            col.action('Action', (row) =>
              String(row.status) === 'voided' ? (
                <span className="text-xs text-muted-foreground">Voided</span>
              ) : (
                <Button
                  label="Void"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Void transaction ${row.referenceNumber}?`)) {
                      router.post(
                        `/financial-transactions/${row.id}/void`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                />
              )
            ),
          ]}
        />
      </PageSection>

      <PageSection
        title="Finance Categories"
        description="Income and expense categories with cost buckets and tax deductibility."
      >
        <ResponsiveDataView
          rows={financeCategories}
          searchKeys={['name', 'costBucket']}
          filterKey="categoryType"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]}
          createLabel="+ Category"
          onCreateClick={() => setCreateCatOpen(true)}
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
            actions: (
              <div className="flex items-center gap-2">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditCatRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Delete finance category "${row.name}"?`)) {
                      router.post(
                        `/finance-categories/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                />
              </div>
            ),
          })}
          columns={[
            col.text('name', 'Name', 160),
            col.badge('categoryType', 'Type', { income: 'success', expense: 'warning' }),
            col.badge('costBucket', 'Cost bucket', {
              cogs: 'error',
              shipping: 'info',
              marketing: 'purple',
              operations: 'neutral',
            }),
            col.badge('dataClassification', 'Class', {
              business: 'info',
              household_personal: 'purple',
            }),
            col.text('isTaxDeductible', 'Tax deductible', 110),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditCatRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Delete finance category "${row.name}"?`)) {
                      router.post(
                        `/finance-categories/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                />
              </div>
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
