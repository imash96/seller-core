import { test } from '@japa/runner'
import { validateProductionConfig } from '../../app/utils/production_config.js'

test.group('Production deployment configuration', () => {
  test('rejects weak keys, non-HTTPS URLs and in-memory sessions', ({ assert }) => {
    const valid = {
      nodeEnv: 'production',
      appKey: 'jvH6ykwZAtnX9UFbRd3WmEC7epqJ5cQs',
      appUrl: 'https://seller.example.com',
      sessionDriver: 'cookie',
    }
    assert.doesNotThrow(() => validateProductionConfig(valid))
    assert.throws(
      () => validateProductionConfig({ ...valid, appKey: '12345678901234567890123456789012' }),
      /APP_KEY/
    )
    assert.throws(
      () => validateProductionConfig({ ...valid, appUrl: 'http://seller.example.com' }),
      /HTTPS/
    )
    assert.throws(
      () => validateProductionConfig({ ...valid, sessionDriver: 'memory' }),
      /SESSION_DRIVER/
    )
    assert.doesNotThrow(() => validateProductionConfig({ nodeEnv: 'development' }))
  })
})
