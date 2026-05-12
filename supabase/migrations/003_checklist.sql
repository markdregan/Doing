create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table task_checklist_items enable row level security;

create policy "Users can manage their own checklist items"
  on task_checklist_items for all using (
    exists (select 1 from tasks where tasks.id = task_checklist_items.task_id and tasks.user_id = auth.uid())
  );

create index checklist_task_id_idx on task_checklist_items(task_id);
