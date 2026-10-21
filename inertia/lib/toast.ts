/**
 * Flash → Astryx Toast bridge + tiny toast helpers.
 *
 * Server sets `session.flash('success' | 'error' | 'info' | 'warning')`.
 * `InertiaMiddleware.flash()` returns those keys on `page.props.flash`,
 * history-safe. The `FlashMessages` component (rendered in all layouts)
 * watches flash and emits the matching Astryx toast via `useToast()`.
 *
 * For imperative (non-flash) toasts, call the exported helpers inside
 * a component that lives under `<LayerProvider>` — they accept the
 * `showToast` function returned by `useToast()`.
 */
import { useToast } from '@astryxdesign/core/Toast'

type ShowToast = ReturnType<typeof useToast>

/**
 * Fire a success toast imperatively.
 * Call from within a component that has access to `useToast()`.
 */
export function notifySuccess(showToast: ShowToast, message: string) {
  showToast({
    body: message,
    type: 'info',
    uniqueID: 'notify-success',
    collisionBehavior: 'overwrite',
  })
}

/**
 * Fire an error toast imperatively (stays visible until dismissed).
 */
export function notifyError(showToast: ShowToast, message: string) {
  showToast({
    body: message,
    type: 'error',
    isAutoHide: false,
    uniqueID: 'notify-error',
    collisionBehavior: 'overwrite',
  })
}

/**
 * Fire an informational toast imperatively.
 */
export function notifyInfo(showToast: ShowToast, message: string) {
  showToast({
    body: message,
    type: 'info',
    uniqueID: 'notify-info',
    collisionBehavior: 'overwrite',
  })
}
