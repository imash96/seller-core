import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'

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

export default function Accounts({ sellerAccounts, salesChannels, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)

  return (
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button
            label="+ Connect Seller Account"
            variant="primary"
            onClick={() => setCreateOpen(true)}
          />
          <Text type="supporting" as="div">
            {sellerAccounts.length} connected accounts
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Connect seller account"
        subtitle="Credentials are AES-256-GCM encrypted at rest — plaintext API keys are never persisted."
        submitLabel="Connect account"
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
            label: 'Currency',
            kind: 'select',
            default: 'USD',
            options: ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED'].map((c) => ({
              value: c,
              label: c,
            })),
          },
          { name: 'rateLimitRpm', label: 'Rate limit / min', kind: 'number', default: '60' },
          { name: 'apiKey', label: 'API key (encrypted)', kind: 'password' },
          { name: 'apiSecret', label: 'API secret (encrypted)', kind: 'password' },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit seller account: ${String(editRow?.accountName ?? '')}`}
        submitLabel="Save account"
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
          { name: 'accountName', label: 'Account name' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: ACCOUNT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'healthStatus',
            label: 'Health',
            kind: 'select',
            options: HEALTH.map((s) => ({ value: s, label: s })),
          },
          { name: 'rateLimitRpm', label: 'Rate limit / min', kind: 'number' },
        ]}
      />

      <PageSection
        title="Seller accounts"
        description="Health, sync status and credential rotation per connected account."
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
              <Stack direction="horizontal" gap={2} wrap="wrap">
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
                    if (confirm('Disconnect this seller account?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/seller-accounts/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            ),
          })}
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
                    if (confirm('Disconnect this seller account?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/seller-accounts/${row.id}/delete`
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
    </Stack>
  )
}
