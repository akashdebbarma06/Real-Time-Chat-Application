-- ChatSphere database, RLS, Realtime authorization, and Storage policies.
-- Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.conversation_type as enum ('direct', 'group');
create type public.member_role as enum ('owner', 'admin', 'member');
create type public.message_type as enum ('text', 'image', 'file');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null,
  avatar_url text,
  bio text not null default '',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username::text) between 3 and 30),
  constraint display_name_length check (char_length(display_name) between 1 and 80),
  constraint bio_length check (char_length(bio) <= 300)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  name text,
  avatar_url text,
  direct_key text unique,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_name_required check (type = 'direct' or nullif(trim(name), '') is not null)
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  last_read_message_id uuid,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  content text not null default '',
  message_type public.message_type not null default 'text',
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint message_has_content check (
    deleted_at is not null
    or nullif(trim(content), '') is not null
    or attachment_path is not null
  ),
  constraint attachment_fields_match_type check (
    message_type = 'text'
    or (attachment_path is not null and attachment_name is not null)
  )
);

alter table public.conversation_members
  add constraint conversation_members_last_read_message_fk
  foreign key (last_read_message_id) references public.messages(id) on delete set null;

create table public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index conversation_members_user_idx on public.conversation_members(user_id, conversation_id);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index messages_sender_idx on public.messages(sender_id, created_at desc);
create index message_reads_message_idx on public.message_reads(message_id);
create index profiles_display_name_idx on public.profiles using gin (to_tsvector('simple', display_name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_username text;
  safe_username text;
begin
  requested_username := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'user');
  safe_username := lower(regexp_replace(requested_username, '[^a-zA-Z0-9_]', '', 'g'));
  safe_username := left(coalesce(nullif(safe_username, ''), 'user'), 22) || '_' || substr(new.id::text, 1, 6);

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    safe_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'ChatSphere user'), '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_conversation_member(p_conversation_id uuid, p_user_id uuid default auth.uid())
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
      and cm.user_id = p_user_id
  );
$$;

create or replace function public.is_conversation_admin(p_conversation_id uuid, p_user_id uuid default auth.uid())
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
      and cm.user_id = p_user_id
      and cm.role in ('owner', 'admin')
  );
$$;

