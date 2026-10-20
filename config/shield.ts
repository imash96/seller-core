import { defineConfig } from '@adonisjs/shield'

/**
 * Shield — app-wide protection against common web attacks.
 *
 * Every request passes through `@adonisjs/shield/shield_middleware`
 * (registered in start/kernel.ts router.use). The middleware reads this
 * config and applies the enabled guards. No per-route opt-in needed.
 *
 * Arena note: xFrame stays disabled so the live-preview iframe can embed
 * the app; in production you would set `xFrame.enabled = true`.
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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
      frameAncestors: ["'self'", 'https://*.e2b.app', 'https://*.arena.ai'],
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
   * X-Frame-Options — disabled for Arena live preview iframe.
   * In production set to `DENY` or `SAMEORIGIN`.
   */
  xFrame: {
    enabled: false,
    action: 'DENY',
  },

  hsts: {
    enabled: true,
    maxAge: '180 days',
    includeSubDomains: true,
    preload: true,
  },

  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
