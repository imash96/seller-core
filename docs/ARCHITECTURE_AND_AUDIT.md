# Multi-User E-Commerce Operations & Business Management SaaS — Architecture, Audit & Verification Report

## 1. Phase 1 — Codebase & Environment Inventory

### 1.1 Runtime & Installed Package Versions

| Component                               | Installed Version                                     | Verified Source                        |
| :-------------------------------------- | :---------------------------------------------------- | :------------------------------------- |
| **Node.js Runtime**                     | `v22.22.3`                                            | `node -v`                              |
| **Package Manager**                     | `pnpm 12.14.0` / `npm 10.9.8`                         | `pnpm -v` / `npm -v`                   |
| **PostgreSQL Server**                   | `PostgreSQL 18.4` (`embedded-postgres` native binary) | `SELECT version()` on `127.0.0.1:5432` |
| **`@adonisjs/core`**                    | `^7.6.0`                                              | `package.json`                         |
| **`@adonisjs/lucid`**                   | `^22.4.2`                                             | `package.json`                         |
| **`@adonisjs/auth`**                    | `^10.1.0`                                             | `package.json`                         |
| **`@adonisjs/inertia`**                 | `^5.0.3`                                              | `package.json`                         |
| **`@adonisjs/session`**                 | `^8.1.0`                                              | `package.json`                         |
| **`@adonisjs/shield`**                  | `^9.0.0`                                              | `package.json`                         |
| **`@vinejs/vine`**                      | `^4.4.0`                                              | `package.json`                         |
| **`pg` (`node-postgres`)**              | `^8.23.1`                                             | `package.json`                         |
| **`react` / `react-dom`**               | `^19.3.0`                                             | `package.json`                         |
| **`tailwindcss` / `@tailwindcss/vite`** | `^4.3.3`                                              | `package.json`                         |

---

## 2. Phase 2 — Existing Codebase Audit & Defect Table

| #     | File / Location                                                             | Issue                                                                                                           | Severity                  | Root Cause                                                                                                                                                                                                                                                        | Impact                                                                                                                                            | Resolution                                                                                                                                    |
| :---- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | `start/routes.ts`, `.adonisjs/server/controllers.ts`                        | Public `/signup` route & `NewAccountController` reference                                                       | **Critical (Security)**   | Starter template registered public user registration routes (`GET/POST /signup`)                                                                                                                                                                                  | Violates mandatory policy: _"No public registration; only system super administrators can create users"_; allows unauthenticated account creation | Replaced `/signup` with explicit security block & redirect; implemented `RbacService.createUserBySuperAdmin()` and `POST /admin/users`        |
| **2** | `config/auth.ts`, `app/middleware/inertia_middleware.ts`, `start/routes.ts` | Missing `#models/user`, `#transformers/user_transformer`, `#controllers/session_controller`, `#validators/user` | **Critical (Build/Boot)** | Starter repo had configuration and route imports pointing to deleted/uncreated files                                                                                                                                                                              | Application failed `tsc --noEmit` and could not boot HTTP server                                                                                  | Implemented all 40 Lucid models (`app/models/*.ts`), `UserTransformer`, `SessionController`, `OperationsController`, and VineJS v4 validators |
| **3** | `database/migrations/*`, `database/schema.ts`                               | Zero migration files and empty `database/schema.ts`                                                             | **Critical (Data Layer)** | No schema or migrations existed in the repository                                                                                                                                                                                                                 | No tables existed for users, RBAC, orders, catalog, shipments, returns, or finance                                                                | Authored 40 ordered UUIDv7 Lucid migrations and auto-generated `database/schema.ts` (40 `*Schema` classes)                                    |
| **4** | `database/schema_rules.ts`                                                  | Custom PostgreSQL enum types & `jsonb` array parameters not mapped for Lucid schema generator / `pg` driver     | **High (ORM/DB)**         | Lucid's default schema generator only maps standard SQL types (`uuid`, `varchar`, `numeric`, etc.), skipping custom Postgres enums (`user_status`, `order_status`, etc.); `node-postgres` serializes JS arrays as `{a,b}` instead of JSON `["a","b"]` for `jsonb` | Enum columns lacked `@column()` decorators in `database/schema.ts` and `jsonb` array inserts threw `invalid input syntax for type json`           | Mapped all 44 PostgreSQL enum types and added a `jsonb`/`json` `prepare` hook in `database/schema_rules.ts`                                   |
| **5** | `config/shield.ts`                                                          | `xFrame: { enabled: true, action: 'DENY' }`                                                                     | **Medium (Preview)**      | Default Shield config sets `X-Frame-Options: DENY`                                                                                                                                                                                                                | Blocks live preview rendering inside an embedded browser iframe                                                                                   | Set `xFrame.enabled = false` in `config/shield.ts` and `server.allowedHosts = true` in `vite.config.ts`                                       |
| **6** | `package.json`                                                              | `"engines": { "node": ">=24.0.0" }`                                                                             | **Low (Tooling)**         | Engine constraint mismatched container Node `v22.22.3` runtime                                                                                                                                                                                                    | Package manager engine warnings                                                                                                                   | Updated `"engines": { "node": ">=22.0.0" }`                                                                                                   |

