import { type ComponentProps } from 'react'

export function Card({
  className = '',
  rounded = true,
  ...props
}: ComponentProps<'div'> & { rounded?: boolean }) {
  return (
    <div
      data-slot="card"
      className={`bg-card text-card-foreground flex flex-col gap-5 border border-border py-5 shadow-xs transition-all duration-200 ${
        rounded ? 'rounded-xl' : ''
      } ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={`text-base font-semibold leading-tight tracking-tight text-foreground ${className}`}
      {...props}
    />
  )
}

export function CardDescription({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={`text-muted-foreground text-sm ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className = '', ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={`px-6 ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={`flex items-center justify-between gap-3 px-6 pt-4 border-t border-border ${className}`}
      {...props}
    />
  )
}
