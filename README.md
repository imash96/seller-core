<div align="center">

  <!-- Add your cover image here -->
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/adonisjs/starter-kits/blob/main/docs/react-dark.png?raw=true">
    <img src="https://github.com/adonisjs/starter-kits/blob/main/docs/react-light.png?raw=true" alt="AdonisJS React Inertia Starter Kit" width="100%">
  </picture>

  <h1>React Inertia Starter Kit</h1>

  <p>
    <strong>A batteries-included AdonisJS starter kit for building modern single-page applications with React.</strong>
  </p>

  <p>
    Built for developers who want the power of React with the simplicity of server-side routing and rendering.
  </p>

  <br>

<a href="#-whats-in-the-box">Features</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#-quick-start">Quick Start</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="https://adonisjs.com">Documentation</a>

  <br>
  <br>

</div>

---

## ✨ What's in the Box

This application is built on a starter kit for single-page applications with React and Inertia.js. It is not yet production-ready. It combines the modern DX of React with the simplicity of traditional server-side routing, giving you the best of both worlds.

### 🎯 Core Features

- **🔐 Authentication System** - Complete user signup, login, and session management out of the box
- **⚛️ React 19** - Latest React with modern hooks and concurrent features
- **🔄 Inertia.js** - Build SPAs without the API complexity—server-side routing that feels like client-side
- **🎨 Custom Design System** - Hand-written CSS built on semantic design tokens, re-themed from one place in `app.css`
- **🌗 Dark Mode** - Light and dark themes with a header toggle, remembered in a cookie and server-rendered with no flash
- **🧩 Layouts** - Marketing, auth, app and settings layouts, attached per page and nestable
- **📊 Dashboard** - An authenticated `/dashboard` route to land on after login or signup
- **✅ Typed Forms** - The `Form` component types its `errors` from the route's VineJS validator
- **🔔 Toast Notifications** - Built-in toast system using Sonner
- **🛡️ Security First** - CSRF protection, Shield middleware, and secure session handling
- **🔒 Type Safety** - End-to-end TypeScript with Tuyau for type-safe routing

### 🔧 Tech Stack

<table>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <a href="https://adonisjs.com">AdonisJS 7.x</a> - Full-featured Node.js framework
    </td>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <a href="https://react.dev">React 19</a> - Modern UI library with hooks and concurrent rendering
    </td>
  </tr>
  <tr>
    <td><strong>Adapter</strong></td>
    <td>
      <a href="https://inertiajs.com">Inertia.js</a> - Build SPAs with server-side routing (no API needed)
    </td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>
      <a href="https://lucid.adonisjs.com">Lucid ORM</a> - SQL ORM with migrations (SQLite, PostgreSQL, MySQL, MSSQL)
    </td>
  </tr>
  <tr>
    <td><strong>Auth</strong></td>
    <td>
      Session-based authentication with secure cookie storage
    </td>
  </tr>
  <tr>
    <td><strong>Styling</strong></td>
    <td>
      Hand-written CSS built on semantic design tokens, with light and dark themes
    </td>
  </tr>
  <tr>
    <td><strong>Build</strong></td>
    <td>
      <a href="https://vitejs.dev">Vite</a> - Lightning-fast HMR and optimized builds
    </td>
  </tr>
  <tr>
    <td><strong>Validation</strong></td>
    <td>
      <a href="https://vinejs.dev">VineJS</a> - Type-safe schema validation
    </td>
  </tr>
  <tr>
    <td><strong>Type Safety</strong></td>
    <td>
      <a href="https://docs.adonisjs.com/guides/frontend/api-client">Tuyau</a> - End-to-end type safety for routes and API calls
    </td>
  </tr>
  <tr>
    <td><strong>UI Components</strong></td>
    <td>
      <a href="https://sonner.emilkowal.ski">Sonner</a> - Toast notifications for React
    </td>
  </tr>
  <tr>
    <td><strong>Icons</strong></td>
    <td>
      <a href="https://lucide.dev/guide/packages/lucide-react">Lucide (lucide-react)</a> - Consistent, tree-shakeable icon set
    </td>
  </tr>
  <tr>
    <td><strong>Testing</strong></td>
    <td>
      <a href="https://japa.dev">Japa</a> - Delightful testing framework with browser testing support
    </td>
  </tr>
  <tr>
    <td><strong>TypeScript</strong></td>
    <td>
      Full TypeScript support with strict mode enabled
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

