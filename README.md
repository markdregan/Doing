# Doing

An agentic task assistant — chat with an AI agent to plan projects, manage tasks, and execute work. Built with React + TypeScript + Vite.

The agent owns task management: it proposes plans, asks clarifying questions, creates tasks, sends emails, makes calls, and does research. You review, approve, and mark complete.

## Features

- **Agent chat** — tell the agent what you want to do, and it builds a plan with tasks, deadlines, and dependencies
- **Planning flow** — the agent asks clarifying questions, generates a structured plan, and you approve before execution begins
- **Execution view** — two-panel layout with chat as the primary interaction surface and a task reference sidebar
- **Activity timeline** — agent actions (task created, email sent, call made, research complete) rendered inline within the chat
- **Autonomous actions** — the agent can draft and send emails, make calls, conduct research (external action cards with transcripts and findings)
- **Inline questions** — when the agent needs your input, it presents structured choices inline rather than switching views
- **Task management** — drag-and-drop sorting, projects, today/someday/inbox views, due dates, tags, checklists
- **Collaboration** — share projects by email, assign tasks to collaborators, real-time sync
- **Dark mode** — Things 3-inspired palette with class-based toggle
- **GitHub OAuth** — sign in with your GitHub account

## Stack

- **Frontend**: React 19, TypeScript 6, Vite 8, Tailwind CSS v4
- **State**: Zustand 5 with optimistic updates and Supabase sync
- **Backend**: Supabase (PostgreSQL, auth, RLS, real-time subscriptions)
- **AI**: Gemini API via Supabase Edge Functions (`agent-chat`)
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

Deploy the agent chat edge function:

```bash
supabase functions deploy agent-chat
```

Optionally deploy the invite email function (requires Resend API key):

```bash
supabase functions deploy send-invite
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

## Architecture

The app uses an agent-centric paradigm:

- **Home screen** — greeting with today's task summary, recent activity feed, and task-oriented suggestion chips
- **Planning** — enter a goal, the agent asks clarifying questions, generates a draft plan, you approve or refine via chat
- **Execution** — chat panel as the primary interaction surface with a reference sidebar showing the task list; agent actions stream into the chat timeline
- **Activity events** — all agent actions are recorded as typed events (`agent_action`, `task_completed`, `email_sent`, etc.) and persisted to Supabase via `agent_activity_events` table
- **State machine** — the agent tracks its state (`idle`, `thinking`, `working`, `needs_input`, `blocked`, `completed`) with descriptions and optional progress

## License

MIT
