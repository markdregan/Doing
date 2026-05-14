-- The edge function (supabase/functions/agent-chat/index.ts) writes
-- agent_messages with a `metadata` jsonb field (for planDraft storage).
-- This column was missing from the table, causing all inserts to fail silently.
alter table agent_messages add column if not exists metadata jsonb not null default '{}'::jsonb;
