# Seller Core — Database & Architecture Redesign

> Full 7-phase engagement deliverable: audit → defect table → redesign → implementation →
> verification → security review → complete Astryx UI. Authoritative schema artifacts live in
> `database/schema.dbml`, `database/migrations/` (43 files) and `database/schema.ts`.

---

## 1. Complete validated DBML

**Authoritative artifact:** [`database/schema.dbml`](../database/schema.dbml) — 41 tables,
44 enums, ULID primary keys, money as `numeric` (14,2) / rates (18,8), partial unique indexes
for idempotent marketplace imports, CHECK constraints on money/quantities/PCI fields.

Validation summary (exercised against local PostgreSQL 18.4 and applied verbatim to Supabase):

| Check | Result |
|---|---|
| Fresh `migration:run` | ✅ 43/43 applied |
| `migration:rollback` + re-migrate | ✅ clean |
| `db:seed` full business dataset | ✅ (users, RBAC, orders, shipments, finance, tasks…) |
| 11 integration tests | ✅ 11/11 passing |
| `tsc` (server + client) | ✅ clean |
| `eslint` | ✅ clean |
| HTTP smoke: login + 13 pages + create/update/delete | ✅ live-verified |

## 2. Table inventory (added / modified / removed)

All legacy tables were rebuilt from scratch (legacy DBML was reference-only). Final set — **41
tables**, every business table carrying `user_id` (tenant ownership):

