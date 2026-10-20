import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import { PageSection, DataTable, SmartForm, RowAction, StatusForm, col, type Row } from '~/lib/ui'

type Props = {
  sellerAccounts: Row[]
  salesChannels: Row[]
  brands: Row[]
  categories: Row[]
  orders: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
}

Accounts.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const ACCOUNT_STATUS = [
  'pending_setup',
  'active',
  'auth_expired',
  'rate_limited',
  'suspended',
  'disconnected',
]
const HEALTH = ['healthy', 'warning', 'critical', 'unknown']

export default function Accounts({ sellerAccounts, salesChannels }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Connect seller account"
        description="Credentials are AES-256-GCM encrypted at rest via a dedicated keyring — plaintext API keys are never persisted."
      >
        <SmartForm
          action="/seller-accounts"
          submitLabel="Connect account"
          fields={[
            {
              name: 'salesChannelId',
              label: 'Sales channel',
              kind: 'select',
              required: true,
              width: 200,
              options: salesChannels.map((c) => ({ value: String(c.id), label: String(c.name) })),
            },
            { name: 'accountName', label: 'Account name', required: true, width: 200 },
            { name: 'externalSellerId', label: 'External seller ID', required: true, width: 180 },
            { name: 'marketplaceRegion', label: 'Region', default: 'US', width: 100 },
            {
              name: 'defaultCurrency',
              label: 'Currency',
              kind: 'select',
              default: 'USD',
              width: 110,
              options: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED'].map((c) => ({
                value: c,
                label: c,
              })),
            },
            {
              name: 'rateLimitRpm',
              label: 'Rate limit / min',
              kind: 'number',
              default: '60',
              width: 130,
            },
            { name: 'apiKey', label: 'API key (encrypted)', kind: 'password', width: 200 },
            { name: 'apiSecret', label: 'API secret (encrypted)', kind: 'password', width: 200 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Seller accounts"
        description="Health, sync status and credential rotation per connected account."
      >
        <DataTable
          rows={sellerAccounts}
          empty="No seller accounts connected yet."
          columns={[
            col.text('accountName', 'Account', 170),
            col.text('externalSellerId', 'Seller ID', 130),
            col.text('marketplaceRegion', 'Region', 80),
            col.badge('status', 'Status', {
              active: 'success',
              pending_setup: 'warning',
              auth_expired: 'error',
              rate_limited: 'warning',
              suspended: 'error',
              disconnected: 'neutral',
            }),
            col.badge('healthStatus', 'Health', {
              healthy: 'success',
              warning: 'warning',
              critical: 'error',
              unknown: 'neutral',
            }),
            col.text('rateLimitRpm', 'RPM', 70),
            col.text('encryptedCredentials', 'Credentials', 170),
            col.date('lastSyncedAt', 'Last sync'),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <StatusForm
                  action={`/seller-accounts/${row.id}`}
                  fieldName="status"
                  label="Status"
                  current={String(row.status ?? 'active')}
                  options={ACCOUNT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                />
                <StatusForm
                  action={`/seller-accounts/${row.id}`}
                  fieldName="healthStatus"
                  label="Health"
                  current={String(row.healthStatus ?? 'healthy')}
                  options={HEALTH.map((s) => ({ value: s, label: s }))}
                />
                <RowAction
                  action={`/seller-accounts/${row.id}/delete`}
                  label="Disconnect"
                  variant="ghost"
                  confirmText="Disconnect and remove this seller account?"
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection title="Update account details">
        <SmartForm
          action="/seller-accounts"
          actionFor={(v) => `/seller-accounts/${v.id}`}
          submitLabel="Update account"
          fields={[
            {
              name: 'id',
              label: 'Seller account',
              kind: 'select',
              required: true,
              width: 230,
              options: sellerAccounts.map((s) => ({
                value: String(s.id),
                label: String(s.accountName ?? s.id),
              })),
            },
            { name: 'accountName', label: 'New account name', width: 200 },
            { name: 'rateLimitRpm', label: 'Rate limit / min', kind: 'number', width: 140 },
          ]}
        />
      </PageSection>
    </Stack>
  )
}
