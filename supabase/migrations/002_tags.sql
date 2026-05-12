create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text not null default 'gray',
  created_at timestamptz not null default now()
);

create table task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

alter table tags enable row level security;
alter table task_tags enable row level security;

create policy "Users can manage their own tags"
  on tags for all using (auth.uid() = user_id);

create policy "Users can manage their own task tags"
  on task_tags for all using (
    exists (select 1 from tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
  );

create index tags_user_id_idx on tags(user_id);
create index task_tags_task_id_idx on task_tags(task_id);
create index task_tags_tag_id_idx on task_tags(tag_id);
