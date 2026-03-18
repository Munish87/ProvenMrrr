-- Migration 013 - allow authenticated users to create their own missing profile row

drop policy if exists "users: insert own profile" on public.users;
create policy "users: insert own profile"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);