create or replace function public.create_direct_conversation(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  conversation_id uuid;
  key text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if other_user = current_user_id then
    raise exception 'Cannot create a direct conversation with yourself';
  end if;
  if not exists (select 1 from public.profiles where id = other_user) then
    raise exception 'User not found';
  end if;

  key := least(current_user_id::text, other_user::text) || ':' || greatest(current_user_id::text, other_user::text);

  insert into public.conversations (type, direct_key, created_by)
  values ('direct', key, current_user_id)
  on conflict (direct_key) do update set updated_at = public.conversations.updated_at
  returning id into conversation_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values
    (conversation_id, current_user_id, 'owner'),
    (conversation_id, other_user, 'member')
  on conflict do nothing;

  return conversation_id;
end;
$$;

create or replace function public.create_group_conversation(group_name text, member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  conversation_id uuid;
  member_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(group_name), '') is null then
    raise exception 'A group name is required';
  end if;

  insert into public.conversations (type, name, created_by)
  values ('group', left(trim(group_name), 80), current_user_id)
  returning id into conversation_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values (conversation_id, current_user_id, 'owner');

  foreach member_id in array coalesce(member_ids, '{}'::uuid[]) loop
    if member_id <> current_user_id and exists (select 1 from public.profiles where id = member_id) then
      insert into public.conversation_members (conversation_id, user_id, role)
      values (conversation_id, member_id, 'member')
      on conflict do nothing;
    end if;
  end loop;

  return conversation_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid, p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_member(p_conversation_id, auth.uid()) then
    raise exception 'Not a conversation member';
  end if;

  if not exists (
    select 1 from public.messages
    where id = p_message_id and conversation_id = p_conversation_id
  ) then
    raise exception 'Message does not belong to conversation';
  end if;

  update public.conversation_members
  set last_read_at = now(), last_read_message_id = p_message_id
  where conversation_id = p_conversation_id and user_id = auth.uid();

  insert into public.message_reads (message_id, user_id, read_at)
  values (p_message_id, auth.uid(), now())
  on conflict (message_id, user_id)
  do update set read_at = excluded.read_at;
end;
$$;

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
    (
      select jsonb_build_object(
        'id', m.id,
        'content', m.content,
        'message_type', m.message_type,
        'sender_id', m.sender_id,
        'created_at', m.created_at
      )
      from public.messages m
      where m.conversation_id = c.id and m.deleted_at is null
      order by m.created_at desc
      limit 1
    ) as last_message,
    (
      select count(*)
      from public.messages m
      where m.conversation_id = c.id
        and m.sender_id <> auth.uid()
        and m.deleted_at is null
        and m.created_at > coalesce(cm.last_read_at, cm.joined_at)
    ) as unread_count
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  where cm.user_id = auth.uid()
  order by coalesce((
    select max(m2.created_at) from public.messages m2 where m2.conversation_id = c.id
  ), c.updated_at) desc;
$$;

create or replace function public.realtime_conversation_id(topic text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
begin
  if topic !~ '^conversation:[0-9a-fA-F-]{36}$' then
    return null;
  end if;
  return split_part(topic, ':', 2)::uuid;
exception when others then
  return null;
end;
$$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;
grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;
grant execute on function public.get_conversation_summaries() to authenticated;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;

create policy "Authenticated users can discover profiles"
on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Members can view conversations"
on public.conversations for select to authenticated
using (public.is_conversation_member(id, (select auth.uid())));

create policy "Admins can update conversations"
on public.conversations for update to authenticated
using (public.is_conversation_admin(id, (select auth.uid())))
with check (public.is_conversation_admin(id, (select auth.uid())));

create policy "Members can view conversation membership"
on public.conversation_members for select to authenticated
using (public.is_conversation_member(conversation_id, (select auth.uid())));

create policy "Admins can add conversation members"
on public.conversation_members for insert to authenticated
with check (public.is_conversation_admin(conversation_id, (select auth.uid())));

create policy "Admins or self can remove membership"
on public.conversation_members for delete to authenticated
using (
  user_id = (select auth.uid())
  or public.is_conversation_admin(conversation_id, (select auth.uid()))
);

create policy "Members can read messages"
on public.messages for select to authenticated
using (public.is_conversation_member(conversation_id, (select auth.uid())));

create policy "Members can send messages"
on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_conversation_member(conversation_id, (select auth.uid()))
);

create policy "Senders can edit their messages"
on public.messages for update to authenticated
using (sender_id = (select auth.uid()))
with check (sender_id = (select auth.uid()));

create policy "Members can see read receipts"
on public.message_reads for select to authenticated
using (
  exists (
    select 1 from public.messages m
    where m.id = message_id
      and public.is_conversation_member(m.conversation_id, (select auth.uid()))
  )
);

create policy "Users can create their read receipts"
on public.message_reads for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.messages m
    where m.id = message_id
      and public.is_conversation_member(m.conversation_id, (select auth.uid()))
  )
);

create policy "Users can refresh their read receipts"
on public.message_reads for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Private Realtime channels: conversation:<uuid> and online-users.
create policy "Authenticated users can receive presence"
on realtime.messages for select to authenticated
using (
  extension = 'presence'
  and (
    (select realtime.topic()) = 'online-users'
    or public.is_conversation_member(public.realtime_conversation_id((select realtime.topic())), (select auth.uid()))
  )
);

create policy "Authenticated users can publish presence"
on realtime.messages for insert to authenticated
with check (
  extension = 'presence'
  and (
    (select realtime.topic()) = 'online-users'
    or public.is_conversation_member(public.realtime_conversation_id((select realtime.topic())), (select auth.uid()))
  )
);

create policy "Members can receive conversation broadcasts"
on realtime.messages for select to authenticated
using (
  extension = 'broadcast'
  and (
    public.is_conversation_member(public.realtime_conversation_id((select realtime.topic())), (select auth.uid()))
    or (select realtime.topic()) = 'user-conversations:' || (select auth.uid())::text
  )
);

create policy "Members can send conversation broadcasts"
on realtime.messages for insert to authenticated
with check (
  extension = 'broadcast'
  and public.is_conversation_member(public.realtime_conversation_id((select realtime.topic())), (select auth.uid()))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('chat-files', 'chat-files', false, 6291456, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatar images are public"
on storage.objects for select to public
using (bucket_id = 'avatars');

create policy "Users can upload their avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can replace their avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Members can read conversation files"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat-files'
  and public.is_conversation_member(public.realtime_conversation_id('conversation:' || (storage.foldername(name))[1]), (select auth.uid()))
);

create policy "Members can upload conversation files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat-files'
  and public.is_conversation_member(public.realtime_conversation_id('conversation:' || (storage.foldername(name))[1]), (select auth.uid()))
);

