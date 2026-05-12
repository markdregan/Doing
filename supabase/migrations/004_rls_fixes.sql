-- Fix 1: Restrict profiles to only expose data to related users
drop policy if exists "Profiles are publicly readable" on profiles;

create policy "Profiles are readable by members and assignees" on profiles
  for select using (
    auth.uid() = id
    or id in (select shared_with from project_shares where shared_by = auth.uid() and shared_with is not null)
    or id in (select shared_by from project_shares where shared_with = auth.uid())
    or id in (select assigned_to from tasks where assigned_to = profiles.id)
    or id in (select assigned_by from tasks where assigned_by = profiles.id and assigned_to = auth.uid())
  );

-- Fix 2: Expand task_tags policy to cover shared project members and assignees
drop policy if exists "Users can manage their own task tags" on task_tags;

create policy "Users can manage task tags for accessible tasks" on task_tags
  for all using (
    exists (
      select 1 from tasks
      where tasks.id = task_tags.task_id
      and (
        tasks.user_id = auth.uid()
        or tasks.project_id in (
          select project_id from project_shares
          where shared_with = auth.uid() and status = 'active'
        )
        or tasks.assigned_to = auth.uid()
      )
    )
  );

-- Fix 3: Expand task_checklist_items policy to cover shared project members and assignees
drop policy if exists "Users can manage their own checklist items" on task_checklist_items;

create policy "Users can manage checklist items for accessible tasks" on task_checklist_items
  for all using (
    exists (
      select 1 from tasks
      where tasks.id = task_checklist_items.task_id
      and (
        tasks.user_id = auth.uid()
        or tasks.project_id in (
          select project_id from project_shares
          where shared_with = auth.uid() and status = 'active'
        )
        or tasks.assigned_to = auth.uid()
      )
    )
  );