### Create a New Project

```bash
npm init adonisjs@latest -- -K=react
```

During setup, you'll be asked to choose:

- **Database**: Choose your preferred database (SQLite, PostgreSQL, MySQL, MSSQL)
- **Auth guard**: Select `session` for cookie-based authentication
- **SSR**: Choose whether to enable server-side rendering (optional)

This command will:

- Clone this starter kit
- Install all dependencies
- Set up your `.env` file
- Generate your app encryption key
- Configure your database
- Configure Inertia with React
- Run migrations

### Security upgrade for existing installations

Run `node ace migration:run` before serving the upgraded application. The credential
migration re-encrypts legacy seller credentials using `APP_KEY`; do not change the
key between deployments. Previous versions used a publicly predictable key, so
**rotate all marketplace credentials stored by earlier versions**, even after the
migration. Historical audit logs and backups may still contain old ciphertext or
other secrets and must be protected and reviewed separately. Existing logins are
invalidated and users must sign in again. The bundled demo seeder is blocked in
production; remove or reset any previously seeded demo accounts.

Remote category sync uses only the server-configured `MEDUSA_BACKEND_URL`; request
URLs cannot override it. Redirects are rejected.

### Operational readiness and integration limits

This repository is **not yet production-ready**. The current fulfillment workflow
supports split shipments, local return/refund accounting and downloadable CSV exports.
A local refund record does not send money to a customer. Delivery notifications are
queued in the outbox; no delivery provider is configured, so queued does not mean sent.

Marketplace publishing and account synchronization are not connected. Publish and sync
actions are disabled or rejected rather than reporting simulated success. Existing
published/synced records predate this safeguard and should be independently verified.
The catalog studio generates drafts; its marketplace payloads have not been verified
against official APIs. The legacy file upload route does not process files and directs
users to the catalog studio JSON importer instead.

Order, shipment, return, task and finance routes require their respective per-action RBAC
permission and module entitlement. Catalog, customer and integration routes also have
permission checks; shared lookups and dashboard domain queries are filtered. Household
accounts, cards, categories and ledger records additionally require the corresponding
`household_finance` permission and entitlement. Household mutations require both read
and the relevant action permission. Grant the module entitlement explicitly when needed.
Non-admin audit views omit snapshots. Financial links must belong to the same tenant and
classification; legacy mismatched links should be reviewed. New card records contain
metadata only, not a vault token; posting a ledger entry does not move money. Manual ledger
matches require finance read and update (plus household read and update for household
entries), compare the original amount and currency exactly, retain an audit trail and
can be reversed. Statement references are user-entered evidence, not bank verification.
Concurrent active matches and duplicate references are rejected; reverse a match before
voiding its ledger entry.

Carrier invoice comparisons require expected amounts: unknown estimates remain null and
unreconciled, and opposing line discrepancies cannot cancel into a match. Invoice payment
and resolution updates are manually reported, require a review note and (for paid/partial)
a payment reference; they do not contact a carrier or payment processor. Invoice deletion
is disabled to preserve allocation history. Previously created invoice statuses may have
been automatically matched or paid by older code; review them against independent evidence.
Existing deployments must explicitly grant the new `tasks` role permissions and module
entitlement; the migration registers permissions but does not expand existing roles.

Dashboard summaries cover recent records, not full-period reporting, and USD monetary
totals exclude other reporting currencies. A full authorization and tenant-isolation
review is still required. Before deploying, complete external integrations, broader
end-to-end coverage, background/outbox delivery, deployment-specific security review, observability,
backups, dependency and security review, and externally verified financial reconciliation. Do not use demo
data or credentials in production.

### Deployment checklist (not a production-readiness certification)

- Use PostgreSQL, back it up and test restoration before applying migrations; run
  `node ace migration:run` before starting each release. Catalog and price tables are
  migration-managed, not created during HTTP requests. If a separately managed `sessions`
  table already exists, reconcile its schema and migration state before upgrading.
- Use a securely generated, unique `APP_KEY` (keep it stable for encrypted seller
  credentials), a public HTTPS `APP_URL`, and `SESSION_DRIVER=cookie` or `database`.
  The production HTTP entrypoint rejects obviously weak keys, non-HTTPS URLs and
  unsupported session stores; simple heuristics cannot prove a secret is random.
  Store secrets outside source control. Rotate any credentials encrypted with the old
  public key, including any exposed in logs or backups.
