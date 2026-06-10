# CLAUDE.md

Guidance for working in this repository.

## What this is

**Shipyard** is an offline-first, installable PWA for tracking side projects and
the ideas, features, changes, bugs, and tweaks that belong to them. It is
mobile-first (the layout is capped at `max-w-md`) and works fully offline; when
Supabase credentials are present it also syncs across devices.

## Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # tsc -b type-check + production build
npm run typecheck  # tsc -b --noEmit, no emit
npm run lint       # ESLint over the repo
npm run preview    # serve the production build locally
```

There is no test suite. After meaningful changes, verify with `npm run typecheck`
and `npm run lint`.

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config` — configured
  in CSS; see `src/index.css`)
- **Zustand** (with `persist` middleware) for state
- **Supabase** (`@supabase/supabase-js`) for auth + cloud sync
- **react-router-dom v7** for routing
- **@dnd-kit** for drag-and-drop task reordering
- **lucide-react** for icons
- **vite-plugin-pwa** (Workbox) for the installable/offline PWA

## Architecture

State lives in two Zustand stores; the cloud is a sync target, not the source of
truth.

- [src/store/useProjectStore.ts](src/store/useProjectStore.ts) — the heart of the
  app. Holds `projects` and `tasks`, all mutations, and is persisted to
  `localStorage` under the key `project-tracker-v1`. This is the **local-first
  source of truth**: every action writes here first and the UI reads from here.
  - Tracks `deletedProjectIds` / `deletedTaskIds` as **tombstones** so deletes
    propagate to the cloud instead of being resurrected on the next pull.
  - `applyCloudSnapshot` does last-write-wins merging by `updatedAt`, skipping
    tombstoned ids.
  - Has a `persist` `migrate` with a `version` — **bump the version and add a
    migration step whenever you change the persisted shape.**
- [src/store/useAuthStore.ts](src/store/useAuthStore.ts) — Supabase session +
  sync status (`idle | syncing | synced | error | offline`).
- [src/store/sync.ts](src/store/sync.ts) — the sync engine. `initSync()` (called
  in [src/main.tsx](src/main.tsx)) subscribes to both stores: project changes
  are debounced (~1.5s) then pushed; auth changes trigger a full sync; `online`
  and `focus` window events re-sync. `pullCloud` sets a `suspendPush` flag so an
  incoming snapshot doesn't echo back as a push.
- [src/lib/supabase.ts](src/lib/supabase.ts) — creates the client. If env vars
  are missing, `supabase` is `null` and `isSupabaseConfigured` is `false`; the
  whole app must keep working in this **local-only** mode (every sync function
  early-returns on a null client).

### Data model

Types are centralized in [src/types/index.ts](src/types/index.ts): `Project`,
`Task`, `TaskType` (`Idea | Feature | Change | Bug | Tweak`), `TechStack`, and
`ProjectSort`. Use these constants (`TASK_TYPES`, `TECH_STACK_FIELDS`,
`PROJECT_SORTS`) rather than re-listing values inline.

The Supabase tables are `tl_projects` and `tl_tasks`. The store uses **camelCase**
(`projectId`, `updatedAt`); the DB rows use **snake_case** (`project_id`,
`updated_at`). The `rowTo*` / `*ToRow` mappers in `sync.ts` are the single
boundary between the two — keep all naming translation there.

### Routing & pages

[src/App.tsx](src/App.tsx) defines three routes; `Dashboard` is eager, the others
are lazy:

- `/` → [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — project list, create
  form, sort/filter.
- `/project/:id` → [src/pages/ProjectDetail.tsx](src/pages/ProjectDetail.tsx) —
  tasks, drag-to-reorder, edit project.
- `/settings` → [src/pages/Settings.tsx](src/pages/Settings.tsx) — auth + sync.

Shared UI lives in [src/components/](src/components/) (`ConfirmDialog`,
`SortMenu`).

## Conventions

- **Local-first, always.** Mutations go through `useProjectStore` actions, which
  set timestamps (`Date.now()`) and `updatedAt`. Never write to Supabase
  directly from a component — let the debounced sync push it.
- **Guard for the unconfigured case.** Anything touching `supabase` must handle
  it being `null`.
- Use the `uid()` helper in the store for ids (prefers `crypto.randomUUID`).
- Tailwind utility classes only; the dark slate theme and background gradients
  are set in [index.html](index.html) and `src/index.css`.
- TypeScript is strict — prefer `import type` for type-only imports (the lint
  config and existing code follow this).

## Setup

Copy [.env.example](.env.example) to `.env` and fill in `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` to enable cloud sync. Without them the app runs
local-only. Only the Supabase **anon/public** key belongs here — never commit a
service-role key or any secret.
