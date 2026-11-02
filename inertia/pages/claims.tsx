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
  money,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  Scale,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Plus,
  Edit3,
} from 'lucide-react'

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

  const stats = useMemo(() => {
    const openCount = claims.filter((c) =>
      ['opened', 'under_review', 'action_required', 'appealed'].includes(String(c.status))
    ).length
    const wonCount = claims.filter((c) =>
      ['won', 'marketplace_funded'].includes(String(c.status))
    ).length
    const disputedTotal = claims.reduce((acc, c) => acc + Number(c.disputedAmount ?? 0), 0)
    const liabilityTotal = claims.reduce((acc, c) => acc + Number(c.sellerLiabilityAmount ?? 0), 0)
    return { openCount, wonCount, disputedTotal, liabilityTotal }
  }, [claims])

  return (
    <Stack gap={6}>
      <PageHeader
        title="Marketplace Claims & Chargebacks"
        description="Track A-to-z Guarantee claims, INR disputes, and payment chargebacks with seller-liability exposure and response deadlines."
        icon={Scale}
        badge={`${claims.length} claims tracked`}
        actions={
          <AppButton variant="primary" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
            Open Claim
          </AppButton>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'active-claims',
            label: 'Active / Under Review',
            value: stats.openCount,
            hint: `${claims.length} total claims`,
            icon: AlertTriangle,
            tone: stats.openCount > 0 ? 'warning' : 'success',
          },
          {
            id: 'disputed-amount',
            label: 'Total Disputed Volume',
            value: money('USD', stats.disputedTotal),
            hint: 'Across all open & historical claims',
            icon: DollarSign,
            tone: 'info',
          },
          {
            id: 'seller-liability',
            label: 'Seller Liability Exposure',
            value: money('USD', stats.liabilityTotal),
            hint: 'Direct financial exposure',
            icon: ShieldAlert,
            tone: stats.liabilityTotal > 0 ? 'error' : 'success',
          },
          {
            id: 'claims-won',
            label: 'Won / Marketplace Funded',
            value: stats.wonCount,
            hint: 'Protected seller metrics',
            icon: CheckCircle2,
            tone: 'success',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Complete Create Claim Modal exposing all marketplace_claims fields */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Open Marketplace Claim"
        subtitle="A-to-z Guarantee, chargebacks, and INR disputes with seller-liability exposure and response deadlines."
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
            label: 'Seller Account',
            kind: 'select',
            options: sellerAccounts.map((s) => ({
              value: String(s.id),
              label: String(s.accountName ?? s.id),
            })),
          },
          {
            name: 'claimNumber',
            label: 'Internal Claim Number',
            required: true,
            placeholder: 'CLM-2026-001',
          },
          {
            name: 'externalClaimId',
            label: 'External Marketplace Claim ID',
            placeholder: 'AMZ-AZ-99201',
          },
          {
            name: 'claimType',
            label: 'Claim Type',
            kind: 'select',
            required: true,
            options: CLAIM_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
          },
          {
            name: 'status',
            label: 'Claim Status',
            kind: 'select',
            default: 'under_review',
            options: CLAIM_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          { name: 'disputedAmount', label: 'Disputed Amount', kind: 'money' },
          { name: 'sellerLiabilityAmount', label: 'Seller Liability Amount', kind: 'money' },
          { name: 'openedAt', label: 'Opened Date', kind: 'date' },
          { name: 'respondByAt', label: 'Respond By Deadline', kind: 'date' },
          { name: 'resolvedAt', label: 'Resolved Date (if closed)', kind: 'date' },
          {
            name: 'reason',
            label: 'Buyer Claim Reason',
            kind: 'textarea',
            fullWidth: true,
          },
          {
            name: 'resolutionNotes',
            label: 'Seller Evidence & Resolution Notes',
            kind: 'textarea',
            fullWidth: true,
          },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Update Claim ${String(editRow?.claimNumber ?? '')}`}
        subtitle="Edit seller liability exposure, claim status, deadlines, and resolution evidence."
        submitLabel="Update Claim"
        action={editRow ? `/claims/${editRow.id}/status` : '/claims/placeholder/status'}
        initialValues={
          editRow
            ? {
                status: String(editRow.status ?? 'under_review'),
                claimType: String(editRow.claimType ?? 'a_to_z_guarantee'),
                externalClaimId: String(editRow.externalClaimId ?? ''),
                disputedAmount: String(editRow.disputedAmount ?? '0.00'),
                sellerLiabilityAmount: String(editRow.sellerLiabilityAmount ?? '0.00'),
                respondByAt: editRow.respondByAt ? String(editRow.respondByAt).slice(0, 10) : '',
                resolvedAt: editRow.resolvedAt ? String(editRow.resolvedAt).slice(0, 10) : '',
                reason: String(editRow.reason ?? ''),
                resolutionNotes: String(editRow.resolutionNotes ?? editRow.reason ?? ''),
              }
            : undefined
        }
        fields={[
          {
            name: 'status',
            label: 'Claim Status',
            kind: 'select',
            required: true,
            options: CLAIM_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'claimType',
            label: 'Claim Type',
            kind: 'select',
            options: CLAIM_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
          },
          { name: 'externalClaimId', label: 'External Marketplace Claim ID' },
          { name: 'disputedAmount', label: 'Disputed Amount', kind: 'money' },
          { name: 'sellerLiabilityAmount', label: 'Seller Liability Amount', kind: 'money' },
          { name: 'respondByAt', label: 'Respond By Date', kind: 'date' },
          { name: 'resolvedAt', label: 'Resolved Date', kind: 'date' },
          { name: 'reason', label: 'Claim Reason', kind: 'textarea', fullWidth: true },
          {
            name: 'resolutionNotes',
            label: 'Resolution & Appeal Evidence Notes',
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
              <AppButton variant="secondary" size="xs" icon={Edit3} onClick={() => setEditRow(row)}>
                Update
              </AppButton>
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
              <AppButton variant="secondary" size="xs" icon={Edit3} onClick={() => setEditRow(row)}>
                Update
              </AppButton>
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
