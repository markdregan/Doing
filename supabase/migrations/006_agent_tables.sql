-- Agent chat tables. These were created ad-hoc and never tracked in migrations;
-- this file captures the canonical schema.  Idempotent (IF NOT EXISTS) so it
-- can be applied to an existing project without side effects.

-- Agent conversations: one per planning session or approved plan.
create table if not exists agent_conversations (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  task_id uuid references tasks(id) on delete cascade,
  title text not null default '',
  emoji text not null default '',
  status text not null default 'active' check (status in ('draft', 'planning', 'review', 'active', 'archived')),
  goal_text text not null default '',
  goal_brief jsonb,
  summary text,
  plan_draft jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agent messages: individual chat messages within a conversation.
create table if not exists agent_messages (
  id uuid primary key,
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS (idempotent)
alter table agent_conversations enable row level security;
alter table agent_messages enable row level security;

-- RLS policies for agent_conversations
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_own_conversations' and tablename = 'agent_conversations') then
    create policy users_own_conversations on agent_conversations
      for all using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_can_access_own_conversations' and tablename = 'agent_conversations') then
    create policy users_can_access_own_conversations on agent_conversations
      for all using (
        auth.uid() = user_id
        or task_id in (
          select tasks.id from tasks
          where tasks.user_id = auth.uid()
             or tasks.project_id in (
                 select project_shares.project_id from project_shares
                 where project_shares.shared_with = auth.uid()
               )
        )
      );
  end if;
end $$;

-- RLS policies for agent_messages
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_own_messages' and tablename = 'agent_messages') then
    create policy users_own_messages on agent_messages
      for all using (
        conversation_id in (
          select id from agent_conversations where user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_can_access_own_messages' and tablename = 'agent_messages') then
    create policy users_can_access_own_messages on agent_messages
      for all using (
        conversation_id in (
          select id from agent_conversations
          where user_id = auth.uid()
             or task_id in (
                 select tasks.id from tasks
                 where tasks.user_id = auth.uid()
                    or tasks.project_id in (
                        select project_shares.project_id from project_shares
                        where project_shares.shared_with = auth.uid()
                      )
               )
        )
      );
  end if;
end $$;

-- Performance indexes
create index if not exists agent_conversations_user_id_idx on agent_conversations(user_id);
create index if not exists agent_messages_conversation_id_idx on agent_messages(conversation_id);