create policy "Uploaders can delete conversation files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- Broadcast durable database changes through private channels (recommended by Supabase for scale).
create or replace function public.broadcast_conversation_list_update(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_record record;
begin
  for member_record in
    select user_id from public.conversation_members where conversation_id = p_conversation_id
  loop
    perform realtime.send(
      jsonb_build_object('conversation_id', p_conversation_id),
      'conversation_changed',
      'user-conversations:' || member_record.user_id::text,
      true
    );
  end loop;
end;
$$;

create or replace function public.broadcast_message_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_conversation_id uuid := coalesce(new.conversation_id, old.conversation_id);
begin
  perform realtime.broadcast_changes(
    'conversation:' || target_conversation_id::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  perform public.broadcast_conversation_list_update(target_conversation_id);
  return null;
end;
$$;

create trigger messages_broadcast_change
after insert or update or delete on public.messages
for each row execute procedure public.broadcast_message_change();

create or replace function public.broadcast_read_receipt_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_conversation_id uuid;
begin
  select conversation_id into target_conversation_id
  from public.messages
  where id = coalesce(new.message_id, old.message_id);

  if target_conversation_id is not null then
    perform realtime.broadcast_changes(
      'conversation:' || target_conversation_id::text,
      'READ_RECEIPT',
      tg_op,
      tg_table_name,
      tg_table_schema,
      new,
      old
    );
    perform realtime.send(
      jsonb_build_object('conversation_id', target_conversation_id),
      'conversation_changed',
      'user-conversations:' || coalesce(new.user_id, old.user_id)::text,
      true
    );
  end if;
  return null;
end;
$$;

create trigger message_reads_broadcast_change
after insert or update or delete on public.message_reads
for each row execute procedure public.broadcast_read_receipt_change();

create or replace function public.broadcast_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_conversation_id uuid := coalesce(new.conversation_id, old.conversation_id);
  affected_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  if tg_op = 'DELETE' then
    perform realtime.send(
      jsonb_build_object('conversation_id', target_conversation_id),
      'conversation_changed',
      'user-conversations:' || affected_user_id::text,
      true
    );
  end if;
  perform public.broadcast_conversation_list_update(target_conversation_id);
  return null;
end;
$$;

create trigger conversation_members_broadcast_change
after insert or update or delete on public.conversation_members
for each row execute procedure public.broadcast_membership_change();

-- Prevent clients from moving messages between conversations or impersonating senders.
create or replace function public.protect_message_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.conversation_id <> old.conversation_id
     or new.sender_id <> old.sender_id
     or new.created_at <> old.created_at then
    raise exception 'Message identity fields are immutable';
  end if;
  return new;
end;
$$;

create trigger messages_protect_identity
before update on public.messages
for each row execute procedure public.protect_message_identity();

-- Security-definer RPCs are callable only by authenticated users or internal triggers.
revoke execute on function public.create_direct_conversation(uuid) from public, anon;
revoke execute on function public.create_group_conversation(text, uuid[]) from public, anon;
revoke execute on function public.mark_conversation_read(uuid, uuid) from public, anon;
revoke execute on function public.get_conversation_summaries() from public, anon;
revoke execute on function public.is_conversation_member(uuid, uuid) from public, anon;
revoke execute on function public.is_conversation_admin(uuid, uuid) from public, anon;
revoke execute on function public.realtime_conversation_id(text) from public, anon;
revoke execute on function public.broadcast_conversation_list_update(uuid) from public, anon;
revoke execute on function public.broadcast_message_change() from public, anon;
revoke execute on function public.broadcast_read_receipt_change() from public, anon;
revoke execute on function public.broadcast_membership_change() from public, anon;

 grant execute on function public.create_direct_conversation(uuid) to authenticated;
 grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;
 grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;
 grant execute on function public.get_conversation_summaries() to authenticated;
 grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;
 grant execute on function public.is_conversation_admin(uuid, uuid) to authenticated;
 grant execute on function public.realtime_conversation_id(text) to authenticated;
