/**
 * Unified UI barrel re-exporting Atomic Design primitives (Atoms, Molecules, Organisms)
 * and formatting helpers across Seller Core.
 */
import { formatMoney, formatDate, shortId } from '~/lib/utils'

export const money = formatMoney
export const when = formatDate
export const short = shortId
export const ID_RE = /^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$/

/* Atoms */
export {
  StatusBadge,
  Badge,
  STATUS_TONES,
  statusBadgeVariant,
  type BadgeVariant,
} from '~/components/atoms/status-badge'
export { MonoBadge } from '~/components/atoms/mono-badge'
export { IconAvatar, type AvatarTone } from '~/components/atoms/icon-avatar'
export { CurrencyText } from '~/components/atoms/currency-text'
export { MetricCell } from '~/components/atoms/metric-cell'
export { ProgressMeter } from '~/components/atoms/progress-meter'
export { ThemeToggleButton } from '~/components/atoms/theme-toggle-button'

/* Molecules */
export { PasswordField, type PasswordFieldProps } from '~/components/molecules/password-field'
export { FormField, type FieldDef } from '~/components/molecules/form-field'
export { SearchInputBar } from '~/components/molecules/search-input-bar'
export { FilterPillGroup, type FilterPill } from '~/components/molecules/filter-pill-group'
export { ViewModeSwitcher, type ViewModeOption } from '~/components/molecules/view-mode-switcher'
export { SortPillBar } from '~/components/molecules/sort-pill-bar'
export { PaginationBar } from '~/components/molecules/pagination-bar'
export { KpiScorecard, KpiCard, StatStrip } from '~/components/molecules/kpi-scorecard'
export { RecordCard, type CardData } from '~/components/molecules/record-card'
export { RowAction, StatusForm } from '~/components/molecules/row-action-group'
export { SavedViewsBar } from '~/components/molecules/saved-views-bar'
export { DemoCredentialCard } from '~/components/molecules/demo-credential-card'

/* Organisms */
export { FormModal, ConfirmDialog, SmartForm } from '~/components/organisms/form-modal'
export {
  ResponsiveDataView,
  DataTable,
  col,
  displayValue,
  type Row,
  type ResponsiveDataViewProps,
} from '~/components/organisms/responsive-data-view'
export {
  PageHeader,
  ModulePageHeader,
  StatsCard,
  PageSection,
  type PageHeaderProps,
  type StatsCardProps,
} from '~/components/organisms/page-header-organism'
export {
  WaterfallChart,
  RevenueTrendChart,
  DonutChart,
  CreditUtilizationBars,
  type DashboardKpis,
} from '~/components/organisms/dashboard-charts'
