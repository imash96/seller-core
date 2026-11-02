import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  TopStatusBar,
  AppButton,
  col,
  STATUS_TONES,
  money,
  moneyAmountString,
  moneyCurrencyCode,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  CreditCard,
  Landmark,
  DollarSign,
  FolderKanban,
  Plus,
  Edit3,
  Trash2,
  Ban,
  FileBarChart,
} from 'lucide-react'
import {
  CreateAccountModal,
  EditAccountModal,
  CreateCreditCardModal,
  EditCreditCardModal,
  CreateTransactionModal,
} from '~/modules/finance/index'

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
  financeAccess: {
    household: { read: boolean; create: boolean; update: boolean; delete: boolean }
    creditCardsRead: boolean
    creditCardsCreate: boolean
    canReconcile: boolean
  }
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
const COST_BUCKETS = [
  'cogs',
  'shipping',
  'marketplace_fee',
  'marketing',
  'software',
  'operations',
  'manufacturing',
  'tax',
  'personal',
  'other_income',
  'sales_revenue',
]

export default function Finance({
  financialAccounts,
  creditCards,
  financialTransactions,
  financeCategories,
  sellerAccounts,
  orders,
  savedViews,
  financeAccess,
}: Props) {
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [editAccountRow, setEditAccountRow] = useState<Row | null>(null)
  const [createCardOpen, setCreateCardOpen] = useState(false)
  const [editCardRow, setEditCardRow] = useState<Row | null>(null)
  const [createTxOpen, setCreateTxOpen] = useState(false)
  const [createCatOpen, setCreateCatOpen] = useState(false)
  const [editCatRow, setEditCatRow] = useState<Row | null>(null)
  const [matchRow, setMatchRow] = useState<Row | null>(null)
  const [reverseRow, setReverseRow] = useState<Row | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const stats = useMemo(() => {
    const totalBalances = financialAccounts
      .filter((a) => a.currencyCode === 'USD')
      .reduce((acc, a) => acc + Number(a.currentBalance ?? 0), 0)
    const totalCardLimit = creditCards
      .filter((c) => c.currencyCode === 'USD')
      .reduce((acc, c) => acc + Number(c.creditLimit ?? 0), 0)
    const businessTxTotal = financialTransactions
      .filter(
        (t) =>
          t.dataClassification === 'business' &&
          t.status !== 'voided' &&
          t.reportingCurrencyCode === 'USD'
      )
      .reduce((acc, t) => acc + Number(t.reportingAmount ?? t.originalAmount ?? 0), 0)
    return { totalBalances, totalCardLimit, businessTxTotal }
  }, [financialAccounts, creditCards, financialTransactions])

  const ledgerActions = (row: Row) => {
    const permitted =
      financeAccess.canReconcile &&
      (row.dataClassification !== 'household_personal' || financeAccess.household.update)
    if (!permitted) return <Text type="supporting">Read only</Text>
    if (row.status === 'reconciled')
      return row.manualReconciliation ? (
        <AppButton variant="secondary" size="xs" onClick={() => setReverseRow(row)}>
          Reverse match
        </AppButton>
      ) : (
        <Text type="supporting">Legacy match</Text>
      )
    if (row.status === 'voided') return <Text type="supporting">Voided</Text>
    return (
      <HStack gap={2} wrap="wrap">
        {['posted', 'settled'].includes(String(row.status)) && (
          <AppButton variant="secondary" size="xs" onClick={() => setMatchRow(row)}>
            Match
          </AppButton>
        )}
        <AppButton
          variant="ghost"
          size="xs"
          icon={Ban}
          onClick={() => {
            if (window.confirm(`Void transaction ${row.referenceNumber}?`))
              router.post(`/financial-transactions/${row.id}/void`, {}, { preserveScroll: true })
          }}
        >
          Void
        </AppButton>
      </HStack>
    )
  }

  return (
    <Stack gap={6}>
      <PageHeader
        title="Finance & Multi-Currency Ledger"
        description="Manage accounts, card metadata and local ledger entries. No payment or card-vault integration is connected."
        icon={CreditCard}
        badge={`${financialAccounts.length} accounts · ${creditCards.length} cards · ${financialTransactions.length} tx`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <AppButton
              variant="outline"
              size="sm"
              icon={FolderKanban}
              onClick={() => setCreateCatOpen(true)}
            >
              Category
            </AppButton>
            {financeAccess.creditCardsCreate && (
              <AppButton
                variant="secondary"
                size="sm"
                icon={CreditCard}
                onClick={() => setCreateCardOpen(true)}
              >
                Credit Card
              </AppButton>
            )}
            <AppButton
              variant="secondary"
              size="sm"
              icon={Landmark}
              onClick={() => setCreateAccountOpen(true)}
            >
              Financial Account
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              icon={FileBarChart}
              onClick={() => setReportOpen(true)}
            >
              Report
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateTxOpen(true)}
            >
              Record Transaction
            </AppButton>
          </Stack>
        }
      />

      {(!financeAccess.household.read || !financeAccess.creditCardsRead) && (
        <Text type="supporting" as="p">
          Some finance data is restricted by your permissions and is not included in these totals.
        </Text>
      )}
      <Text type="supporting" as="p">
        Summaries show USD records only; the ledger is limited to the 100 most recent entries.
        Ledger postings do not move or reconcile money.
      </Text>
      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'account-balances',
            label: 'Financial Account Balances',
            value: money('USD', stats.totalBalances),
            hint: 'USD accounts only',
            icon: Landmark,
            tone: 'primary',
          },
          {
            id: 'pci-cards',
            label: 'Registered Credit Cards',
            value: creditCards.length,
            hint: financeAccess.creditCardsRead
              ? `USD limit: ${money('USD', stats.totalCardLimit)}`
              : 'Card data restricted',
            icon: CreditCard,
            tone: 'info',
          },
          {
            id: 'business-ledger',
            label: 'Business Ledger Volume',
            value: money('USD', stats.businessTxTotal),
            hint: 'Latest entries reporting in USD',
            icon: DollarSign,
            tone: 'success',
          },
          {
            id: 'finance-categories',
            label: 'Finance Cost Buckets',
            value: financeCategories.length,
            hint: 'Tax-deductible P&L categories',
            icon: FolderKanban,
            tone: 'warning',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      <FormModal
        isOpen={reportOpen}
        onOpenChange={setReportOpen}
        title="Queue Finance Report"
        subtitle="Aggregates the ledger by currency for the selected period and drops the summary into your notifications."
        submitLabel="Queue Report"
        action="/finance/reports"
        fields={[
          { name: 'periodStart', label: 'Period Start', kind: 'date', required: true },
          { name: 'periodEnd', label: 'Period End', kind: 'date', required: true },
        ]}
        onSuccess={() => setReportOpen(false)}
      />

      <CreateAccountModal
        isOpen={createAccountOpen}
        onOpenChange={setCreateAccountOpen}
        householdCreateAccess={financeAccess.household.create}
      />

      <EditAccountModal
        account={editAccountRow}
        onClose={() => setEditAccountRow(null)}
        householdUpdateAccess={financeAccess.household.update}
      />

      <CreateCreditCardModal
        isOpen={createCardOpen}
        onOpenChange={setCreateCardOpen}
        householdCreateAccess={financeAccess.household.create}
        sellerAccounts={sellerAccounts}
      />

      <EditCreditCardModal card={editCardRow} onClose={() => setEditCardRow(null)} />

      <CreateTransactionModal
        isOpen={createTxOpen}
        onOpenChange={setCreateTxOpen}
        householdCreateAccess={financeAccess.household.create}
        financialAccounts={financialAccounts}
        creditCards={creditCards}
        financeCategories={financeCategories}
        sellerAccounts={sellerAccounts}
        orders={orders}
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
              ...(financeAccess.household.create
                ? [{ value: 'household_personal', label: 'Household / personal' }]
                : []),
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
        action={
          editCatRow ? `/finance-categories/${editCatRow.id}` : '/finance-categories/placeholder'
        }
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
              ...(financeAccess.household.update
                ? [{ value: 'household_personal', label: 'Household / personal' }]
                : []),
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
              <Stack direction="horizontal" align="center" gap={2}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditAccountRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Delete financial account "${row.accountName}"?`)) {
                      router.post(
                        `/financial-accounts/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
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
              <Stack direction="horizontal" align="center" gap={1.5}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditAccountRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Delete financial account "${row.accountName}"?`)) {
                      router.post(
                        `/financial-accounts/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
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
              <Stack direction="horizontal" align="center" gap={2}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditCardRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Ban}
                  onClick={() => {
                    if (window.confirm(`Cancel credit card "${row.cardLabel}"?`)) {
                      router.post(`/credit-cards/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Cancel Card
                </AppButton>
              </Stack>
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
              <Stack direction="horizontal" align="center" gap={1.5}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditCardRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Ban}
                  onClick={() => {
                    if (window.confirm(`Cancel credit card "${row.cardLabel}"?`)) {
                      router.post(`/credit-cards/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Cancel
                </AppButton>
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Financial Ledger"
        description="Manually match a posted entry to a statement reference. This is not automatic bank verification or a payment transfer."
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
            actions: ledgerActions(row),
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
            col.action('Action', ledgerActions),
          ]}
        />
      </PageSection>

      <FormModal
        isOpen={!!matchRow}
        onOpenChange={(open) => {
          if (!open) setMatchRow(null)
        }}
        title={`Manual match: ${String(matchRow?.referenceNumber ?? '')}`}
        subtitle="Manually verify the statement yourself. Amount and currency must match exactly; this does not contact a bank or payment provider."
        submitLabel="Record manual match"
        action={
          matchRow
            ? `/financial-transactions/${matchRow.id}/reconcile`
            : '/financial-transactions/placeholder/reconcile'
        }
        initialValues={
          matchRow
            ? {
                observedAmount: moneyAmountString(matchRow.originalAmount),
                observedAmount__currency: moneyCurrencyCode(matchRow.originalAmount),
              }
            : undefined
        }
        fields={[
          {
            name: 'sourceReference',
            label: 'Statement reference',
            required: true,
            description: 'Must be unique among active matches in this workspace.',
          },
          { name: 'observedAmount', label: 'Statement amount', kind: 'money', required: true },
          { name: 'notes', label: 'Verification notes', kind: 'textarea' },
        ]}
      />
      <FormModal
        isOpen={!!reverseRow}
        onOpenChange={(open) => {
          if (!open) setReverseRow(null)
        }}
        title={`Reverse manual match: ${String(reverseRow?.referenceNumber ?? '')}`}
        subtitle="The match history is retained. The ledger entry returns to its prior status."
        submitLabel="Reverse match"
        action={
          reverseRow
            ? `/financial-transactions/${reverseRow.id}/reconciliation/reverse`
            : '/financial-transactions/placeholder/reconciliation/reverse'
        }
        fields={[
          { name: 'reason', label: 'Reason for reversal', kind: 'textarea', required: true },
        ]}
      />

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
              <Stack direction="horizontal" align="center" gap={2}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditCatRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Delete finance category "${row.name}"?`)) {
                      router.post(
                        `/finance-categories/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
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
              <Stack direction="horizontal" align="center" gap={1.5}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditCatRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Delete finance category "${row.name}"?`)) {
                      router.post(
                        `/finance-categories/${row.id}/delete`,
                        {},
                        { preserveScroll: true }
                      )
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
