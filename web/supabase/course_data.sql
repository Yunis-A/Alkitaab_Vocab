-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The course content lives here instead of in the website's files. Only signed-in students can read it; nobody can
-- write it from the website (the upload script uses the secret key, which bypasses these rules).

create table if not exists public.course_data (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.course_data enable row level security;

drop policy if exists "signed-in students read course data" on public.course_data;
create policy "signed-in students read course data"
  on public.course_data for select
  to authenticated
  using (true);

-- no insert / update / delete policies: the website cannot change the content
