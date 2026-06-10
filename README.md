# Shipyard

An offline-first, installable PWA for tracking side projects — and the ideas,
features, changes, bugs, and tweaks that pile up around them. It's mobile-first,
works fully offline, and syncs across your devices when connected to Supabase.

## Features

- **Projects & tasks** — group work into projects, each with a description, tech
  stack, and integrations. Add tasks typed as Idea, Feature, Change, Bug, or
  Tweak.
- **Offline-first** — everything is stored locally and works with no network. The
  cloud is a sync target, not a requirement.
- **Cross-device sync** — sign in with Supabase to sync projects and tasks across
  devices, with last-write-wins merging and tombstones so deletes stick.
- **Installable PWA** — add to your home screen for an app-like, standalone
  experience with a custom splash screen.
- **Drag-to-reorder** tasks, sort/filter projects, and mark items complete.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Supabase ·
react-router-dom · @dnd-kit · vite-plugin-pwa

## Getting started

```bash
npm install
npm run dev
```

The app runs in **local-only** mode out of the box — no configuration needed.

### Enabling cloud sync (optional)

Copy the example env file and add your Supabase project credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Use only the **anon/public** key — never a service-role key or other secret. The
app expects two tables, `tl_projects` and `tl_tasks`, scoped per user via
`user_id`. Without these env vars the app still works fully, just without sync.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript with no emit |
| `npm run lint` | Lint the project with ESLint |

## Project structure

```
src/
  pages/        Dashboard, ProjectDetail, Settings
  components/   Shared UI (ConfirmDialog, SortMenu)
  store/        Zustand stores + sync engine
  lib/          Supabase client
  types/        Shared data model and constants
```

See [CLAUDE.md](CLAUDE.md) for a deeper architecture overview and contributor
conventions.
