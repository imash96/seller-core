import { Form, Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--astryx-color-background-wash, #f0f2f5)',
          padding: 24,
        }}
      >
        <Card padding={6} width={420}>
          <Stack gap={4}>
            <Stack gap={2}>
              <Badge variant="info" label="Admin-provisioned accounts only" />
              <Text type="display-2" as="h1" weight="bold">
                Sign in to Seller Core
              </Text>
              <Text type="supporting" as="p">
                Public self-registration is disabled by security policy. Use credentials provisioned
                by your system super administrator.
              </Text>
            </Stack>

            <Card padding={3} variant="muted">
              <Stack gap={1}>
                <Text type="label" as="div" weight="semibold">
                  Seeded demo accounts
                </Text>
                <Text type="code" as="div">
                  admin@sellercore.io / Password123!
                </Text>
                <Text type="code" as="div">
                  ops@sellercore.io / Password123!
                </Text>
              </Stack>
            </Card>

            <Form action="/login" method="post">
              {({ errors, processing }) => (
                <Stack gap={3}>
                  <TextInput
                    label="Email"
                    type="email"
                    htmlName="email"
                    value={email}
                    onChange={setEmail}
                    isRequired
                    width="100%"
                    status={errors.email ? { type: 'error', message: errors.email } : undefined}
                  />
                  <TextInput
                    label="Password"
                    type="password"
                    htmlName="password"
                    value={password}
                    onChange={setPassword}
                    isRequired
                    width="100%"
                    status={
                      errors.password ? { type: 'error', message: errors.password } : undefined
                    }
                  />
                  <Button
                    label="Sign in"
                    type="submit"
                    variant="primary"
                    size="lg"
                    isDisabled={processing}
                  />
                </Stack>
              )}
            </Form>

            <Link href="/">
              <Button label="← Back to home" variant="ghost" size="sm" />
            </Link>
          </Stack>
        </Card>
      </div>
    </Theme>
  )
}
