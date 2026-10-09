-- Migration 003: Starred Messages table and RLS policies
create table if not exists public.starred_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_user_starred_message unique (user_id, message_id)
);

create index if not exists starred_messages_user_idx on public.starred_messages(user_id, created_at desc);
create index if not exists starred_messages_message_idx on public.starred_messages(message_id);
create index if not exists starred_messages_conversation_idx on public.starred_messages(conversation_id);

alter table public.starred_messages enable row level security;

create policy "Users can view their starred messages"
  on public.starred_messages for select
  using (user_id = auth.uid());

create policy "Users can star messages"
  on public.starred_messages for insert
  with check (user_id = auth.uid());

create policy "Users can unstar messages"
  on public.starred_messages for delete
  using (user_id = auth.uid());
