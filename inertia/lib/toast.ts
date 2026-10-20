/**
 * Flash → Sonner bridge + tiny toast helpers.
 *
 * Server sets `session.flash('success' | 'error' | 'info' | 'warning')`.
 * `InertiaMiddleware.flash()` returns those keys on `page.props.flash`,
 * history-safe. This hook watches flash and emits the matching Sonner toast.
 */
import { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import type { Data } from '@generated/data'

/**
 * Mount inside any layout that has access to Inertia `flash`. Emits at most
 * once per distinct flash value (prevents double-fire on re-renders).
 */
export function useFlashToasts() {
  const { flash } = usePage<Data.SharedProps & { flash?: Record<string, string | undefined> }>()
  const seen = useRef<string>('')

  useEffect(() => {
    if (!flash) return
    // Support both shapes: InertiaMiddleware.flash() object and legacy singletons
    const success: string | undefined = (flash as any).success ?? (flash as any).data?.success
    const error: string | undefined = (flash as any).error ?? (flash as any).data?.error
    const info: string | undefined = (flash as any).info ?? (flash as any).data?.info
    const warning: string | undefined = (flash as any).warning ?? (flash as any).data?.warning

    const key = `${success ?? ''}|${error ?? ''}|${info ?? ''}|${warning ?? ''}`
    if (!key || key === seen.current) return
    seen.current = key

    if (success) toast.success(success)
    if (error) toast.error(error)
    if (info) toast.info(info)
    if (warning) toast.warning(warning)
  }, [flash])
}

// Convenience helpers — prefer semantic calls when not using flash.
export function notifySuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined)
}

export function notifyError(message: string, description?: string) {
  toast.error(message, description ? { description } : undefined)
}

export function notifyInfo(message: string, description?: string) {
  toast(message, description ? { description } : undefined)
}
