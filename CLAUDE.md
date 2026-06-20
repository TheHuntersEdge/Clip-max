@AGENTS.md

# ClipMax

Auto-clipping platform for streamers. Connect a stream once → ClipMax pulls
the VOD, finds the best moments with AI, cuts vertical clips with captions, and
auto-posts across every connected account. Plus an account marketplace.

> Voice: direct, throughput-focused. "Clip everything. Post everywhere."

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** — dark theme; brand tokens are CSS variables in
  `src/app/globals.css` (`:root`) and exposed to Tailwind via `@theme`.
- **Prisma 7** + Postgres. Schema in `prisma/schema.prisma`. Prisma 7 uses a
  driver adapter (`@prisma/adapter-pg`) and generates the client to
  `src/generated/prisma` (gitignored). Connection URL lives in
  `prisma.config.ts` (reads `DATABASE_URL`).
- **NextAuth v5 (Auth.js)** — config in `src/auth.ts`, route at
  `src/app/api/auth/[...nextauth]/route.ts`, Prisma adapter, GitHub provider.

## Layout conventions

- All app pages live under the `src/app/(app)/` route group, which renders the
  `Sidebar` + `Topbar` shell. `/` redirects to `/dashboard`.
- The sidebar, breadcrumb, and each page's header copy all derive from one
  source of truth: `src/lib/nav.ts`. Add a route there and it appears in the nav.
- Phase 0 pages are empty shells rendered by `src/components/PageShell.tsx`.
- Visual spec / reference prototype: `design/ClipMax.html` — build to match it.
- Build brief & phase plan: `design/ClipMax_ClaudeCode_Brief.md`.

## Status

Phase 0 (scaffold) complete: theme, sidebar shell, 13 page shells, Prisma schema,
NextAuth wiring. Next: Phase 1 — the Twitch → clips → posted core loop.