- Terminate HTTPS at a trusted proxy, configure trusted proxy headers appropriately,
  restrict database access and require TLS when traffic crosses untrusted networks.
  Check cookie, CSRF, CORS, CSP, health checks and the complete login flow on the actual
  deployment domain before rollout. Production CSP restricts scripts and network
  connections to same-origin and frames to same-origin; inline styles remain allowed.
  Development permits Arena preview framing and the Vite development connection.
- `/health/live` reports process liveness; `/health/ready` checks database connectivity
  with a two-second response timeout. These do not check migrations, queues, integrations,
  background delivery, or business correctness; monitor those separately. Restrict probe
  access at the infrastructure layer if desired.
- Set up access logging/alerts without secrets, rate limits at the edge, database and
  queue monitoring, retention policies and recovery procedures. No worker delivers
  outbox messages yet. No claim here substitutes for a security assessment.

### Running the tests safely

The suite includes PostgreSQL integration tests. Set `TEST_DATABASE_URL` to a **dedicated,
disposable** PostgreSQL database, separate from development and production. The test
runner applies migrations and may roll them back at teardown; it also writes test data.
`DATABASE_URL` and the other application environment variables must still be configured.
A missing test database or migration failure now fails the run rather than silently
skipping integration tests.

Browser tests use Playwright Chromium and require its OS dependencies. Install with
`corepack pnpm exec playwright install --with-deps chromium` in a supported environment.
Alternatively set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a compatible Chromium executable;
the custom-executable launcher disables Chromium's sandbox and should only be used in an
isolated test environment. The browser tests currently cover order entry at mobile and
desktop widths and a mobile finance category/ledger flow, not the entire application.

```sh
TEST_DATABASE_URL=postgres://user:password@localhost:5432/seller_core_test pnpm test
```

### Start Developing

```bash
# Run the development server with hot reload
node ace serve --hmr

# Run tests
node ace test

# Type check both backend and frontend
npm run typecheck

# Lint your code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

Your app will be running at `http://localhost:3333`

---

## 🧱 Adding Pages

The kit ships the building blocks for app pages, without shipping pages you would have to delete.

| Piece                            | What it does                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `inertia/components/page.tsx`    | Sets the document title and renders the page heading, description and actions.                 |
| `inertia/components/section.tsx` | A group of content within a page, with an optional title. Stacked sections get a divider.      |
| `inertia/layouts/settings.tsx`   | The settings area: a heading, a sidebar of links and a card holding the current settings page. |
| `nav` in `layouts/app.tsx`       | The top-level navigation. Add an entry for every new area of your app.                         |

### A single page

Wrap the page in `Page` and use the app layout. Pass `hideTitle` when the page should set the document title without rendering a heading.

```tsx
// inertia/pages/reports.tsx
import Page from '~/components/page'
import AppLayout from '~/layouts/app'

export default function Reports() {
  return (
    <Page title="Reports" description="Monthly numbers at a glance.">
      …
    </Page>
  )
}

Reports.layout = [AppLayout]
```

Register a route for it and add an entry to `nav` in `inertia/layouts/app.tsx` to link to it.

To show content on a card, wrap it in `<div className="panel">`. The settings layout uses the same class for its content card.

### Settings pages

The settings layout is ready, it only needs pages. Start with a route group.

```ts
// start/routes.ts
router
  .group(() => {
    router.on('/').renderInertia('settings/profile', {}).as('profile')
    router.on('/security').renderInertia('settings/security', {}).as('security')
  })
  .prefix('/settings')
  .as('settings')
  .use(middleware.auth())
```

List the pages in `items` inside `inertia/layouts/settings.tsx`. The sidebar highlights the current one.

```tsx
const items: NavItem[] = [
  { label: 'Profile', route: 'settings.profile', icon: User },
  { label: 'Security', route: 'settings.security', icon: Shield },
]
```

Each page nests the settings layout inside the app layout, so the sidebar persists as you move between pages.

