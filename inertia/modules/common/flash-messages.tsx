import { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { useToast } from '@astryxdesign/core/Toast'

type FlashData = {
  success?: string
  error?: string
  info?: string
}

/**
 * Reads Inertia flash data and dispatches Astryx toast notifications.
 *
 * Success/info toasts auto-dismiss after 5 s (Astryx default).
 * Error toasts persist until manually dismissed.
 *
 * Must be rendered inside a LayerProvider (set up in app.tsx).
 */
export function FlashMessages() {
  const { flash } = usePage<{ flash?: FlashData }>().props
  const data = flash || {}
  const showToast = useToast()

  // Track previously-shown flash to avoid re-firing on every render
  const lastFlashRef = useRef<string>('')

  useEffect(() => {
    const key = `${data.success ?? ''}|${data.error ?? ''}|${data.info ?? ''}`
    if (key === lastFlashRef.current || key === '||') return
    lastFlashRef.current = key

    if (data.success) {
      showToast({
        body: data.success,
        type: 'info',
        uniqueID: 'flash-success',
        collisionBehavior: 'overwrite',
      })
    }

    if (data.error) {
      showToast({
        body: data.error,
        type: 'error',
        isAutoHide: false,
        uniqueID: 'flash-error',
        collisionBehavior: 'overwrite',
      })
    }

    if (data.info) {
      showToast({
        body: data.info,
        type: 'info',
        uniqueID: 'flash-info',
        collisionBehavior: 'overwrite',
      })
    }
  }, [data.success, data.error, data.info, showToast])

  // This component renders nothing — useToast handles the UI
  return null
}
