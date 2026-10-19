import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import { PageSection, DataTable, SmartForm, RowAction, StatusForm, col, type Row } from '~/lib/ui'

type Props = {
  customers: Row[]
  riskSignals: Row[]
}

Customers.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const RISK_LEVELS = ['low', 'medium', 'high', 'under_review', 'cleared']

export default function Customers({ customers, riskSignals }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Create customer"
        description="Customers are per-user. Shared addresses or proxy emails never auto-flag fraud — they only raise explainable risk signals for manual review."
      >
        <SmartForm
          action="/customers"
          submitLabel="Create customer"
          fields={[
            { name: 'fullName', label: 'Full name', required: true, width: 220 },
            { name: 'email', label: 'Email', kind: 'email', width: 220 },
            { name: 'proxyEmail', label: 'Proxy email', kind: 'email', width: 200 },
            { name: 'phone', label: 'Phone', width: 150 },
            {
              name: 'preferredCurrency',
              label: 'Currency',
              kind: 'select',
              width: 120,
              default: 'USD',
              options: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED'].map((c) => ({
                value: c,
                label: c,
              })),
            },
            {
              name: 'riskLevel',
              label: 'Risk level',
              kind: 'select',
              width: 150,
              default: 'low',
              options: RISK_LEVELS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
            },
            { name: 'line1', label: 'Address line 1', width: 220 },
            { name: 'city', label: 'City', width: 150 },
            { name: 'stateProvince', label: 'State', width: 130 },
            { name: 'postalCode', label: 'Postal code', width: 120 },
            { name: 'countryCode', label: 'Country', default: 'US', width: 90 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Merge duplicate customers"
        description="Non-destructive merge: the source customer is linked via merged_into_customer_id; orders keep both IDs in history."
      >
        <SmartForm
          action="/customers/merge"
          submitLabel="Merge customers"
          compact
          fields={[
            { name: 'sourceCustomerId', label: 'Source customer ID (absorbed)', required: true },
            { name: 'targetCustomerId', label: 'Target customer ID (survives)', required: true },
          ]}
        />
      </PageSection>

      <PageSection
        title="Customers"
        description="Edit risk level and details inline, or delete a customer you no longer need."
      >
        <DataTable
          rows={customers}
          empty="No customers yet."
          columns={[
            col.text('fullName', 'Name', 170),
            col.text('email', 'Email', 190),
            col.text('proxyEmail', 'Proxy email', 150),
            col.badge('riskLevel', 'Risk', {
              high: 'error',
              medium: 'warning',
              under_review: 'info',
              low: 'success',
              cleared: 'neutral',
            }),
            col.text('riskScore', 'Score', 70),
            col.text('ordersCount', 'Orders', 70),
            col.money('totalSpent', 'Lifetime spend', 'preferredCurrency'),
            col.text('isRepeatCustomer', 'Repeat', 80),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <StatusForm
                  action={`/customers/${row.id}`}
                  fieldName="riskLevel"
                  label="Risk level"
                  current={String(row.riskLevel ?? 'low')}
                  options={RISK_LEVELS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') }))}
                />
                <RowAction
                  action={`/customers/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this customer? Orders reference customers and may block deletion."
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Customer risk signals"
        description="Explainable signals (shared address mismatch, proxy email change, chargeback history…) reviewed manually — never automatic fraud labels."
      >
        <DataTable
          rows={riskSignals}
          empty="No risk signals raised."
          columns={[
            col.text('signalType', 'Signal', 170),
            col.badge('severity', 'Severity', {
              critical: 'error',
              high: 'error',
              medium: 'warning',
              low: 'neutral',
              info: 'info',
            }),
            col.badge('reviewStatus', 'Review', {
              pending_review: 'warning',
              investigating: 'info',
              confirmed_risk: 'error',
              false_positive: 'success',
              resolved: 'neutral',
            }),
            col.text('reason', 'Reason', 260),
            col.action('Review', (row) => (
              <StatusForm
                action={`/risk-signals/${row.id}/review`}
                fieldName="reviewStatus"
                label="Review status"
                current={String(row.reviewStatus ?? 'pending_review')}
                options={[
                  { value: 'pending_review', label: 'Pending review' },
                  { value: 'investigating', label: 'Investigating' },
                  { value: 'confirmed_risk', label: 'Confirmed risk' },
                  { value: 'false_positive', label: 'False positive' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Update customer details"
        description="Choose a customer, change any fields, and save — only fields you fill are changed."
      >
        <SmartForm
          action="/customers"
          actionFor={(v) => `/customers/${v.id}`}
          submitLabel="Update customer"
          fields={[
            {
              name: 'id',
              label: 'Customer',
              kind: 'select',
              required: true,
              width: 240,
              options: customers.map((c) => ({
                value: String(c.id),
                label: `${c.fullName} (${String(c.email ?? 'no email')})`,
              })),
            },
            { name: 'fullName', label: 'Full name', width: 200 },
            { name: 'email', label: 'Email', kind: 'email', width: 200 },
            { name: 'phone', label: 'Phone', width: 150 },
            {
              name: 'preferredCurrency',
              label: 'Currency',
              kind: 'select',
              width: 110,
              options: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED'].map((c) => ({
                value: c,
                label: c,
              })),
            },
            { name: 'notes', label: 'Notes', width: 220 },
          ]}
        />
      </PageSection>
    </Stack>
  )
}
