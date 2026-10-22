import { Component, type ReactNode, type ErrorInfo, useState } from 'react'
import { router } from '@inertiajs/react'
import { VStack } from '@astryxdesign/core/Layout'
import { Stack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * React error boundary that catches rendering errors and shows
 * a recovery UI. In development, includes the full stack trace
 * and React component stack.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    router.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    router.visit('/dashboard')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      )
    }

    return this.props.children
  }
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onGoHome,
}: {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onGoHome: () => void
}) {
  const [showStack, setShowStack] = useState(false)

  return (
    <VStack gap={0} hAlign="center" vAlign="center" minHeight="100dvh" padding={6}>
      <VStack gap={6} hAlign="center" maxWidth={560}>
        {/* Icon */}
        <VStack gap={0} hAlign="center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-4 ring-1 ring-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </span>
          <Heading level={2} justify="center">
            Something went wrong
          </Heading>
          <Text type="body" color="secondary" as="p" justify="center">
            An unexpected error occurred. You can try refreshing the page or head back to the
            dashboard.
          </Text>
        </VStack>

        {/* Actions */}
        <Stack gap={3} align="center" justify="center">
          <Button
            label="Go to Dashboard"
            variant="secondary"
            icon={<Home className="w-4 h-4" />}
            onClick={onGoHome}
          />
          <Button
            label="Refresh Page"
            variant="primary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={onReset}
          />
        </Stack>

        {/* Dev-only error details */}
        {import.meta.env.DEV && error && (
          <Banner
            status="error"
            title={`${error.name}: ${error.message}`}
            description="This information is only visible in development."
            collapsible={{
              defaultIsOpen: false,
              isOpen: showStack,
              onOpenChange: setShowStack,
            }}
          >
            <VStack gap={4} padding={3}>
              {error.stack && (
                <VStack gap={1}>
                  <Text type="label" weight="semibold">
                    Stack Trace
                  </Text>
                  <Card variant="muted" padding={3}>
                    <Text type="code" as="span" size="3xs">
                      {error.stack}
                    </Text>
                  </Card>
                </VStack>
              )}
              {errorInfo?.componentStack && (
                <VStack gap={1}>
                  <Text type="label" weight="semibold">
                    Component Stack
                  </Text>
                  <Card variant="muted" padding={3}>
                    <Text type="code" as="span" size="3xs">
                      {errorInfo.componentStack}
                    </Text>
                  </Card>
                </VStack>
              )}
            </VStack>
          </Banner>
        )}
      </VStack>
    </VStack>
  )
}
