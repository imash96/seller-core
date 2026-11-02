# Final verification checklist

The six checks below must all pass with zero errors before a release. They are run
verbatim; this page records what each one actually proves and the prerequisites it
needs, so a failure can be attributed instead of guessed at.

## Prerequisites

```bash
cp .env.example .env          # DATABASE_URL, TEST_DATABASE_URL, APP_KEY, SESSION_DRIVER
node ace generate:key         # paste the printed key into APP_KEY
node pgstart.mjs              # embedded PostgreSQL 18 when no system server is installed
createdb seller_core && createdb seller_core_test   # or create them by any other means
```

`TEST_DATABASE_URL` is mandatory: the suite migrates the target database and reverts
every migration again per run, so the test runner refuses to start without it and
`config/database.ts` throws rather than falling back to `DATABASE_URL`.

`SESSION_DRIVER=database` is required for session revocation — logout-everywhere,
suspended accounts and the login lockout specs read the `sessions` registry, which
the `cookie` driver never populates.

## 1. DBML syntax and PostgreSQL DDL export parity

```bash
node -e "const { Parser, exporter } = require('@dbml/core'); const fs = require('fs'); const dbml = fs.readFileSync('database/schema.dbml', 'utf8'); Parser.parse(dbml, 'dbml'); exporter.export(dbml, 'postgres'); console.log('DBML valid');"
pnpm db:schema:check
```

The first command proves `database/schema.dbml` parses and exports to PostgreSQL DDL.
`db:schema:check` is the parity half: it compares the DBML against the live schema
(columns, indexes, CHECK constraints) and the generated `database/supabase_schema.sql`,
and fails when either artifact has drifted from the migrations. Both scripts load
`.env` themselves, so an unset `DATABASE_URL` can no longer point them at the
maintenance database.

## 2. Rollback, migration, schema generation and idempotent seeding

```bash
node ace migration:rollback --batch=0   # every migration reverts cleanly
node ace migration:run                  # fresh schema + regenerated database/schema.ts
node ace db:seed
node ace db:seed                        # second run must not duplicate rows
```

Rollback reports zero remaining tables; `migration:run` rebuilds all 47 tables and
regenerates `database/schema.ts` deterministically (same checksum on every run).
Seeding twice leaves identical row counts (2 users, 4 roles, 72 permissions,
3 products, 4 variants, 4 orders, 456 audit rows, 5 outbox events) — the seeders
upsert by natural key, so re-running on a populated database is a no-op.

## 3. TypeScript and ESLint

```bash
pnpm typecheck   # tsc --noEmit (backend) + tsc --noEmit --project inertia/tsconfig.json
pnpm lint        # eslint .
pnpm format:check
```

Both TypeScript projects must compile with zero errors, and the whole tree must be
lint- and Prettier-clean.

## 4. Astryx UI self-check

```bash
! grep -rn "<div\|<span\|style={{" inertia/pages/ inertia/layouts/
```

Pages and layouts compose Astryx primitives only. Raw `<div>`/`<span>` and inline
`style={{ … }}` survive only inside `inertia/components/atoms` and
`inertia/components/molecules`, where wrapping a primitive is the component's job.
Dynamic bar widths go through `ProgressMeter`, which owns the one legitimate inline
width.

## 5. Full test suite

```bash
node ace test
```

Japa unit + functional suites run against `seller_core_test` with migrations applied
per run. The functional suites boot the real HTTP server, so CSRF, session, RBAC and
tenant-isolation behaviour is exercised end to end.

## 6. Production build

```bash
pnpm build
```

`node ace build` compiles the server, type-checks the build, bundles the Inertia
assets and copies meta files into `build/`. A build that compiles is not proof the
app boots, so the compiled output is also smoke-tested:

```bash
cd build && node bin/server.js          # needs a .env in build/
```

Against that server: `/` renders the login page (SSR), `POST /` with the seeded
admin authenticates and redirects to `/dashboard`, and every authenticated page
(`/dashboard`, `/orders`, `/products`, `/finance`, `/customers`, `/returns`,
`/shipments`, `/catalogs`, `/inventory`, `/listings`, `/import`, `/claims`,
`/admin`, `/organizations`) answers `200` with the expected Inertia component.
Assets are served from `/assets/*`. With `NODE_ENV=production` the app additionally
refuses to boot on a non-HTTPS `APP_URL`, a low-entropy `APP_KEY` or the `memory`
session driver (`app/utils/production_config.ts`).

## Last verified run

| Step                              | Result                                                                |
| --------------------------------- | --------------------------------------------------------------------- |
| 1. DBML + export parity           | `DBML valid`, DBML and Supabase SQL in sync (45 documented tables)    |
| 2. Rollback → migrate → seed ×2   | clean revert, 47 tables rebuilt, `schema.ts` stable, counts unchanged |
| 3. Typecheck / lint / format      | 0 errors, 0 warnings                                                  |
| 4. Astryx grep                    | no matches                                                            |
| 5. `node ace test`                | 215 passed / 215                                                      |
| 6. `pnpm build` + boot smoke test | build completed, all 14 pages served                                  |
