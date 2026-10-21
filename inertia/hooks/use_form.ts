import { useForm as useInertiaForm, router } from '@inertiajs/react'
import { type FormEvent, useState } from 'react'

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface SubmitOptions {
  preserveScroll?: boolean
  preserveState?: boolean
  onSuccess?: (response?: unknown) => void
  onError?: (errors: Record<string, string>) => void
  onFinish?: () => void
  resetOnSuccess?: boolean
  successMessage?: string
}

/**
 * Enhanced Inertia form hook that wraps `useForm` with:
 * - CRUD shortcuts (get/post/put/patch/destroy)
 * - Success state tracking (wasSuccessful, recentlySuccessful)
 * - Auto-reset on success option
 * - Curried handleSubmit for form onSubmit
 */
export function useForm<T extends Record<string, any>>(initialData: T) {
  const form = useInertiaForm<T>(initialData)

  const [wasSuccessful, setWasSuccessful] = useState(false)
  const [recentlySuccessful, setRecentlySuccessful] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const submit = (method: HttpMethod, url: string, options: SubmitOptions = {}) => {
    setWasSuccessful(false)
    setSuccessMessage(null)

    const {
      preserveScroll = true,
      preserveState = true,
      resetOnSuccess = false,
      successMessage: message,
      onSuccess,
      onError,
      onFinish,
    } = options

    const inertiaOptions = {
      preserveScroll,
      preserveState,
      onSuccess: (page: unknown) => {
        setWasSuccessful(true)
        setRecentlySuccessful(true)
        if (message) setSuccessMessage(message)
        if (resetOnSuccess) form.reset()

        setTimeout(() => setRecentlySuccessful(false), 2000)
        onSuccess?.(page)
      },
      onError: (errors: any) => {
        onError?.(errors)
      },
      onFinish: () => {
        onFinish?.()
      },
    }

    if (method === 'get') {
      router.get(url, form.data, inertiaOptions)
    } else if (method === 'delete') {
      router.delete(url, inertiaOptions)
    } else {
      router[method](url, form.data, inertiaOptions)
    }
  }

  const handleSubmit =
    (method: HttpMethod, url: string, options?: SubmitOptions) => (e: FormEvent) => {
      e.preventDefault()
      submit(method, url, options)
    }

  return {
    /* Inertia form state */
    data: form.data,
    setData: form.setData,
    errors: form.errors,
    processing: form.processing,
    isDirty: form.isDirty,
    reset: form.reset,
    clearErrors: form.clearErrors,
    setError: form.setError,
    transform: form.transform,

    /* Submission */
    submit,
    handleSubmit,

    /* CRUD shortcuts */
    get: (url: string, options?: SubmitOptions) => submit('get', url, options),
    post: (url: string, options?: SubmitOptions) => submit('post', url, options),
    put: (url: string, options?: SubmitOptions) => submit('put', url, options),
    patch: (url: string, options?: SubmitOptions) => submit('patch', url, options),
    destroy: (url: string, options?: SubmitOptions) => submit('delete', url, options),

    /* UX helpers */
    wasSuccessful,
    recentlySuccessful,
    successMessage,
  }
}
