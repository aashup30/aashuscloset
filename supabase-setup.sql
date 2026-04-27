-- Aashu's Closet Supabase setup
-- Run this in Supabase Dashboard -> SQL Editor -> New query.
-- This creates a simple cloud-sync table for the app state plus user roles.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('master', 'guest')),
  created_at timestamptz not null default now()
);

create table if not exists public.closet_state (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.profiles enable row level security;
alter table public.closet_state enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Master can read all profiles" on public.profiles;
create policy "Master can read all profiles"
on public.profiles for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
    and p.role = 'master'
  )
);

drop policy if exists "Authenticated users can read closet state" on public.closet_state;
create policy "Authenticated users can read closet state"
on public.closet_state for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert closet state" on public.closet_state;
create policy "Authenticated users can insert closet state"
on public.closet_state for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "Authenticated users can update closet state" on public.closet_state;
create policy "Authenticated users can update closet state"
on public.closet_state for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

create or replace function public.touch_closet_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists touch_closet_state_trigger on public.closet_state;
create trigger touch_closet_state_trigger
before insert or update on public.closet_state
for each row execute function public.touch_closet_state();

-- After creating your two Supabase Auth users, run the two inserts below with
-- their real user IDs from Authentication -> Users.
--
-- insert into public.profiles (user_id, role)
-- values ('MASTER_USER_UUID_HERE', 'master')
-- on conflict (user_id) do update set role = excluded.role;
--
-- insert into public.profiles (user_id, role)
-- values ('GUEST_USER_UUID_HERE', 'guest')
-- on conflict (user_id) do update set role = excluded.role;
