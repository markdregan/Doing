# Things Task App — Agent Guide

## Stack (verified from config)
Vite 8 + React 19 + TypeScript 6 + Tailwind v4 + Zustand 5 + Supabase + @dnd-kit + react-router-dom 7

Testing: Vitest + @testing-library/react + @testing-library/jest-dom + jsdom.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | `tsc -b && vite build` — **both** typecheck AND bundle |
| `npm run lint` | ESLint on all files |
| `npm run preview` | Preview production build |
| `npm test` | `vitest run` — run all tests once |

Build order matters: `tsc -b` before `vite build`. The `build` script does both.

## TypeScript quirks

`tsconfig.app.json` has `"strict": true`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.

- `verbatimModuleSyntax` means `import type` for type-only imports or you'll get errors
- `erasableSyntaxOnly` bans `enum` and `namespace` — use `as const` objects instead
- `noUnusedLocals` + `noUnusedParameters` will fail the build, not just warn

## Tailwind v4 (no config file)

No `tailwind.config.js`. Everything is CSS-first in `src/index.css`:
- `@import "tailwindcss"` replaces the old `@tailwind` directives
- `@theme {}` block for font/color tokens
- Custom variants via `@custom-variant dark (&:where(.dark, .dark *))` — class-based dark mode

Dark mode is toggled by the `dark` class on `<html>`. Things 3-inspired palette is hardcoded as `dark:` variants in each component.

## Architecture

```
src/main.tsx          → BrowserRouter → App.tsx → Routes
src/App.tsx           → /auth (AuthPage) | / (ProtectedRoute → AppShell)
src/AppShell          → DndContext wraps Sidebar + TaskList + DragOverlay + QuickEntry
src/store/
  useAuthStore.ts     → Supabase session, signInWithGithub, signOut, initialize
  useTaskStore.ts     → Tasks + Projects CRUD, reorder, Supabase sync, dataLoading
  useThemeStore.ts    → dark/light toggle, localStorage persistence
src/components/
  Sidebar.tsx         → Sortable projects, task counts, dark toggle, sign out
  TaskList.tsx        → SortableContext for visible tasks
  DraggableTaskItem.tsx → useSortable wrapper
  TaskItem.tsx        → inline editing, notes editor, due date picker
  QuickEntry.tsx      → Cmd+K palette with project picker + today toggle
  AuthPage.tsx        → Login with GitHub only
  ProtectedRoute.tsx  → Auth guard, initializes task store on login
```

## Supabase integration

- Client initialized from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars
- RLS on all tables via `auth.uid() = user_id`
- Store uses explicit `taskFromRow`/`taskToRow` and `projectFromRow`/`projectToRow` mappers for snake_case ↔ camelCase
- Optimistic local updates with Supabase sync; errors log but don't revert (except `toggleTask` and `deleteProject`)
- Batch sort-order updates use `Promise.all` on individual updates
- `crypto.randomUUID()` generates client-side IDs before Supabase insert

### Agent access (admin-level)

`.env` contains these additional variables (all gitignored):

| Variable | What it's for |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase-js client with admin privileges (bypasses RLS) |
| `SUPABASE_PAT` | Personal Access Token for Management API (DDL, SQL queries) |
| `SUPABASE_PROJECT_REF` | Project reference (`cpebokrbgpjzdkuagkcf`) |

**Run arbitrary SQL (DDL, queries, migrations):**
```bash
node --env-file .env scripts/run-sql.mjs "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_someday boolean NOT NULL DEFAULT false;"
```

**Ad-hoc data queries with service_role (bypasses RLS):**
```bash
node --env-file .env -e "
import { supabase } from './scripts/supabase.mjs';
const { data, error } = await supabase.from('tasks').select('id, title, is_someday').limit(10);
console.log(JSON.stringify(data, null, 2));
"
```

## Drag and drop (@dnd-kit)

IDs are prefixed: `task-${task.id}` for tasks, `project-${project.id}` for projects. Active/over types are distinguished via `data.type` ('task' | 'project'). Cross-container drag (task → sidebar project) updates `projectId` in store. Sortable handles within `verticalListSortingStrategy`.

## Views

- **Inbox** — tasks with no project (`projectId === null`), default landing view
- **Today** — tasks marked as today or due today
- **Someday** — tasks flagged with `isSomeday`, hidden from all other uncompleted views
- **All** — all uncompleted tasks (excluding someday)
- **Project** — tasks within a specific project

## Routes

- `/auth` — Login page (GitHub OAuth). Redirects to `/` if already authenticated.
- `/` — Protected. Shows app shell. Redirects to `/auth` if unauthenticated.

## Key conventions

- **No comments** on code — `AGENTS.md` is the documentation surface
- All Zustand stores use `create<Interface>()()` (no `persist` middleware anymore — data is authoritative from Supabase)
- Dark theme toggle persists to `localStorage('things-theme')` — respects `prefers-color-scheme` on first visit
- `.env` is gitignored. Must contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `useTaskStore.clearAll()` resets all state — called on sign-out via auth store subscription

## Testing conventions

- **Vitest** with jsdom environment, no global test APIs (import from `vitest` explicitly)
- **Co-located** test files next to source files: `src/store/useTaskStore.test.ts`, `src/components/TaskItem.test.tsx`
- **Supabase mocking**: use `vi.mock('../lib/supabase')` with `vi.hoisted()` for mock variables. Store tests need a query builder mock with chainable methods (`select`, `insert`, `update`, `delete`, `eq`, `order`)
- **Component mocking**: mock Zustand stores with `vi.mock('../store/useStore')` + `vi.mocked(useStore).mockImplementation()` to return specific selector values
- **DOM cleanup**: import `cleanup` from `@testing-library/react` and call it in `afterEach` for component tests
- **Test wrapper**: components using `useNavigate` need `<MemoryRouter>` wrapper
- **Avoid testing module-initialization logic** (e.g., `getInitialTheme` runs once at module load) — test behavior instead (toggle, state changes)
- Always run `npm test` and `npm run build` after adding/modifying tests to verify both pass
