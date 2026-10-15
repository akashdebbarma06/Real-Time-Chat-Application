-- =============================================================================
-- Migration 005: Security Definer Exposure, Realtime Presence Authorization,
-- Profile Privacy, and Conversation Summary Indexing Optimization
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SECURITY DEFINER EXPOSURE & CALLER AUTHORIZATION (Section 2C)
-- Restrict is_conversation_member and is_conversation_admin so callers cannot probe
-- private conversations of other users without being a verified participant.
-- -----------------------------------------------------------------------------

create or replace function public.is_conversation_member(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = coalesce(p_user_id, auth.uid())
      and (
        -- Caller can always check their own membership
        coalesce(p_user_id, auth.uid()) = auth.uid()
        -- Outsiders cannot probe other users; caller must be a member of this conversation
        or exists (
          select 1 from public.conversation_members self_cm
          where self_cm.conversation_id = p_conversation_id
            and self_cm.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.is_conversation_admin(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = coalesce(p_user_id, auth.uid())
      and cm.role in ('owner', 'admin')
      and (
        -- Caller can always check their own administrative role
        coalesce(p_user_id, auth.uid()) = auth.uid()
        -- Outsiders cannot probe administrative roles; caller must be a member of this conversation
        or exists (
          select 1 from public.conversation_members self_cm
          where self_cm.conversation_id = p_conversation_id
            and self_cm.user_id = auth.uid()
        )
      )
  );
$$;

-- Restrict is_user_blocked so third parties cannot probe user blocklists
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
    where blocker_id = p_blocker_id
      and blocked_id = p_blocked_id
      and (auth.uid() = p_blocker_id or auth.uid() = p_blocked_id)
  );
$$;

-- Explicitly revoke from public/anon and grant strictly to authenticated
revoke execute on function public.is_conversation_member(uuid, uuid) from public, anon;
revoke execute on function public.is_conversation_admin(uuid, uuid) from public, anon;
revoke execute on function public.is_user_blocked(uuid, uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.is_conversation_admin(uuid, uuid) to authenticated;
grant execute on function public.is_user_blocked(uuid, uuid) to authenticated;

-- Ensure delivery purge RPCs are restricted from public/anon
revoke execute on function public.acknowledge_and_purge_messages(uuid[]) from public, anon;
revoke execute on function public.acknowledge_and_purge_media(text) from public, anon;
grant execute on function public.acknowledge_and_purge_messages(uuid[]) to authenticated;
grant execute on function public.acknowledge_and_purge_media(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. REALTIME PRESENCE AUTHORIZATION (Section 2B)
-- Extract conversation IDs from presence:room:<uuid> and validate membership.
-- Prevent clients from subscribing to or publishing presence in conversations
-- they do not belong to, and prevent presence impersonation.
-- -----------------------------------------------------------------------------

create or replace function public.realtime_room_conversation_id(topic text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
begin
  if topic ~ '^presence:room:[0-9a-fA-F-]{36}$' then
    return split_part(topic, ':', 3)::uuid;
  elsif topic ~ '^conversation:[0-9a-fA-F-]{36}$' then
    return split_part(topic, ':', 2)::uuid;
  end if;
  return null;
exception when others then
  return null;
end;
$$;

revoke execute on function public.realtime_room_conversation_id(text) from public, anon;
grant execute on function public.realtime_room_conversation_id(text) to authenticated;

-- Update Realtime presence policies
drop policy if exists "Authenticated users can receive presence" on realtime.messages;
create policy "Authenticated users can receive presence"
on realtime.messages for select to authenticated
using (
  extension = 'presence'
  and (
    (select realtime.topic()) in ('online-users', 'presence:room:global')
    or (
      public.realtime_room_conversation_id((select realtime.topic())) is not null
      and public.is_conversation_member(
        public.realtime_room_conversation_id((select realtime.topic())),
        (select auth.uid())
      )
    )
  )
);

drop policy if exists "Authenticated users can publish presence" on realtime.messages;
create policy "Authenticated users can publish presence"
on realtime.messages for insert to authenticated
with check (
  extension = 'presence'
  and (
    (select realtime.topic()) in ('online-users', 'presence:room:global')
    or (
      public.realtime_room_conversation_id((select realtime.topic())) is not null
      and public.is_conversation_member(
        public.realtime_room_conversation_id((select realtime.topic())),
        (select auth.uid())
      )
    )
  )
);

-- -----------------------------------------------------------------------------
-- 3. PROFILE PRIVACY (Section 2D)
-- Prevent blocked users from discovering or reading profiles of users who blocked them.
-- -----------------------------------------------------------------------------

drop policy if exists "Authenticated users can discover profiles" on public.profiles;
drop policy if exists "Authenticated users can discover unblocked profiles" on public.profiles;

create policy "Authenticated users can discover unblocked profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or not exists (
    select 1 from public.blocked_users bu
    where bu.blocker_id = public.profiles.id
      and bu.blocked_id = (select auth.uid())
  )
);

-- -----------------------------------------------------------------------------
-- 4. CONVERSATION SUMMARY & QUERY PERFORMANCE (Section 3C)
-- Optimize get_conversation_summaries() with lateral join to eliminate redundant
-- subqueries in the ORDER BY clause, and add partial covering indexes.
-- -----------------------------------------------------------------------------

-- Partial index for active messages inside conversations
create index if not exists idx_messages_active_conv_created
on public.messages (conversation_id, created_at desc)
where deleted_at is null;

-- Partial index for unread count calculation excluding sender's own messages
create index if not exists idx_messages_unread_calc
on public.messages (conversation_id, sender_id, created_at desc)
where deleted_at is null;

create or replace function public.get_conversation_summaries()
returns table (
  id uuid,
  type public.conversation_type,
  name text,
  avatar_url text,
  updated_at timestamptz,
  members jsonb,
  last_message jsonb,
  unread_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.type,
    c.name,
    c.avatar_url,
    c.updated_at,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', cm2.user_id,
        'role', cm2.role,
        'profile', jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'display_name', p.display_name,
          'avatar_url', p.avatar_url,
          'bio', p.bio,
          'last_seen_at', p.last_seen_at
        )
      ) order by p.display_name)
      from public.conversation_members cm2
      join public.profiles p on p.id = cm2.user_id
      where cm2.conversation_id = c.id
    ), '[]'::jsonb) as members,
    lm.msg as last_message,
    coalesce(uc.cnt, 0) as unread_count
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  left join lateral (
    select jsonb_build_object(
      'id', m.id,
      'content', m.content,
      'message_type', m.message_type,
      'sender_id', m.sender_id,
      'created_at', m.created_at
    ) as msg,
    m.created_at as last_created_at
    from public.messages m
    where m.conversation_id = c.id and m.deleted_at is null
    order by m.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*) as cnt
    from public.messages m
    where m.conversation_id = c.id
      and m.sender_id <> auth.uid()
      and m.deleted_at is null
      and m.created_at > coalesce(cm.last_read_at, cm.joined_at)
  ) uc on true
  where cm.user_id = auth.uid()
  order by coalesce(lm.last_created_at, c.updated_at) desc;
$$;

revoke execute on function public.get_conversation_summaries() from public, anon;
grant execute on function public.get_conversation_summaries() to authenticated;
