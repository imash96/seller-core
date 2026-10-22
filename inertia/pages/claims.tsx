import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  money,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { Scale } from 'lucide-react'

type Props = {
  claims: Row[]
  orders: Row[]
  sellerAccounts: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
  savedViews?: Row[]
}

const CLAIM_STATUS = [
  'opened',
  'under_review',
  'action_required',
  'seller_funded',
  'marketplace_funded',
  'won',
  'lost',
  'appealed',
  'closed',
]
const CLAIM_TYPES = [
  'a_to_z_guarantee',
  'chargeback',
  'item_not_received',
  'unauthorized_payment',
  'not_as_described',
  'other',
]

export default function Claims({ claims, orders, sellerAccounts, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Claims & Chargebacks"
        description="Track A-to-z Guarantee claims, INR disputes, and payment chargebacks with seller-liability exposure and response deadlines."
        icon={Scale}
        badge={`${claims.length} claims tracked`}
        actions={
          <Button label="+ Open Claim" variant="primary" onClick={() => setCreateOpen(true)} />
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Open Marketplace Claim"
        subtitle="A-to-z, chargebacks, and INR disputes with seller-liability and response deadlines."
        submitLabel="Open Claim"
        action="/claims"
        fields={[
          {
            name: 'orderId',
            label: 'Order',
            kind: 'select',
            required: true,
            options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
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
          { name: 'claimNumber', label: 'Claim number', required: true },
          {
            name: 'claimType',
            label: 'Claim type',
            kind: 'select',
            required: true,
            options: CLAIM_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
          },
          { name: 'disputedAmount', label: 'Disputed amount', kind: 'number' },
          { name: 'sellerLiabilityAmount', label: 'Seller liability amount', kind: 'number' },
          { name: 'respondByAt', label: 'Respond by date', kind: 'date' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            default: 'under_review',
            options: CLAIM_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          { name: 'reason', label: 'Claim reason / evidence notes', kind: 'textarea', fullWidth: true },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Update Claim ${String(editRow?.claimNumber ?? '')}`}
        subtitle="Edit seller liability exposure, claim status, and resolution notes."
        submitLabel="Update Claim"
        action={editRow ? `/claims/${editRow.id}/status` : '/claims/placeholder/status'}
        initialValues={
          editRow
            ? {
                status: String(editRow.status ?? 'under_review'),
                sellerLiabilityAmount: String(editRow.sellerLiabilityAmount ?? '0.00'),
                resolutionNotes: String(editRow.reason ?? ''),
                respondByAt: editRow.respondByAt ? String(editRow.respondByAt).slice(0, 10) : '',
              }
            : undefined
        }
        fields={[
          {
            name: 'status',
            label: 'Claim status',
            kind: 'select',
            required: true,
            options: CLAIM_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          { name: 'sellerLiabilityAmount', label: 'Seller liability amount', kind: 'number' },
          { name: 'respondByAt', label: 'Respond by date', kind: 'date' },
          {
            name: 'resolutionNotes',
            label: 'Resolution notes',
            kind: 'textarea',
            fullWidth: true,
          },
        ]}
      />

      <PageSection
        title="Marketplace Claims"
        description="Work each claim through the marketplace dispute lifecycle before the respond-by deadline."
      >
        <ResponsiveDataView
          rows={claims}
          searchKeys={['claimNumber', 'claimType', 'status']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'opened', label: 'Opened' },
            { value: 'under_review', label: 'Under review' },
            { value: 'won', label: 'Won' },
            { value: 'lost', label: 'Lost' },
          ]}
          createLabel="+ Open Claim"
          onCreateClick={() => setCreateOpen(true)}
          toCard={(row) => ({
            title: String(row.claimNumber),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant:
                row.status === 'won'
                  ? 'success'
                  : row.status === 'lost'
                    ? 'error'
                    : row.status === 'action_required'
                      ? 'warning'
                      : 'info',
            },
            metrics: [
              { label: 'Type', value: String(row.claimType).replace(/_/g, ' ') },
              {
                label: 'Disputed',
                value: money(String(row.currencyCode ?? 'USD'), row.disputedAmount),
              },
              {
                label: 'Liability',
                value: money(String(row.currencyCode ?? 'USD'), row.sellerLiabilityAmount),
              },
              {
                label: 'Respond by',
                value: row.respondByAt
                  ? new Date(String(row.respondByAt)).toLocaleDateString()
                  : '—',
              },
            ],
            actions: (
              <Button
                label="Update"
                variant="secondary"
                size="sm"
                onClick={() => setEditRow(row)}
              />
            ),
          })}
          columns={[
            col.text('claimNumber', 'Claim #', 130),
            col.text('claimType', 'Type', 150),
            col.badge('status', 'Status', {
              won: 'success',
              lost: 'error',
              action_required: 'warning',
              opened: 'info',
              under_review: 'info',
              closed: 'neutral',
              seller_funded: 'warning',
              marketplace_funded: 'info',
              appealed: 'warning',
            }),
            col.money('disputedAmount', 'Disputed', 'currencyCode'),
            col.money('sellerLiabilityAmount', 'Liability', 'currencyCode'),
            col.date('respondByAt', 'Respond by'),
            col.action('Actions', (row) => (
              <Button
                label="Update"
                variant="secondary"
                size="sm"
                onClick={() => setEditRow(row)}
              />
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
