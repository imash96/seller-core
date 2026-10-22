import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Building2 } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Seller Accounts"
        description="Connect Amazon SP-API, eBay, Etsy, and Shopify stores with AES-256-GCM encrypted API credentials."
        icon={Building2}
        badge={`${sellerAccounts.length} connected accounts`}
        actions={
          <Button
            label="+ Connect Seller Account"
            variant="primary"
            onClick={() => setCreateOpen(true)}
          />
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Connect Seller Account"
        subtitle="Credentials are AES-256-GCM encrypted at rest — plaintext API keys are never persisted."
        submitLabel="Connect Account"
        action="/seller-accounts"
        fields={[
          {
            name: 'salesChannelId',
            label: 'Sales channel',
            kind: 'select',
            required: true,
            options: salesChannels.map((c) => ({ value: String(c.id), label: String(c.name) })),
          },
          { name: 'accountName', label: 'Account name', required: true },
          { name: 'externalSellerId', label: 'External seller ID', required: true },
          { name: 'marketplaceRegion', label: 'Region', default: 'US' },
          {
            name: 'defaultCurrency',
            label: 'Default currency',
            kind: 'select',
            default: 'USD',
            options: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR', 'AED'].map((c) => ({
              value: c,
              label: c,
            })),
          },
          { name: 'rateLimitRpm', label: 'Rate limit / min', kind: 'number', default: '60' },
          { name: 'apiKey', label: 'API key (encrypted at rest)', kind: 'password' },
          { name: 'apiSecret', label: 'API secret (encrypted at rest)', kind: 'password' },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit Seller Account: ${String(editRow?.accountName ?? '')}`}
        submitLabel="Save Account"
        action={editRow ? `/seller-accounts/${editRow.id}` : '/seller-accounts/placeholder'}
        initialValues={
          editRow
            ? {
                accountName: String(editRow.accountName ?? ''),
                status: String(editRow.status ?? 'active'),
                healthStatus: String(editRow.healthStatus ?? 'healthy'),
                rateLimitRpm: String(editRow.rateLimitRpm ?? 60),
              }
            : undefined
        }
        fields={[
          { name: 'accountName', label: 'Account name', required: true },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: ACCOUNT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'healthStatus',
            label: 'Health status',
            kind: 'select',
            options: HEALTH.map((s) => ({ value: s, label: s })),
          },
          { name: 'rateLimitRpm', label: 'Rate limit / min', kind: 'number' },
        ]}
      />

      <PageSection
        title="Connected Seller Accounts"
        description="Health, sync status, on-demand sync queue, and credential rotation per connected account."
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
          createLabel="+ Connect Account"
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  label="Sync Now"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.post(
                      '/import/sync-accounts',
                      { sellerAccountId: String(row.id) },
                      { preserveScroll: true }
                    )
                  }
                />
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <Button
                  label="Disconnect"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Disconnect seller account "${row.accountName}"?`)) {
                      router.post(`/seller-accounts/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Sync"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.post(
                      '/import/sync-accounts',
                      { sellerAccountId: String(row.id) },
                      { preserveScroll: true }
                    )
                  }
                />
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <Button
                  label="Disconnect"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Disconnect seller account "${row.accountName}"?`)) {
                      router.post(`/seller-accounts/${row.id}/delete`, {}, { preserveScroll: true })
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
