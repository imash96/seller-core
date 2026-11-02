import type { ReactNode } from 'react'
import { Banner } from '@astryxdesign/core/Banner'

export type BannerTone = 'success' | 'error' | 'info' | 'warning'

/**
 * Page-level feedback banner.
 *
 * Wraps Astryx `Banner` so every module reports async outcomes the same way: a
 * status-mapped icon/colour, one dismiss control, and an optional action in
 * `endContent`. Callers keep their own tone vocabulary (`success`/`error`/`info`),
 * which maps 1:1 onto the Astryx status values.
 */
export function FeedbackBanner({
  tone,
  message,
  description,
  action,
  onDismiss,
}: {
  tone: BannerTone
  message: ReactNode
  description?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
}) {
  return (
    <Banner
      status={tone}
      title={message}
      description={description}
      isDismissable={Boolean(onDismiss)}
      onDismiss={onDismiss}
      dismissLabel="Dismiss message"
      endContent={action}
      container="card"
    />
  )
}