| # | Table | Purpose |
|---|---|---|
| 1 | `users` | Root ownership entity; super-admin flag; **no public registration** |
| 2 | `roles` / 3 `permissions` / 4 `role_permissions` / 5 `user_roles` | Multi-role RBAC with `permission_effect` allow/**deny** |
| 6 | `module_entitlements` | Module gating independent of role permissions |
| 7 | `user_sessions` / 8 `password_reset_tokens` | Session & reset security |
| 9 | `audit_logs` | Append-only, checksummed change history (DB triggers) |
| 10 | `sales_channels` / 11 `seller_accounts` | Channels + connected seller accounts (AES-256-GCM credentials) |
| 12 | `sync_jobs` / 13 `sync_job_errors` | Idempotent import jobs + per-record error capture |
| 14 | `financial_accounts` / 15 `credit_cards` / 16 `credit_card_seller_accounts` | Accounts, PCI-safe cards (last4 only), card↔account usage |
| 17 | `finance_categories` | Income/expense taxonomy with cost buckets |
| 18 | `customers` / 19 `customer_addresses` | Customers + normalized addresses (fingerprint) |
| 20 | `customer_risk_signals` | **Explainable** risk signals + manual review (never auto-fraud) |
| 21 | `brands` / 22 `product_categories` / 23 `products` | Catalog |
| 24 | `product_variants` / 25 `product_variant_attributes` | 0..N variants + normalized attributes |
| 26 | `channel_listings` | Per-channel publication, price, allocated qty |
| 27 | `orders` / 28 `order_line_items` | Orders with full P&L columns + multi-currency |
| 29 | `order_import_payloads` | Raw marketplace payloads (redacted) for audit/replay |
| 30 | `shipments` / 31 `shipment_items` | M:N shipments ↔ order lines (partial & split fulfillment) |
| 32 | `shipping_invoices` / 33 `shipping_invoice_lines` | Carrier invoice reconciliation, duplicate-charge guard |
| 34 | `return_requests` | RMA lifecycle with quantity limits |
| 35 | `refund_transactions` | Refunds with over-refund protection + external IDs |
| 36 | `marketplace_claims` | A-to-Z / chargeback tracking |
| 37 | `financial_transactions` | Multi-currency ledger (business vs household) |
| 38 | `tasks_reminders` | Tasks/reminders with entity links |
| 39 | `saved_views` | Per-module saved filter presets |
| 40 | `outbox_events` | Transactional outbox |
| 41 | `notifications` | In-app/email notifications |

Removed vs legacy design: `category_handle`, legacy `products.list_price/sale_price` scalars
(replaced by jsonb multi-currency arrays + variant scalar prices), `3pl_*` columns (renamed
`third_party_tracking_number/url`), UUID PKs (replaced by ULIDs), `customers.normalized_email`
unique (deliberately removed — duplicates possible by design, resolved via merge).

## 3. Relationship & cardinality summary

- **users 1:N** every business table (`user_id` CASCADE on user delete; audit SET NULL).
- **users M:N roles** via `user_roles` (+ `assigned_by`, `expires_at`).
- **roles M:N permissions** via `role_permissions` with `effect allow|deny` — **deny wins**.
- **users 1:N module_entitlements** (unique `user_id+module_key`).
- **sales_channels 1:N seller_accounts** (RESTRICT delete), **users 1:N seller_accounts**.
- **customers 1:N customer_addresses**; `customers.merged_into_customer_id` self-FK (non-destructive merge).
- **products 1:N product_variants 1:N product_variant_attributes**; products N:1 brands/categories.
- **product_variants M:N seller_accounts** via `channel_listings`.
- **orders N:1 customers** (RESTRICT), N:1 seller_accounts, 1:N order_line_items; lines N:1 product_variants (SET NULL).
- **orders M:N order_lines** via `shipment_items` (qty per line per shipment → partial/split shipments).
- **shipments 1:N shipping_invoices → shipping_invoice_lines** (unique `(shipment_id, charge_type)` unless `allow_duplicate_charge`).
- **orders 1:N return_requests → refund_transactions**; refunds N:1 financial_transactions.
- **financial_accounts 1:N financial_transactions / credit_cards / shipping_invoices**.
- **credit_cards M:N seller_accounts** via `credit_card_seller_accounts` (usage purpose).

## 4. Migration plan

1. **Schema**: 43 Lucid migrations (`1760000000001` … `1760000000043`), FK-safe creation order,
   all uniques/partial-uniques emitted as `CREATE [UNIQUE] INDEX`, `schema.raw` for CHECK-heavy DDL.
   Migration 43 installs audit capture triggers + append-only guard on `audit_logs`.
2. **Data**: idempotent `database/seeders/main_seeder.ts` (RBAC catalog, 2 users, demo commerce data).
3. **Remote (Supabase `crkeaefnyylspyoadiim`)**: applied via connector as
   `schema_part0..part5` migrations (enums → tables → PKs/checks → FKs → indexes →
   audit functions/triggers → `adonis_schema` bookkeeping with the 43 Lucid names). Verified:
   43 tables, 44 enums, 171 constraints, 146 indexes, audit triggers live.
4. **Bookkeeping**: Lucid tracks in `adonis_schema(name, batch, migration_time)` +
   `adonis_schema_versions(version=2)`; names are `database/migrations/<file-without-ext>`.

## 5. Lucid migrations

Generated into `database/migrations/` — one file per table plus enum-types and audit-trigger
migrations. Money columns: `decimal(14,2)`; FX rates `decimal(18,8)`. `product_variants.stock_available`
is a STORED generated column (`stock_on_hand - stock_reserved`). `database/schema.ts` is
auto-generated on every `migration:run` (jsonb `prepare` serializers included).

## 6. Models, enums, validators, seeders

- **Models** (41 + `base_model.ts` + `json_helpers.ts`): prefixed ULID PKs via `generateEntityId()`
  (`app/utils/generate_entity_id.ts`, `@beforeCreate` hook keyed on `static idPrefix`), full
  relation graph (belongsTo on every FK, hasMany inverses, hasManyThrough for roles/permissions).
  Specials: `user.ts` (AuthFinder + email normalization), `seller_account.ts`
  (AES-256-GCM `setPlainCredentials`/`getDecryptedCredentials` via `app/utils/secret_box.ts`),
  `audit_log.ts` (SHA-256 checksum hook).
- **Enums** (`app/enums/index.ts`): 44 typed const objects aligned 1:1 with DB enum types.
- **Validators** (`app/validators/operations.ts`, `user.ts`, `helpers.ts`): VineJS 4.4 with
  `objectId()` entity-id rule (replaces `uuid()`), create+update validators for every mutation.
- **Seeder** (`database/seeders/main_seeder.ts`): roles/permissions/entitlements, super admin +
  merchant user (`admin@sellercore.io` / `ops@sellercore.io`, password `Password123!`), channels,
  seller accounts, catalog, customers, orders with P&L, shipments, invoices, returns, refunds,
  claims, ledger transactions, credit cards, tasks.

## 7. Security & user-isolation review

| Control | Implementation |
|---|---|
| No public registration | `/signup` blocked at router; only super admins create users (`RbacService.createUserBySuperAdmin`) |
| Tenant isolation | Every business row carries `user_id`; every query in services/controllers filters `user_id = auth.user.id` (verified by test 5) |
| RBAC deny-overrides-allow | `role_permissions.effect` — any DENY for a permission wins (test 2) |
| Module entitlements | Evaluated independently of permissions (test 2) |
| Credentials at rest | AES-256-GCM, key from `APP_KEY`-derived keyring (`secret_box.ts`); never serialized (test 3) |
| PCI | Credit cards store last-4 only; CHECK `last_4_digits ~ '^[0-9]{4}$'`, exp 1–12/2000–2100 (test 10); no PAN/CVV anywhere |
| Passwords | scrypt via `withAuthFinder`; `$scrypt$` PHC hashes; never serialized (`serializeAs: null`) |
| Sessions | Hashed session tokens (`user_sessions.session_token_hash`), revocation, expiry |
| CSRF | `@adonisjs/shield` enabled with XSRF cookie; verified in HTTP smoke |
| Audit | DB triggers capture INSERT/UPDATE/DELETE on all business tables; `audit_logs` append-only (trigger rejects UPDATE/DELETE); SHA-256 checksums (test 11) |
| Fraud policy | Risk signals are explainable + manually reviewed; no automatic fraud labels |
| Customer merge | Non-destructive (`merged_into_customer_id`), orders keep history |

## 8. Test / typecheck / validation results

`node ace test` — **11/11 passing** (`tests/unit/architecture_and_operations.spec.ts`):

1. ULID entity ids & super-admin-only user provisioning (non-super-admin blocked)
2. RBAC explicit DENY overrides ALLOW + module entitlements independent
3. Seller credentials AES-256-GCM encrypted at rest
4. Products with 0 variation dimensions and multi-dimensional variants
5. Manual order creation, multi-currency P&L conversion, strict user_id isolation
6. Bulk import idempotency, duplicate skip, raw payload redaction, partial error capture
7. Partial shipments, split shipments, delivery-notification outbox, carrier invoice duplicate protection
8. RMA quantity validation and over-refund protection
9. Multi-currency transactions (business vs household) & PCI-safe credit cards
10. CHECK constraints reject invalid money and invalid last-4
11. Audit history captures INSERT/UPDATE/DELETE; audit_logs append-only

Also verified: `pnpm typecheck` ✅ · `pnpm lint` ✅ · fresh migrate → rollback → migrate → seed ✅ ·
HTTP smoke (login + 13 pages + customer create/update/delete) ✅ · Supabase schema parity ✅.

## 9. Unresolved questions / assumptions

- Reporting currency fixed to the user's `default_currency` (USD in seed) for P&L; company-level
  reporting currency would need a settings table.
- FX rates are stored per order/transaction (caller-supplied); no rate-provider integration yet.
- Inventory reservation logic (`stock_reserved`) is modeled but no background allocation job exists.
- Supabase `pg_cron`/logical replication outbox drain is configured only as data model + status flow.
- Generated model tooling lives outside the repo (`/tmp`); `database/schema.dbml` is regenerable
  from the migrations via the documented export script (`tmp/export_ddl.mjs` pattern).
- Test suite runs against `seller_core_test` (config auto-switches on `NODE_ENV=test`).

## 10. UI — complete CRUD workspace (Astryx)

Every route has a full end-to-end view (`inertia/pages/`) built exclusively on
`@astryxdesign/core` + `@stylexjs/stylex` (Babel plugin wired through a Vite pre-transform) +
`@astryxdesign/theme-neutral` (`inertia/astryx_themes.ts` via `@astryxdesign/cli theme add neutral`).
Custom UI components were **removed** (`inertia/components/*` deleted); app glue composes Astryx
primitives only (`inertia/lib/ui.tsx`).

| Route | Page | CRUD coverage |
|---|---|---|
| `/` | `home` | Marketing landing |
| `/login` | `auth/login` | Session auth (CSRF-protected) |
| `/signup` | `auth/signup` | Registration disabled notice |
| `/dashboard` | `dashboard` | KPI grid (gross sales, fees, COGS, net profit, business vs household), module summaries |
| `/orders` | `orders` | Create order, bulk import, status workflow, delete, economics table |
| `/customers` | `customers` | Create, update, merge, delete, risk-signal review |
| `/products` | `products` | Product create/update/delete, variant create/delete/stock, brand & category CRUD, channel listings |
| `/seller-accounts` | `accounts` | Connect/update/disconnect accounts, status & health |
| `/shipments` | `shipments` | Create shipment (partial/split), status workflow, carrier invoice create + reconciliation |
| `/returns` | `returns` | RMA create + lifecycle status, refunds with amount limits |
| `/claims` | `claims` | Open claim, status lifecycle |
| `/finance` | `finance` | Financial accounts CRUD, credit cards CRUD (PCI-safe), ledger record + void, categories |
| `/tasks` | `tasks` | Task create/update/complete/delete + saved views |
| `/import` | `import` | Idempotent bulk import + sync job error review |
| `/admin` | `admin` | Super-admin user provisioning, role assign/revoke, entitlements toggle, permission catalog |
| `/audit` | `audit` | Append-only audit trail with changed-field display |

All mutations POST to the routes in `start/routes.ts`, validated by Vine validators, executed in
`OperationsController` (services layer for orders/fulfillment/returns), and redirect back with
flash feedback rendered in `inertia/layouts/app.tsx` (AppShell + TopNav + SideNav).

## Defect table (pre-implementation audit)

| Issue | Affected | Why it matters | Fix | Blocker / Improvement |
|---|---|---|---|---|
| Legacy UUIDv7/gen_random_uuid PKs | all tables | Requirement: ULID `generateEntityId()` everywhere | Replaced with `ulid` varchar(64) prefixed PKs + `@beforeCreate` hook | Blocker |
| `products.category_handle` denormalized | products | Drift risk vs categories | Dropped; FK `category_id` only | Improvement |
| Scalar `list_price`/`sale_price` on products | products | Single-currency limitation | jsonb `[{currency_code, price}]` + variant scalar prices | Improvement |
| `3pl_tracking_*` naming | shipments | Non-standard naming | `third_party_tracking_number/url` | Improvement |
| Unique on `customers.normalized_email` | customers | Blocks legitimate duplicates & merge flow | Removed unique; merge via `merged_into_customer_id` | Blocker |
| No `user_id` on business tables | all | Multi-tenant isolation impossible | `user_id` FK on every business table | Blocker |
| Marketplace re-import duplicates | orders | Double-charged operations | Partial unique `(seller_account_id, external_order_id)`, `(order_id, external_order_line_id)`, payload hash capture | Blocker |
| Carrier duplicate charges | shipping_invoice_lines | Billing errors | Partial unique `(shipment_id, charge_type)` unless `allow_duplicate_charge` | Blocker |
| Return qty not bounded | return_requests | Over-refund / over-return | CHECKs + service-level caps vs ordered/returned | Blocker |
| Float money columns | finance | Rounding corruption | `numeric(14,2)` / `(18,8)` with CHECKs | Blocker |
| PAN/CVV risk in legacy card table | credit_cards | PCI scope | Last-4 only + CHECKs; no PAN/CVV columns | Blocker |
| No audit trail | all | Compliance | `audit_logs` + DB triggers + append-only guard + checksums | Blocker |
| Auto-fraud on shared address | customers | False positives | Explainable `customer_risk_signals` + manual review | Blocker (policy) |
| Role allow/deny ambiguity | rbac | Security holes | `permission_effect` with deny-overrides-allow | Blocker |
| Public registration | users | Security policy | Route disabled; super-admin provisioning only | Blocker |
| No transactional outbox | integrations | Lost side effects | `outbox_events` table + delivery workflow | Improvement |
| `products.title` lengths per channel | products | Marketplace limits | `title_75/title_80/sub_title_125` nullable fields | Improvement |
| Double password hashing (AuthFinder + custom hook) | users | All logins broken | Removed duplicate hook; AuthFinder owns hashing | Blocker |
| Swapped hasManyThrough keys (`User.roles`) | rbac models | 500 on dashboard | Corrected `throughLocalKey/throughForeignKey/foreignKey` mapping | Blocker |
| Tests ran against dev database | test infra | Data loss on every test run | Config switches to `seller_core_test` on `NODE_ENV=test` | Blocker |
| Missing audit triggers in migrations | audit | Requirements gap | Migration `…043_create_audit_triggers` (capture + append-only) | Blocker |
