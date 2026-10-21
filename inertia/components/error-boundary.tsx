import { Component, type ReactNode, type ErrorInfo } from 'react'
import { router } from '@inertiajs/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'

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
        <Stack
          gap={4}
          align="center"
          justify="center"
          padding={6}
          minHeight="100vh"
        >
          <Card padding={6} width={480}>
            <Stack gap={4} align="center">
              <Text type="display-2" as="h2" weight="bold">
                Something went wrong
              </Text>
              <Text type="body" as="p" color="secondary" align="center">
                We're sorry, but something unexpected happened. Please try
                refreshing the page.
              </Text>

              {import.meta.env.DEV && this.state.error && (
                <Card padding={4} variant="muted" width="100%">
                  <Stack gap={3}>
                    <Text type="label" weight="semibold">
                      Error Details (Development Only)
                    </Text>
                    <Stack gap={1}>
                      <Text type="code" as="pre">
                        {this.state.error.name}: {this.state.error.message}
                      </Text>
                      <Card padding={3} variant="muted" isScrollable>
                        <Text type="code" as="pre">
                          {this.state.error.stack}
                        </Text>
                      </Card>
                    </Stack>

                    {this.state.errorInfo?.componentStack && (
                      <Stack gap={1}>
                        <Text type="label" weight="semibold">
                          Component Stack
                        </Text>
                        <Card padding={3} variant="muted" isScrollable>
                          <Text type="code" as="pre">
                            {this.state.errorInfo.componentStack}
                          </Text>
                        </Card>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              )}

              <Stack direction="horizontal" gap={3}>
                <Button
                  label="Go Home"
                  variant="secondary"
                  onClick={this.handleGoHome}
                />
                <Button
                  label="Try Again"
                  variant="primary"
                  onClick={this.handleReset}
                />
              </Stack>
            </Stack>
          </Card>
        </Stack>
      )
    }

    return this.props.children
  }
}
