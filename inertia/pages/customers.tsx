import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  type Row,
  money,
} from '~/lib/ui'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Users } from 'lucide-react'

type Props = { customers: Row[]; riskSignals: Row[]; savedViews?: Row[] }

const RISK_LEVELS = ['low', 'medium', 'high', 'under_review', 'cleared']

export default function Customers({ customers, riskSignals, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [reviewRow, setReviewRow] = useState<Row | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Fraud Risk Signals"
        description="Per-user buyer directory, non-destructive duplicate merging, and explainable risk signal reviews."
        icon={Users}
        badge={`${customers.length} customers · ${riskSignals.length} risk signals`}
        actions={
          <>
            <Button
              label="Merge Duplicates"
              variant="secondary"
              onClick={() => setMergeOpen(true)}
            />
            <Button
              label="+ Create Customer"
              variant="primary"
              onClick={() => setCreateOpen(true)}
            />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Customer"
        subtitle="Customers are scoped per-user. Shared addresses raise explainable risk signals rather than auto-blocking."
        submitLabel="Create Customer"
        action="/customers"
        fields={[
          { name: 'fullName', label: 'Full name', required: true },
          { name: 'email', label: 'Email', kind: 'email' },
          { name: 'proxyEmail', label: 'Marketplace proxy email', kind: 'email' },
          { name: 'phone', label: 'Phone' },
          {
            name: 'preferredCurrency',
            label: 'Preferred currency',
            kind: 'select',
            default: 'USD',
            options: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR', 'AED'].map((c) => ({
              value: c,
              label: c,
            })),
          },
          {
            name: 'riskLevel',
            label: 'Risk level',
            kind: 'select',
            default: 'low',
            options: RISK_LEVELS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          { name: 'line1', label: 'Address line 1' },
          { name: 'city', label: 'City' },
          { name: 'stateProvince', label: 'State / Province' },
          { name: 'postalCode', label: 'Postal code' },
          { name: 'countryCode', label: 'Country code (ISO-2)', default: 'US' },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit Customer: ${String(editRow?.fullName ?? '')}`}
        submitLabel="Save Customer"
        action={editRow ? `/customers/${editRow.id}` : '/customers/placeholder'}
        initialValues={
          editRow
            ? {
                fullName: String(editRow.fullName ?? ''),
                email: String(editRow.email ?? ''),
                proxyEmail: String(editRow.proxyEmail ?? ''),
                phone: String(editRow.phone ?? ''),
                preferredCurrency: String(editRow.preferredCurrency ?? 'USD'),
                notes: String(editRow.notes ?? ''),
                riskLevel: String(editRow.riskLevel ?? 'low'),
              }
            : undefined
        }
        fields={[
          { name: 'fullName', label: 'Full name', required: true },
          { name: 'email', label: 'Email', kind: 'email' },
          { name: 'proxyEmail', label: 'Proxy email', kind: 'email' },
          { name: 'phone', label: 'Phone' },
          {
            name: 'preferredCurrency',
            label: 'Currency',
            kind: 'select',
            options: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR', 'AED'].map((c) => ({
              value: c,
              label: c,
            })),
          },
          {
            name: 'riskLevel',
            label: 'Risk level',
            kind: 'select',
            options: RISK_LEVELS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
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
                value: money(String(row.preferredCurrency ?? 'USD'), row.totalSpent),
              },
              { label: 'Risk score', value: String(row.riskScore ?? 0) },
              { label: 'Repeat buyer', value: row.isRepeatCustomer ? 'Yes' : 'No' },
            ],
            actions: (
              <div className="flex items-center gap-2">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Delete ${row.fullName}?`)) {
                      router.post(`/customers/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
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
            col.money('totalSpent', 'Lifetime spend', 'preferredCurrency'),
            col.text('isRepeatCustomer', 'Repeat', 80),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Delete ${row.fullName}?`)) {
                      router.post(`/customers/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
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
              <Button
                label="Review"
                variant="secondary"
                size="sm"
                onClick={() => setReviewRow(row)}
              />
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
              <Button
                label="Review"
                variant="secondary"
                size="sm"
                onClick={() => setReviewRow(row)}
              />
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
