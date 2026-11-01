import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/shield'

/**
 * Shield — app-wide protection against common web attacks.
 *
 * Every request passes through `@adonisjs/shield/shield_middleware`
 * (registered in start/kernel.ts router.use). The middleware reads this
 * config and applies the enabled guards. No per-route opt-in needed.
 *
 * Development allows preview embedding; production is restricted to same-origin.
 */
const shieldConfig = defineConfig({
  /**
   * Content Security Policy.
   *
   * Enabled with an allowlist that accommodates:
   *  - Vite HMR websocket (ws: / wss:)
   *  - Inertia / fetch (connect-src 'self')
   *  - Astryx + inline styles emitted by @astryxdesign/core (style-src unsafe-inline)
   *  - Preview images/media from the app origin
   *
   * Report-only in development so violations are logged without blocking.
   */
  csp: {
    enabled: true,
    reportOnly: process.env.NODE_ENV !== 'production',
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: app.inProduction
        ? ["'self'"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: app.inProduction ? ["'self'"] : ["'self'", 'ws:', 'wss:', 'https:'],
      frameAncestors: app.inProduction
        ? ["'self'"]
        : ["'self'", 'https://*.e2b.app', 'https://*.arena.ai'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  /**
   * CSRF — double-submit cookie + synchronizer token.
   *
   * `enableXsrfCookie` plants an `XSRF-TOKEN` cookie that Inertia's axios
   * instance reads and sends as `X-XSRF-TOKEN` automatically.
   *
   * `exceptRoutes` is empty: every state-changing route must carry a token.
   * Webhooks that need token-less access get a dedicated signed route instead
   * of a blanket exemption.
   */
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Development permits preview frames; production permits same-origin only.
   */
  xFrame: {
    enabled: app.inProduction,
    action: 'SAMEORIGIN',
  },

  hsts: {
    enabled: app.inProduction,
    maxAge: '180 days',
    includeSubDomains: false,
    preload: false,
  },

  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
