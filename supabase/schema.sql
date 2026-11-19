create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente', 'completada')),
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_created_at_idx on public.tasks (user_id, created_at desc);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status);
alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to authenticated;
drop policy if exists tasks_select_own on public.tasks;
drop policy if exists tasks_insert_own on public.tasks;
drop policy if exists tasks_update_own on public.tasks;
drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_select_own on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy tasks_insert_own on public.tasks for insert to authenticated with check (auth.uid() = user_id);
create policy tasks_update_own on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tasks_delete_own on public.tasks for delete to authenticated using (auth.uid() = user_id);
