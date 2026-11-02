# AGENTS.md

Project-specific guidance for AI coding agents.

<!-- ASTRYX:START -->

Astryx v0.7.1 · 168 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:

1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx template <Block>` for parts it lacks; `astryx component <Name>` to read props before using one.
   Changing an existing page? Keep it: skip step 2 and add blocks/components inside its sections.

RULES:

- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then Tailwind utilities backed by tokens. No raw hex/px.
- Palettes and custom colors go through the theme, never :root overrides. Run `astryx theme add <slug>` to import; `theme eject <slug>` only forks source. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any style={{…}}, raw <div>/<span>, imported .css/@apply, or hardcoded/arbitrary value (bg-[#fff], p-[13px]) with the component or a token-backed utility.

`astryx help` lists every command. Key ones beyond the workflow:
search "<query>" find any component / hook / doc / template
discover <words> integrations you could add
docs <topic> getting-started, principles, tokens, theme … (`astryx docs` lists all)
docs cli commands, API reference, integration authoring
upgrade --from <old version> --apply run after a dependency bump
<!-- ASTRYX:END -->

## Local development & verification

WebSSH-free local loop (embedded Postgres shipped as a devDependency):

```bash
pnpm db:start                 # embedded PostgreSQL on 127.0.0.1:5432
pnpm db:migrate && pnpm db:seed
NODE_ENV=test node ace serve   # port 3333, test DB — required by tests/functional/*
pnpm test                      # in another shell
pnpm typecheck                 # tsc (server) + tsc (inertia)
pnpm db:schema:check           # fails if schema.dbml / supabase_schema.sql drift
```

`tests/functional/*` talk to a live server on `http://localhost:3333`, and that server
must run with `NODE_ENV=test` so it shares `TEST_DATABASE_URL` with the test runner.
Run the app for manual browsing with plain `node ace serve` (development DB) instead.
