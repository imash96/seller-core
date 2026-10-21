import { useState, useCallback } from 'react'

/**
 * Simple boolean toggle state with open/close/toggle helpers.
 * Useful for drawers, modals, popovers, and disclosure patterns.
 */
export function useToggle(initialState = false) {
  const [open, setState] = useState(initialState)

  const onOpen = useCallback(() => setState(true), [])
  const onClose = useCallback(() => setState(false), [])
  const onToggle = useCallback(() => setState((prev) => !prev), [])

  return { open, onOpen, onClose, onToggle }
}