```tsx
// inertia/pages/settings/profile.tsx
import { Head } from '@inertiajs/react'
import Section from '~/components/section'
import AppLayout from '~/layouts/app'
import SettingsLayout from '~/layouts/settings'

export default function Profile() {
  return (
    <>
      <Head title="Profile" />
      <Section title="Profile" description="This is how others will see you.">
        <div className="field">
          <label className="field__label" htmlFor="username">
            Username
          </label>
          <input className="field__input" id="username" name="username" />
          <p className="field__hint">This is your public display name.</p>
        </div>
      </Section>
    </>
  )
}

Profile.layout = [AppLayout, SettingsLayout]
```

Finally, add `{ label: 'Settings', route: 'settings.profile', icon: Settings }` to `nav` in the app layout. It stays active on every page under `/settings`.

Need another area with a sidebar, like reports or admin? Copy `layouts/settings.tsx`, change its heading and items. The `sidebar-layout` styles are shared.

---

## 📚 Learn More

<table>
  <tr>
    <td>
      <a href="https://docs.adonisjs.com"><strong>📖 AdonisJS Docs</strong></a>
      <br>
      <span>Complete guide to AdonisJS</span>
    </td>
    <td>
      <a href="https://inertiajs.com"><strong>🔄 Inertia.js</strong></a>
      <br>
      <span>Learn about server-driven SPAs</span>
    </td>
  </tr>
  <tr>
    <td>
      <a href="https://react.dev"><strong>⚛️ React Docs</strong></a>
      <br>
      <span>Modern React with hooks</span>
    </td>
    <td>
      <a href="https://docs.adonisjs.com/guides/frontend/api-client"><strong>🔒 Tuyau</strong></a>
      <br>
      <span>Type-safe routing and API calls</span>
    </td>
  </tr>
  <tr>
    <td>
      <a href="https://lucid.adonisjs.com"><strong>💾 Lucid ORM</strong></a>
      <br>
      <span>Database queries and relationships</span>
    </td>
    <td>
      <a href="https://vinejs.dev"><strong>✅ VineJS</strong></a>
      <br>
      <span>Schema validation guide</span>
    </td>
  </tr>
</table>

---

## 🎨 Philosophy

This starter kit embraces the **modern full-stack** approach to web development:

- **Server-Side Routing** - No API complexity, just controllers returning Inertia responses
- **Client-Side Experience** - React handles the UI with smooth SPA navigation
- **Type Safety Everywhere** - TypeScript across frontend and backend with Tuyau integration
- **Convention Over Configuration** - Sensible defaults, escape hatches when you need them
- **Developer Experience** - Hot reload, great error messages, instant feedback
- **Security foundations** - Security, validation, and tests require deployment-specific review

### Why Inertia.js?

Traditional SPAs require building and maintaining a separate API. Inertia.js eliminates this complexity by letting your controllers return data directly to your React components. You get the smooth navigation of a SPA with the simplicity of traditional server-side routing.

---

## 🤝 Contributing

This starter kit is maintained by the AdonisJS team. Found a bug or have a suggestion? [Open an issue](https://github.com/adonisjs/starter-kits/issues) or submit a pull request!

---

## 📄 License

This starter kit is open-sourced software licensed under the [MIT license](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by the AdonisJS team</sub>
</div>

### Organization setup (incomplete: shared data access is not enabled)

Migration `0054` introduces organizations and membership setup without changing any
existing `user_id`-owned data. It creates a separate personal organization for every
existing and newly created user; users with identical company names are never merged.
Existing per-user roles and entitlements remain in force. The setup page lets organization
administrators and platform super administrators manage membership for already-provisioned
active users and record an intended existing role. Membership changes are audited.

**This is not yet a shared tenant implementation.** Selecting or switching organizations
is unavailable; membership and recorded roles do not grant access to operational records,
and platform super administrators cannot yet browse other users' operational data via an
organization context. Household data remains under its existing user-scoped controls, but
this does not yet implement the requested super-admin exception. Do not present membership
setup as collaboration or rely on it as a complete SaaS tenancy boundary.

To finish shared workspaces safely, business records and their unique indexes must be
migrated to explicit organization ownership while retaining creator `user_id`; every
controller, service, background job, export, relationship and nested preload must use a
verified active organization context. Roles and module entitlements must be evaluated in
that context, with owner-only household finance access and the explicit super-admin
exception. Add a workspace selector, secure organization/member provisioning and revocation,
and integration tests for cross-organization access, concurrent updates, private records,
migrations, and all operational domains before enabling sharing. Existing data must remain
in each user's separate personal organization unless explicitly moved by an authorized,
audited operation.
