# Doing

A task management app inspired by Things 3, built with React + TypeScript + Vite.

## Features

- **Inbox** — capture tasks quickly, organize later
- **Today** — focus on what's due or flagged for today
- **Someday** — stash tasks you want to get to eventually
- **Projects** — group related tasks with drag-and-drop sorting
- **Quick Entry** — Cmd+K palette for fast task creation
- **Drag and drop** — reorder tasks and move between projects
- **Dark mode** — Things 3-inspired palette
- **GitHub OAuth** — sign in with your GitHub account

## Stack

- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS v4
- **State**: Zustand 5 with optimistic updates
- **Backend**: Supabase (PostgreSQL, auth, RLS)
- **Drag & drop**: @dnd-kit
- **Testing**: Vitest + Testing Library

## Setup

```bash
git clone https://github.com/markdregan/Doing
cd Doing
npm install
```

Copy `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run database migrations against your Supabase project:

```bash
supabase migration up
```

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Typecheck + production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## License

MIT
