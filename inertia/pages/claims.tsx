import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import { PageSection, DataTable, SmartForm, StatusForm, col, type Row } from '~/lib/ui'

type Props = {
  claims: Row[]
  orders: Row[]
  sellerAccounts: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
}

Claims.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

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

export default function Claims({ claims, orders, sellerAccounts }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Open marketplace claim"
        description="A-to-Z claims, chargebacks and disputes tracked against orders with seller-liability amounts and response deadlines."
      >
        <SmartForm
          action="/claims"
          submitLabel="Open claim"
          fields={[
            {
              name: 'orderId',
              label: 'Order',
              kind: 'select',
              required: true,
              width: 200,
              options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
            },
            {
              name: 'sellerAccountId',
              label: 'Seller account',
              kind: 'select',
              width: 200,
              options: sellerAccounts.map((s) => ({
                value: String(s.id),
                label: String(s.accountName ?? s.id),
              })),
            },
            { name: 'claimNumber', label: 'Claim number', required: true, width: 150 },
            {
              name: 'claimType',
              label: 'Claim type',
              kind: 'select',
              required: true,
              width: 190,
              options: CLAIM_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
            },
            { name: 'disputedAmount', label: 'Disputed amount', kind: 'number', width: 140 },
            {
              name: 'sellerLiabilityAmount',
              label: 'Seller liability',
              kind: 'number',
              width: 140,
            },
            { name: 'reason', label: 'Reason', width: 240 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Claims"
        description="Work each claim through the marketplace lifecycle before the respond-by deadline."
      >
        <DataTable
          rows={claims}
          empty="No claims."
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
            col.action('Status', (row) => (
              <StatusForm
                action={`/claims/${row.id}/status`}
                options={CLAIM_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                current={String(row.status ?? 'opened')}
                label="Claim status"
              />
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
