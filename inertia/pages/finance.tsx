import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  DataTable,
  SmartForm,
  RowAction,
  StatusForm,
  col,
  STATUS_TONES,
  type Row,
} from '~/lib/ui'

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
}

Finance.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

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
}: Props) {
  return (
    <Stack gap={4}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 16,
        }}
      >
        <PageSection
          title="Financial accounts"
          description="Bank, cash and marketplace clearing accounts. Only account-number last-4 is ever stored."
        >
          <SmartForm
            action="/financial-accounts"
            submitLabel="Create account"
            fields={[
              { name: 'accountName', label: 'Account name', required: true, width: 180 },
              {
                name: 'accountType',
                label: 'Type',
                kind: 'select',
                default: 'bank_checking',
                width: 180,
                options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
              },
              { name: 'institutionName', label: 'Institution', width: 160 },
              {
                name: 'accountNumberLast4',
                label: 'Last 4 digits',
                width: 110,
                placeholder: '0000',
              },
              {
                name: 'dataClassification',
                label: 'Classification',
                kind: 'select',
                default: 'business',
                width: 170,
                options: [
                  { value: 'business', label: 'Business' },
                  { value: 'household_personal', label: 'Household / personal' },
                ],
              },
            ]}
          />
          <div style={{ height: 12 }} />
          <DataTable
            rows={financialAccounts}
            empty="No financial accounts."
            columns={[
              col.text('accountName', 'Name', 130),
              col.badge('accountType', 'Type', {
                credit_card: 'info',
                bank_checking: 'neutral',
                cash: 'success',
              }),
              col.money('currentBalance', 'Balance', 'currencyCode'),
              col.action('Actions', (row) => (
                <RowAction
                  action={`/financial-accounts/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this financial account?"
                />
              )),
            ]}
          />
          <div style={{ height: 12 }} />
          <SmartForm
            action="/financial-accounts"
            actionFor={(v) => `/financial-accounts/${v.id}`}
            submitLabel="Update account"
            compact
            fields={[
              {
                name: 'id',
                label: 'Account',
                kind: 'select',
                required: true,
                options: financialAccounts.map((a) => ({
                  value: String(a.id),
                  label: String(a.accountName),
                })),
              },
              { name: 'accountName', label: 'New name', width: '100%' },
              { name: 'currentBalance', label: 'New balance', kind: 'number', width: '100%' },
            ]}
          />
        </PageSection>

        <PageSection
          title="Credit cards (PCI-safe)"
          description="Last four digits only — no PAN, no CVV. Expiry validated by CHECK constraint."
        >
          <SmartForm
            action="/credit-cards"
            submitLabel="Add card"
            fields={[
              { name: 'cardLabel', label: 'Card label', required: true, width: 170 },
              {
                name: 'brandName',
                label: 'Brand',
                required: true,
                width: 120,
                placeholder: 'Visa',
              },
              { name: 'cardholderName', label: 'Cardholder', required: true, width: 160 },
              {
                name: 'last4Digits',
                label: 'Last 4',
                required: true,
                width: 90,
                placeholder: '4242',
              },
              { name: 'expMonth', label: 'Exp month', kind: 'number', required: true, width: 100 },
              { name: 'expYear', label: 'Exp year', kind: 'number', required: true, width: 100 },
              { name: 'creditLimit', label: 'Credit limit', kind: 'number', width: 120 },
              { name: 'minimumPaymentDue', label: 'Min payment', kind: 'number', width: 120 },
              { name: 'nextPaymentDueDate', label: 'Next due date', kind: 'date', width: 150 },
              {
                name: 'dataClassification',
                label: 'Classification',
                kind: 'select',
                default: 'business',
                width: 170,
                options: [
                  { value: 'business', label: 'Business' },
                  { value: 'household_personal', label: 'Household / personal' },
                ],
              },
              {
                name: 'sellerAccountId',
                label: 'Link seller account',
                kind: 'select',
                width: 190,
                options: sellerAccounts.map((s) => ({
                  value: String(s.id),
                  label: String(s.accountName ?? s.id),
                })),
              },
              {
                name: 'usagePurpose',
                label: 'Usage purpose',
                kind: 'select',
                width: 180,
                default: 'primary_billing',
                options: CARD_USAGE.map((u) => ({ value: u, label: u.replace(/_/g, ' ') })),
              },
            ]}
          />
          <div style={{ height: 12 }} />
          <DataTable
            rows={creditCards}
            empty="No credit cards on file."
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
                <Stack direction="horizontal" gap={2} wrap="wrap">
                  <StatusForm
                    action={`/credit-cards/${row.id}`}
                    fieldName="status"
                    label="Card status"
                    current={String(row.status ?? 'active')}
                    options={CARD_STATUS.map((s) => ({ value: s, label: s }))}
                  />
                  <RowAction
                    action={`/credit-cards/${row.id}/delete`}
                    label="Delete"
                    variant="ghost"
                    confirmText="Remove this card?"
                  />
                </Stack>
              )),
            ]}
          />
        </PageSection>
      </div>

      <PageSection
        title="Record financial transaction"
        description="Multi-currency ledger with explicit business vs household classification and numeric(14,2) precision — never floats."
      >
        <SmartForm
          action="/financial-transactions"
          submitLabel="Record transaction"
          fields={[
            { name: 'referenceNumber', label: 'Reference number', required: true, width: 170 },
            {
              name: 'transactionType',
              label: 'Type',
              kind: 'select',
              required: true,
              width: 200,
              options: TX_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
            },
            {
              name: 'dataClassification',
              label: 'Classification',
              kind: 'select',
              default: 'business',
              width: 180,
              options: [
                { value: 'business', label: 'Business' },
                { value: 'household_personal', label: 'Household / personal' },
              ],
            },
            { name: 'description', label: 'Description', required: true, width: 230 },
            { name: 'vendorOrPayer', label: 'Vendor / payer', width: 170 },
            { name: 'originalCurrencyCode', label: 'Currency', default: 'USD', width: 100 },
            { name: 'originalAmount', label: 'Amount', kind: 'number', required: true, width: 120 },
            {
              name: 'exchangeRate',
              label: 'Exchange rate',
              kind: 'number',
              default: '1',
              width: 130,
            },
            { name: 'taxAmount', label: 'Tax', kind: 'number', width: 90 },
            {
              name: 'transactionDate',
              label: 'Transaction date',
              kind: 'date',
              required: true,
              width: 160,
            },
            {
              name: 'financialAccountId',
              label: 'Financial account',
              kind: 'select',
              width: 190,
              options: financialAccounts.map((a) => ({
                value: String(a.id),
                label: String(a.accountName),
              })),
            },
            {
              name: 'creditCardId',
              label: 'Credit card',
              kind: 'select',
              width: 160,
              options: creditCards.map((c) => ({
                value: String(c.id),
                label: `${c.cardLabel} ··${c.last4Digits}`,
              })),
            },
            {
              name: 'sellerAccountId',
              label: 'Seller account',
              kind: 'select',
              width: 180,
              options: sellerAccounts.map((s) => ({
                value: String(s.id),
                label: String(s.accountName ?? s.id),
              })),
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Financial ledger"
        description="Void incorrect entries instead of deleting them — history stays intact."
      >
        <DataTable
          rows={financialTransactions}
          empty="No transactions recorded."
          columns={[
            col.text('referenceNumber', 'Reference', 140),
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
            col.text('description', 'Description', 200),
            col.date('transactionDate', 'Date'),
            col.action('Action', (row) =>
              String(row.status) === 'voided' ? (
                <span style={{ fontSize: 12, opacity: 0.7 }}>Voided</span>
              ) : (
                <RowAction
                  action={`/financial-transactions/${row.id}/void`}
                  label="Void"
                  variant="ghost"
                  confirmText="Void this transaction?"
                />
              )
            ),
          ]}
        />
      </PageSection>

      <PageSection
        title="Finance categories"
        description="Income/expense categories with cost buckets (COGS, shipping, marketing…)."
      >
        <DataTable
          rows={financeCategories}
          empty="No finance categories."
          columns={[
            col.text('name', 'Name', 150),
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
          ]}
        />
      </PageSection>
    </Stack>
  )
}
