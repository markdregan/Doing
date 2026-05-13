# Doing Task App — Agent Guide

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
src/App.tsx           → /auth (AuthPage) | /invite (InvitePage) | / (ProtectedRoute → AppShell)
src/AppShell          → DndContext wraps Sidebar + TaskList + DragOverlay + QuickEntry
src/store/
  useAuthStore.ts     → Supabase session, signInWithGithub, signOut, initialize
  useTaskStore.ts     → Tasks + Projects CRUD, reorder, Supabase sync, dataLoading, sharing, assignment
  useThemeStore.ts    → dark/light toggle, localStorage persistence
src/components/
  Sidebar.tsx         → Sortable projects, task counts, dark toggle, sharing (per-project), sign out
  TaskList.tsx        → SortableContext for visible tasks (including Assigned view)
  DraggableTaskItem.tsx → useSortable wrapper
  TaskItem.tsx        → inline editing, notes, due date picker, assignee badge (initials/avatar)
  TaskFooter.tsx      → action bar with assign button, date, tags, project, repeat
  AssigneePicker.tsx  → email search + project collaborator list for task assignment
  ShareDialog.tsx     → email input → share with existing user OR invite non-user by email
  InvitePage.tsx      → handles /invite?token=xxx — redeem or prompt sign-in
  QuickEntry.tsx      → Cmd+K palette with project picker + today toggle
  AuthPage.tsx        → Login with GitHub only
  ProtectedRoute.tsx  → Auth guard, checks for pending invite token, initializes task store
```

## Supabase integration

- Client initialized from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars
- RLS policies: tasks accessible by owner, shared project members, or assignees. Projects accessible by owner or shared users.
- Store uses explicit `taskFromRow`/`taskToRow` and `projectFromRow`/`projectToRow` mappers for snake_case ↔ camelCase
- Optimistic local updates with Supabase sync; errors log but don't revert (except `toggleTask` and `deleteProject`)
- Batch sort-order updates use `Promise.all` on individual updates
- `crypto.randomUUID()` generates client-side IDs before Supabase insert
- `profiles` table auto-populated via DB trigger on `auth.users` insert (populated from GitHub OAuth metadata)
- Real-time subscriptions (`supabase.channel`) for tasks and project_shares
- Collaboration tables: `profiles`, `project_shares`

### Sharing flow

Share a project by email in ShareDialog:
- **Existing user**: `profiles` lookup → insert `project_shares` with `sharedWith = user.id`, `status = 'active'`
- **Non-user**: insert `project_shares` with `invitedEmail = email`, `status = 'invited'`, `token = randomUUID()` → (optionally) send email via `/functions/v1/send-invite` Edge Function (Resend)
- Invited users shown in ShareDialog with "Invited" badge
- Invite link: `/invite?token=xxx` → `InvitePage` → if authenticated, `redeemInviteToken()` → project appears in sidebar

### Task assignment

Assign by email or pick from project collaborators in AssigneePicker:
- Email lookup via `getProfileByEmail(email)` → `assignTask(taskId, userId)`
- Project collaborators shown as quick-pick options
- Assignee shown as avatar/initial badge on task item

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

**Edge function already deployed: `send-invite`**
- `supabase/functions/send-invite/index.ts` — sends invite email via Resend
- Public (no JWT required), validates request body fields
- To update: `supabase functions deploy send-invite`

## Drag and drop (@dnd-kit)

IDs are prefixed: `task-${task.id}` for tasks, `project-${project.id}` for projects. Active/over types are distinguished via `data.type` ('task' | 'project'). Cross-container drag (task → sidebar project) updates `projectId` in store. Sortable handles within `verticalListSortingStrategy`.

## Views

- **Inbox** — tasks with no project (`projectId === null`), default landing view
- **Today** — tasks marked as today or due today
- **Someday** — tasks flagged with `isSomeday`, hidden from all other uncompleted views
- **All** — all uncompleted tasks (excluding someday)
- **Assigned** — tasks assigned to you by friends (`assignedTo === userId`)
- **Project** — tasks within a specific project

## Collaboration

### Task Assignment
- `tasks.assigned_to` + `tasks.assigned_by` columns (nullable)
- Single assignee per task. Assign by email or pick from project collaborators.
- Assignee can edit task details and mark complete, cannot delete or change project
- Assigned tasks appear in a dedicated "Assigned" sidebar view (not in Inbox/Today/All)

### Shared Projects
- `project_shares` join table: (project_id, shared_by, shared_with nullable, permission='write')
- Non-user invites: uses `invited_email`, `status='invited'`, `token` columns
- Owner shares via hover icon on project name in sidebar → ShareDialog (enter email)
- Shared projects appear in "Shared with me" section in sidebar
- Full collaborator permissions: view, add tasks, complete any task, edit own notes
- Owner retains control (can delete project, change settings, stop sharing)

### RLS Strategy (key policies)
- `tasks`: user_id = me OR project_id IN (shared projects) OR assigned_to = me
- `projects`: user_id = me OR id IN (shared with me)
- `project_shares`: visible to shared_by, shared_with, or via invite token lookup

### Real-time
- Tasks channel: subscribes to all task changes (RLS filters server-side)
- Shares channel: re-initializes when a project is shared/unshared with the user

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
