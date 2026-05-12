create extension if not exists "pgcrypto";

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text not null default 'blue',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  project_id uuid references projects(id) on delete set null,
  due_date date,
  is_today boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table tasks enable row level security;

create policy "Users can manage their own projects"
  on projects for all using (auth.uid() = user_id);

create policy "Users can manage their own tasks"
  on tasks for all using (auth.uid() = user_id);

create index tasks_user_id_idx on tasks(user_id);
create index tasks_project_id_idx on tasks(project_id);
create index projects_user_id_idx on projects(user_id);
