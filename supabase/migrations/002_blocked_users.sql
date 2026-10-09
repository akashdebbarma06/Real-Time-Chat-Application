-- Migration 002: Blocked users table with RLS
-- Enables users to block/unblock other users.

create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id != blocked_id)
);

create index blocked_users_blocker_idx on public.blocked_users(blocker_id);
create index blocked_users_blocked_idx on public.blocked_users(blocked_id);

alter table public.blocked_users enable row level security;

-- Only the blocker can see their own blocked list
create policy "Users can view their own blocked list"
  on public.blocked_users for select
  using (auth.uid() = blocker_id);

-- Only the authenticated user can block someone
create policy "Users can block others"
  on public.blocked_users for insert
  with check (auth.uid() = blocker_id);

-- Only the blocker can unblock
create policy "Users can unblock others"
  on public.blocked_users for delete
  using (auth.uid() = blocker_id);

-- Helper function: check if a user is blocked by another
create or replace function public.is_user_blocked(
  p_blocker_id uuid,
  p_blocked_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_users
    where blocker_id = p_blocker_id and blocked_id = p_blocked_id
  );
$$;