---

## 3. Phase 3 & 4 — Complete Relational Architecture & DBML (`database/schema.dbml`)

The complete, self-contained DBML specification lives in [`database/schema.dbml`](../database/schema.dbml) and was programmatically validated using `@dbml/core` (`Parser.parse(dbml, 'dbmlv2')` + `Exporter.export(db, 'postgres')` -> **40 tables, 44 enums, 98 foreign-key references, 0 syntax/reference errors**).

### 3.1 Key Normalization & Integrity Decisions

1. **UUIDv7 Primary Keys Everywhere**: Every table uses a `uuid` primary key (`DEFAULT gen_random_uuid()` in PostgreSQL + RFC 9562 time-ordered `uuidv7()` in Lucid `@beforeCreate()` hooks).
2. **Root User Ownership & Strict Tenant Isolation**: `users` is the root ownership table. All 35 user-owned operational tables include `user_id uuid NOT NULL REFERENCES users(id)` and composite indexes led by `user_id`.
3. **RBAC + Independent Module Entitlements**:
   - `roles`, `permissions`, `role_permissions` (`effect: 'allow' | 'deny'`), and `user_roles` support multi-role assignments where explicit `deny` overrides `allow`.
   - `module_entitlements` (`user_id`, `module_key`, `is_enabled`, `plan_tier`) is evaluated independently of role permissions so a user must pass **both** module entitlement and permission checks.
4. **Products & N-Dimensional Variations**:
   - `products` stores catalog parent metadata (`has_variants`, `variation_dimensions`).
   - `product_variants` stores sellable SKUs (1 default variant for simple products; N variants for multi-dimensional products) with `cost_price`, `manufacturing_cost`, `packaging_cost`, `retail_price`, `asin`, `barcode_gtin`, and stock counters.
   - `product_variant_attributes` normalizes `(product_variant_id, attribute_name, attribute_value)`.
5. **Orders, Idempotent Imports & Raw Payload Separation**:
   - `orders` and `order_line_items` store structured financial and fulfillment data (`numeric(19,4)` amounts, `numeric(19,8)` FX rates).
   - `order_import_payloads` isolates raw JSON marketplace payloads in a 1:1 satellite table with automatic secret redaction so analytical queries on `orders` never scan multi-kilobyte JSON blobs.
   - Unique index `(seller_account_id, external_order_id)` guarantees idempotent imports without duplicate orders.
6. **Many-to-Many Shipments & Carrier Invoice Reconciliation**:
   - `shipment_items` bridges `shipments` and `order_line_items` to support partial fulfillment, split shipments across multiple parcels, and multi-item parcels.
   - `shipping_invoice_lines` enforces a unique partial index on `(shipment_id, charge_type)` so carriers cannot double-bill the same shipment for the same surcharge category.
7. **Returns (RMA) & Refund Guards**:
   - `return_requests` links to `order_line_items` and validates requested quantities against `quantity_ordered - quantity_returned`.
   - `refund_transactions` validates refund totals against `total_amount - refunded_amount` to prevent double refunds.
8. **Multi-Currency Ledger & PCI-Safe Credit Cards**:
   - `financial_transactions` segregates `business` vs `household_personal` (`data_classification` enum) and stores `original_currency_code`, `original_amount`, `exchange_rate`, `reporting_currency_code`, and `reporting_amount`.
   - `credit_cards` stores only `last_4_digits` (`CHECK (char_length(last_4_digits) = 4)`), `exp_month`, `exp_year`, and `vault_token_reference` (never full PAN or CVV), and links to seller accounts via `credit_card_seller_accounts`.
