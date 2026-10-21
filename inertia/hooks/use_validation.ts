import { usePage } from '@inertiajs/react'

/**
 * Access validation errors from Inertia page props with
 * convenient field-level and aggregate helpers.
 */
export function useValidationErrors() {
  const { errors } = usePage().props as unknown as { errors?: Record<string, string[]> }

  /** Error messages for a specific field */
  const getError = (field: string): string[] => {
    return errors?.[field] || []
  }

  /** First error message for a field (most common use-case) */
  const getFirstError = (field: string): string | undefined => {
    const fieldErrors = getError(field)
    return fieldErrors.length > 0 ? fieldErrors[0] : undefined
  }

  /** Whether a field has errors */
  const hasError = (field: string): boolean => {
    return getError(field).length > 0
  }

  /** All error messages as a flat array */
  const getAllErrors = (): string[] => {
    if (!errors) return []
    return Object.values(errors).flat()
  }

  /** Whether any errors exist */
  const hasAnyErrors = (): boolean => {
    return getAllErrors().length > 0
  }

  /** Total error count */
  const errorCount = (): number => {
    return getAllErrors().length
  }

  /** Field names that have errors */
  const getErrorFields = (): string[] => {
    return errors ? Object.keys(errors) : []
  }

  return {
    errors,
    getError,
    getFirstError,
    hasError,
    getAllErrors,
    hasAnyErrors,
    errorCount,
    getErrorFields,
  }
}

/**
 * Access old input values for re-populating forms after validation errors.
 */
export function useOldInput() {
  const { old } = usePage().props as { old?: Record<string, any> }

  /** Old value for a field with an optional default */
  const getOldValue = (field: string, defaultValue: any = ''): any => {
    return old?.[field] ?? defaultValue
  }

  /** Whether old values exist */
  const hasOldValues = (): boolean => {
    return !!old && Object.keys(old).length > 0
  }

  return {
    old,
    getOldValue,
    hasOldValues,
  }
}

/**
 * Combined hook for form validation state (errors + old input).
 */
export function useFormValidation() {
  const validationErrors = useValidationErrors()
  const oldInput = useOldInput()

  return {
    ...validationErrors,
    ...oldInput,
  }
}
