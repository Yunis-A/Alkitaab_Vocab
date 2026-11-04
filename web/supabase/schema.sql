-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- One row per user holds their progress (level, dialects, review cards, map-game times).

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- A signed-in user can only see and change their own row.
create policy "read own progress" on public.progress
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own progress" on public.progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own progress" on public.progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own progress" on public.progress
  for delete to authenticated using (auth.uid() = user_id);
