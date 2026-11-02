import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  TopStatusBar,
  AppButton,
  col,
  type Row,
  money,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  Users,
  UserCheck,
  ShieldAlert,
  DollarSign,
  GitMerge,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
} from 'lucide-react'

type Props = { customers: Row[]; riskSignals: Row[]; savedViews?: Row[] }

const RISK_LEVELS = ['low', 'medium', 'high', 'under_review', 'cleared']

export default function Customers({ customers, riskSignals, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [reviewRow, setReviewRow] = useState<Row | null>(null)

  const stats = useMemo(() => {
    const repeatCount = customers.filter(
      (c) => Boolean(c.isRepeatCustomer) || Number(c.ordersCount ?? 0) > 1
    ).length
    const highRiskCount = customers.filter((c) =>
      ['high', 'under_review'].includes(String(c.riskLevel))
    ).length
    const pendingSignals = riskSignals.filter(
      (s) => String(s.reviewStatus) === 'pending_review'
    ).length
    const totalLtv = customers.reduce((acc, c) => acc + Number(c.totalSpent ?? 0), 0)
    return { repeatCount, highRiskCount, pendingSignals, totalLtv }
  }, [customers, riskSignals])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Fraud Risk Signals"
        description="Per-user buyer directory, non-destructive duplicate merging, and explainable risk signal reviews."
        icon={Users}
        badge={`${customers.length} customers · ${riskSignals.length} risk signals`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AppButton
              variant="secondary"
              size="sm"
              icon={GitMerge}
              onClick={() => setMergeOpen(true)}
            >
              Merge Duplicates
            </AppButton>
            <AppButton variant="primary" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
              Create Customer
            </AppButton>
          </div>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'total-customers',
            label: 'Total Customers',
            value: customers.length,
            hint: `${stats.repeatCount} repeat buyers`,
            icon: Users,
            tone: 'primary',
          },
          {
            id: 'repeat-buyers',
            label: 'Repeat Buyers',
            value: stats.repeatCount,
            hint: '2+ historical orders',
            icon: UserCheck,
            tone: 'success',
          },
          {
            id: 'lifetime-spend',
            label: 'Total Customer LTV',
            value: money('USD', stats.totalLtv),
            hint: 'Cumulative buyer spend',
            icon: DollarSign,
            tone: 'info',
          },
          {
            id: 'risk-reviews',
            label: 'Risk Signals / High Risk',
            value: `${stats.pendingSignals} / ${stats.highRiskCount}`,
            hint: 'Pending manual operator review',
            icon: ShieldAlert,
            tone: stats.pendingSignals > 0 || stats.highRiskCount > 0 ? 'warning' : 'success',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Complete Create Customer Modal exposing all customers + customer_addresses fields */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Customer & Primary Address"
        subtitle="Customers are scoped per-user. Shared addresses raise explainable risk signals rather than auto-blocking."
        submitLabel="Create Customer"
        action="/customers"
        fields={[
          { name: 'fullName', label: 'Full Name', required: true },
          {
            name: 'externalCustomerRef',
            label: 'External Marketplace Customer ID',
            placeholder: 'AMZ-CUST-9912',
          },
          { name: 'email', label: 'Email Address', kind: 'email' },
          { name: 'proxyEmail', label: 'Marketplace Proxy Email', kind: 'email' },
          { name: 'phone', label: 'Phone Number' },
          {
            name: 'riskLevel',
            label: 'Risk Level',
            kind: 'select',
            default: 'low',
            options: RISK_LEVELS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          { name: 'riskScore', label: 'Initial Risk Score (0–100)', kind: 'number', default: '0' },
          {
            name: 'addressType',
            label: 'Address Type',
            kind: 'select',
            default: 'shipping',
            options: [
              { value: 'shipping', label: 'Shipping' },
              { value: 'billing', label: 'Billing' },
              { value: 'both', label: 'Shipping & Billing' },
            ],
          },
          { name: 'recipientName', label: 'Recipient Name (if different)' },
          { name: 'companyName', label: 'Company Name' },
          { name: 'line1', label: 'Address Line 1' },
          { name: 'line2', label: 'Address Line 2 (Apt / Suite)' },
          { name: 'city', label: 'City' },
          { name: 'stateProvince', label: 'State / Province' },
          { name: 'postalCode', label: 'Postal Code' },
          { name: 'countryCode', label: 'Country Code (ISO-2)', default: 'US' },
          {
            name: 'isResidential',
            label: 'Address Classification',
            kind: 'select',
            default: 'true',
            options: [
              { value: 'true', label: 'Residential' },
              { value: 'false', label: 'Commercial / Business' },
            ],
          },
          { name: 'notes', label: 'Customer Notes', kind: 'textarea', fullWidth: true },
        ]}
      />

      {/* Complete Edit Customer Modal */}
      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit Customer: ${String(editRow?.fullName ?? '')}`}
        subtitle="Update buyer profile, marketplace proxy email, risk score, and operator notes."
        submitLabel="Save Customer"
        action={editRow ? `/customers/${editRow.id}` : '/customers/placeholder'}
        initialValues={
          editRow
            ? {
                fullName: String(editRow.fullName ?? ''),
                externalCustomerRef: String(editRow.externalCustomerRef ?? ''),
                email: String(editRow.email ?? ''),
                proxyEmail: String(editRow.proxyEmail ?? ''),
                phone: String(editRow.phone ?? ''),
                riskLevel: String(editRow.riskLevel ?? 'low'),
                riskScore: String(editRow.riskScore ?? 0),
                notes: String(editRow.notes ?? ''),
              }
            : undefined
        }
        fields={[
          { name: 'fullName', label: 'Full Name', required: true },
          { name: 'externalCustomerRef', label: 'External Customer Ref' },
          { name: 'email', label: 'Email', kind: 'email' },
          { name: 'proxyEmail', label: 'Proxy Email', kind: 'email' },
          { name: 'phone', label: 'Phone' },
          {
            name: 'riskLevel',
            label: 'Risk Level',
            kind: 'select',
            options: RISK_LEVELS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          { name: 'riskScore', label: 'Risk Score (0–100)', kind: 'number' },
          { name: 'notes', label: 'Notes', kind: 'textarea', fullWidth: true },
        ]}
      />

      <FormModal
        isOpen={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Merge Duplicate Customers"
        subtitle="Non-destructive merge: orders, addresses, risk signals, and RMAs are transferred to the surviving customer."
        submitLabel="Merge Customers"
        action="/customers/merge"
        fields={[
          {
            name: 'sourceCustomerId',
            label: 'Source customer (absorbed)',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: customers.map((c) => ({
              value: String(c.id),
              label: `${c.fullName} (${c.email ?? 'no email'})`,
            })),
          },
          {
            name: 'targetCustomerId',
            label: 'Target customer (survives)',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: customers.map((c) => ({
              value: String(c.id),
              label: `${c.fullName} (${c.email ?? 'no email'})`,
            })),
          },
        ]}
      />

      <FormModal
        isOpen={!!reviewRow}
        onOpenChange={(o) => {
          if (!o) setReviewRow(null)
        }}
        title={`Review Risk Signal: ${String((reviewRow as any)?.signalType ?? reviewRow?.signalCode ?? '—')}`}
        submitLabel="Submit Review"
        action={
          reviewRow ? `/risk-signals/${reviewRow.id}/review` : '/risk-signals/placeholder/review'
        }
        initialValues={
          reviewRow
            ? {
                reviewStatus: String(reviewRow.reviewStatus ?? 'resolved'),
                reviewNotes: String(reviewRow.reviewNotes ?? ''),
              }
            : undefined
        }
        fields={[
          {
            name: 'reviewStatus',
            label: 'Review status',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: [
              { value: 'pending_review', label: 'Pending review' },
              { value: 'investigating', label: 'Investigating' },
              { value: 'confirmed_risk', label: 'Confirmed risk' },
              { value: 'false_positive', label: 'False positive' },
              { value: 'resolved', label: 'Resolved' },
            ],
          },
          { name: 'reviewNotes', label: 'Review notes', kind: 'textarea', fullWidth: true },
        ]}
      />

      <PageSection
        title="Customers"
        description="Risk level, lifetime spend, and repeat-buyer status per customer."
      >
        <ResponsiveDataView
          rows={customers}
          searchKeys={['fullName', 'email', 'proxyEmail', 'phone']}
          filterKey="riskLevel"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'high', label: 'High risk' },
            { value: 'under_review', label: 'Under review' },
            { value: 'low', label: 'Low' },
            { value: 'cleared', label: 'Cleared' },
          ]}
          createLabel="+ Create Customer"
          onCreateClick={() => setCreateOpen(true)}
          toCard={(row) => ({
            title: String(row.fullName),
            subtitle: String(row.email ?? row.phone ?? '').slice(0, 36),
            avatarText: String(row.fullName ?? 'U').slice(0, 2),
            idBadge: row.proxyEmail ? `proxy ${String(row.proxyEmail).slice(0, 18)}` : undefined,
            statusBadge: {
              label: String(row.riskLevel ?? 'low').replace(/_/g, ' '),
              variant:
                row.riskLevel === 'high'
                  ? 'error'
                  : row.riskLevel === 'under_review'
                    ? 'info'
                    : row.riskLevel === 'medium'
                      ? 'warning'
                      : 'success',
            },
            metrics: [
              { label: 'Orders', value: String(row.ordersCount ?? 0) },
              {
                label: 'Lifetime spend',
                value: money('USD', row.totalSpent),
              },
              { label: 'Risk score', value: String(row.riskScore ?? 0) },
              { label: 'Repeat buyer', value: row.isRepeatCustomer ? 'Yes' : 'No' },
            ],
            actions: (
              <div className="flex items-center gap-2">
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
                    if (window.confirm(`Delete ${row.fullName}?`)) {
                      router.post(`/customers/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Delete
                </AppButton>
              </div>
            ),
          })}
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
            col.money('totalSpent', 'Lifetime spend'),
            col.text('isRepeatCustomer', 'Repeat', 80),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5 flex-wrap">
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
                    if (window.confirm(`Delete ${row.fullName}?`)) {
                      router.post(`/customers/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Delete
                </AppButton>
              </div>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Customer Risk Signals"
        description="Explainable signals — reviewed manually by operators, never auto-flagged as fraud."
      >
        <ResponsiveDataView
          rows={riskSignals}
          searchKeys={['signalType', 'signalCode', 'reason', 'explanation', 'severity']}
          filterKey="reviewStatus"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'pending_review', label: 'Pending' },
            { value: 'confirmed_risk', label: 'Confirmed' },
            { value: 'false_positive', label: 'False positive' },
          ]}
          toCard={(row) => ({
            title: String(row.signalType ?? row.signalCode ?? 'Risk signal'),
            subtitle: String(row.reason ?? row.explanation ?? '').slice(0, 38),
            statusBadge: {
              label: String(row.severity ?? ''),
              variant:
                String(row.severity) === 'critical' || String(row.severity) === 'high'
                  ? 'error'
                  : String(row.severity) === 'medium'
                    ? 'warning'
                    : 'neutral',
            },
            metrics: [
              { label: 'Reason', value: String(row.reason ?? row.explanation ?? '—').slice(0, 54) },
              {
                label: 'Customer',
                value: String((row.customer as any)?.fullName ?? row.customerId ?? '—').slice(
                  0,
                  22
                ),
              },
              { label: 'Review status', value: String(row.reviewStatus).replace(/_/g, ' ') },
            ],
            actions: (
              <AppButton
                variant="secondary"
                size="xs"
                icon={CheckCircle2}
                onClick={() => setReviewRow(row)}
              >
                Review
              </AppButton>
            ),
          })}
          columns={[
            col.text('signalCode', 'Signal', 160),
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
            col.text('explanation', 'Explanation', 260),
            col.action('Actions', (row) => (
              <AppButton
                variant="secondary"
                size="xs"
                icon={CheckCircle2}
                onClick={() => setReviewRow(row)}
              >
                Review
              </AppButton>
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
