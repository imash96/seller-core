import { Stack } from '@astryxdesign/core/Stack'
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
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
} from 'lucide-react'

type Props = {
  sellerAccounts: Row[]
  salesChannels: Row[]
  brands: Row[]
  categories: Row[]
  orders: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
  savedViews?: Row[]
}

const ACCOUNT_STATUS = [
  'pending_setup',
  'active',
  'auth_expired',
  'rate_limited',
  'suspended',
  'disconnected',
]
const HEALTH = ['healthy', 'warning', 'critical', 'unknown']

export default function Accounts({ sellerAccounts, salesChannels, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)

  const stats = useMemo(() => {
    const activeCount = sellerAccounts.filter((a) => String(a.status) === 'active').length
    const healthyCount = sellerAccounts.filter((a) => String(a.healthStatus) === 'healthy').length
    const attentionCount = sellerAccounts.filter(
      (a) =>
        ['auth_expired', 'rate_limited', 'suspended'].includes(String(a.status)) ||
        ['warning', 'critical'].includes(String(a.healthStatus))
    ).length
    return { activeCount, healthyCount, attentionCount }
  }, [sellerAccounts])

  return (
    <Stack gap={6}>
      <PageHeader
        title="Marketplace Seller Accounts"
        description="Store account details and encrypted credentials. Marketplace connections and sync are not configured."
        icon={Building2}
        badge={`${sellerAccounts.length} saved accounts`}
        actions={
          <AppButton variant="primary" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
            Add Seller Account
          </AppButton>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'total-accounts',
            label: 'Saved Accounts',
            value: sellerAccounts.length,
            hint: `${salesChannels.length} sales channels`,
            icon: Building2,
            tone: 'primary',
          },
          {
            id: 'active-accounts',
            label: 'Accounts Marked Active',
            value: stats.activeCount,
            hint: 'External sync is not configured',
            icon: CheckCircle2,
            tone: 'success',
          },
          {
            id: 'healthy-accounts',
            label: 'Accounts Marked Healthy',
            value: stats.healthyCount,
            hint: 'AES-256-GCM encrypted at rest',
            icon: ShieldCheck,
            tone: 'info',
          },
          {
            id: 'attention-accounts',
            label: 'Needs Attention',
            value: stats.attentionCount,
            hint: 'Expired tokens or rate-limited',
            icon: AlertTriangle,
            tone: stats.attentionCount > 0 ? 'warning' : 'success',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Complete Add Seller Account Modal exposing all seller_accounts fields */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Seller Account"
        subtitle="Credentials are encrypted at rest. Saving does not verify or connect a marketplace."
        submitLabel="Save Account"
        action="/seller-accounts"
        fields={[
          {
            name: 'salesChannelId',
            label: 'Sales Channel',
            kind: 'select',
            required: true,
            options: salesChannels.map((c) => ({ value: String(c.id), label: String(c.name) })),
          },
          { name: 'accountName', label: 'Account Name', required: true },
          { name: 'externalSellerId', label: 'External Seller / Merchant ID', required: true },
          { name: 'marketplaceRegion', label: 'Marketplace Region', default: 'US' },
          {
            name: 'defaultCurrency',
            label: 'Default Currency',
            kind: 'select',
            default: 'USD',
            options: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR', 'AED'].map((c) => ({
              value: c,
              label: c,
            })),
          },
          {
            name: 'status',
            label: 'Initial Account Status',
            kind: 'select',
            default: 'active',
            options: ACCOUNT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'healthStatus',
            label: 'Health Status',
            kind: 'select',
            default: 'healthy',
            options: HEALTH.map((s) => ({ value: s, label: s })),
          },
          {
            name: 'rateLimitRpm',
            label: 'Rate Limit (requests / min)',
            kind: 'number',
            default: '60',
          },
          { name: 'tokenExpiresAt', label: 'OAuth Token Expiry Date', kind: 'date' },
          {
            name: 'apiKey',
            label: 'API Key / Client ID (AES-256-GCM encrypted)',
            kind: 'password',
          },
          {
            name: 'apiSecret',
            label: 'API Secret / Refresh Token (AES-256-GCM encrypted)',
            kind: 'password',
          },
        ]}
      />

      {/* Complete Edit Seller Account Modal */}
      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit Seller Account: ${String(editRow?.accountName ?? '')}`}
        subtitle="Update account metadata, region, currency, rate limits, health status, or rotate encrypted API credentials."
        submitLabel="Save Account"
        action={editRow ? `/seller-accounts/${editRow.id}` : '/seller-accounts/placeholder'}
        initialValues={
          editRow
            ? {
                accountName: String(editRow.accountName ?? ''),
                externalSellerId: String(editRow.externalSellerId ?? ''),
                marketplaceRegion: String(editRow.marketplaceRegion ?? 'US'),
                defaultCurrency: String(editRow.defaultCurrency ?? 'USD'),
                status: String(editRow.status ?? 'active'),
                healthStatus: String(editRow.healthStatus ?? 'healthy'),
                rateLimitRpm: String(editRow.rateLimitRpm ?? 60),
                tokenExpiresAt: editRow.tokenExpiresAt
                  ? String(editRow.tokenExpiresAt).slice(0, 10)
                  : '',
              }
            : undefined
        }
        fields={[
          { name: 'accountName', label: 'Account Name', required: true },
          { name: 'externalSellerId', label: 'External Seller ID' },
          { name: 'marketplaceRegion', label: 'Marketplace Region' },
          {
            name: 'defaultCurrency',
            label: 'Default Currency',
            kind: 'select',
            options: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR', 'AED'].map((c) => ({
              value: c,
              label: c,
            })),
          },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: ACCOUNT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'healthStatus',
            label: 'Health Status',
            kind: 'select',
            options: HEALTH.map((s) => ({ value: s, label: s })),
          },
          { name: 'rateLimitRpm', label: 'Rate Limit / min', kind: 'number' },
          { name: 'tokenExpiresAt', label: 'OAuth Token Expiry Date', kind: 'date' },
          {
            name: 'apiKey',
            label: 'Rotate API Key (leave blank to keep current)',
            kind: 'password',
          },
          {
            name: 'apiSecret',
            label: 'Rotate API Secret (leave blank to keep current)',
            kind: 'password',
          },
        ]}
      />

      <PageSection
        title="Saved Seller Accounts"
        description="Stored account details. Status does not verify a marketplace connection."
      >
        <ResponsiveDataView
          rows={sellerAccounts}
          searchKeys={['accountName', 'externalSellerId', 'marketplaceRegion']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'auth_expired', label: 'Auth expired' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          createLabel="+ Save Account"
          onCreateClick={() => setCreateOpen(true)}
          toCard={(row) => ({
            title: String(row.accountName),
            idBadge: String(row.externalSellerId ?? '').slice(0, 20),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant: STATUS_TONES[String(row.status)] ?? 'neutral',
            },
            metrics: [
              { label: 'Region', value: String(row.marketplaceRegion ?? '—') },
              { label: 'Health', value: String(row.healthStatus ?? '—') },
              { label: 'RPM', value: String(row.rateLimitRpm ?? '—') },
              { label: 'Credentials', value: String(row.encryptedCredentials ?? '—').slice(0, 20) },
            ],
            actions: (
              <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                <AppButton
                  variant="outline"
                  size="xs"
                  icon={RefreshCw}
                  disabled
                  onClick={() =>
                    router.post(
                      '/import/sync-accounts',
                      { sellerAccountId: String(row.id) },
                      { preserveScroll: true }
                    )
                  }
                >
                  Sync Now
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Disconnect seller account "${row.accountName}"?`)) {
                      router.post(`/seller-accounts/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Disconnect
                </AppButton>
              </Stack>
            ),
          })}
          columns={[
            col.text('accountName', 'Account', 170),
            col.text('externalSellerId', 'Seller ID', 130),
            col.text('marketplaceRegion', 'Region', 80),
            col.badge('status', 'Status', STATUS_TONES),
            col.badge('healthStatus', 'Health', STATUS_TONES),
            col.text('rateLimitRpm', 'RPM', 70),
            col.text('encryptedCredentials', 'Credentials', 170),
            col.date('lastSyncedAt', 'Last sync'),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" align="center" wrap="wrap" gap={1.5}>
                <AppButton
                  variant="outline"
                  size="xs"
                  icon={RefreshCw}
                  disabled
                  onClick={() =>
                    router.post(
                      '/import/sync-accounts',
                      { sellerAccountId: String(row.id) },
                      { preserveScroll: true }
                    )
                  }
                >
                  Sync
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm(`Disconnect seller account "${row.accountName}"?`)) {
                      router.post(`/seller-accounts/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Disconnect
                </AppButton>
              </Stack>
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
