create table if not exists public.cargoo_conversations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.cargoo_trips(id) on delete set null,
  participant_one_id uuid not null references auth.users(id) on delete cascade,
  participant_one_name text not null,
  participant_one_is_traveler boolean not null default false,
  participant_two_id uuid not null references auth.users(id) on delete cascade,
  participant_two_name text not null,
  participant_two_is_traveler boolean not null default false,
  route_origin text,
  route_destination text,
  last_message_text text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cargoo_conversations_participants_check check (participant_one_id <> participant_two_id)
);

create unique index if not exists cargoo_conversations_unique_pair_trip_idx
on public.cargoo_conversations (
  least(participant_one_id, participant_two_id),
  greatest(participant_one_id, participant_two_id),
  coalesce(trip_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists cargoo_conversations_participant_one_idx on public.cargoo_conversations(participant_one_id);
create index if not exists cargoo_conversations_participant_two_idx on public.cargoo_conversations(participant_two_id);
create index if not exists cargoo_conversations_last_message_at_idx on public.cargoo_conversations(last_message_at desc);

create table if not exists public.cargoo_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.cargoo_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cargoo_messages_conversation_idx on public.cargoo_messages(conversation_id, created_at asc);
create index if not exists cargoo_messages_sender_idx on public.cargoo_messages(sender_id);
create index if not exists cargoo_messages_unread_idx on public.cargoo_messages(conversation_id, read_at);

alter table public.cargoo_conversations enable row level security;
alter table public.cargoo_messages enable row level security;

drop policy if exists "Participants can view cargoo conversations" on public.cargoo_conversations;
create policy "Participants can view cargoo conversations"
on public.cargoo_conversations
for select
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "Participants can insert cargoo conversations" on public.cargoo_conversations;
create policy "Participants can insert cargoo conversations"
on public.cargoo_conversations
for insert
with check (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "Participants can update cargoo conversations" on public.cargoo_conversations;
create policy "Participants can update cargoo conversations"
on public.cargoo_conversations
for update
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "Participants can delete cargoo conversations" on public.cargoo_conversations;
create policy "Participants can delete cargoo conversations"
on public.cargoo_conversations
for delete
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "Participants can view cargoo messages" on public.cargoo_messages;
create policy "Participants can view cargoo messages"
on public.cargoo_messages
for select
using (
  exists (
    select 1
    from public.cargoo_conversations
    where cargoo_conversations.id = cargoo_messages.conversation_id
      and (auth.uid() = cargoo_conversations.participant_one_id or auth.uid() = cargoo_conversations.participant_two_id)
  )
);

drop policy if exists "Participants can insert cargoo messages" on public.cargoo_messages;
create policy "Participants can insert cargoo messages"
on public.cargoo_messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.cargoo_conversations
    where cargoo_conversations.id = cargoo_messages.conversation_id
      and (auth.uid() = cargoo_conversations.participant_one_id or auth.uid() = cargoo_conversations.participant_two_id)
  )
);

drop policy if exists "Participants can update cargoo messages" on public.cargoo_messages;
create policy "Participants can update cargoo messages"
on public.cargoo_messages
for update
using (
  exists (
    select 1
    from public.cargoo_conversations
    where cargoo_conversations.id = cargoo_messages.conversation_id
      and (auth.uid() = cargoo_conversations.participant_one_id or auth.uid() = cargoo_conversations.participant_two_id)
  )
);

create or replace function public.touch_cargoo_conversation_after_message()
returns trigger
language plpgsql
as $$
begin
  update public.cargoo_conversations
  set
    last_message_text = new.content,
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists cargoo_conversations_set_updated_at on public.cargoo_conversations;
create trigger cargoo_conversations_set_updated_at
before update on public.cargoo_conversations
for each row execute function public.set_cargoo_updated_at();

drop trigger if exists cargoo_messages_set_updated_at on public.cargoo_messages;
create trigger cargoo_messages_set_updated_at
before update on public.cargoo_messages
for each row execute function public.set_cargoo_updated_at();

drop trigger if exists cargoo_messages_after_insert on public.cargoo_messages;
create trigger cargoo_messages_after_insert
after insert on public.cargoo_messages
for each row execute function public.touch_cargoo_conversation_after_message();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cargoo_conversations'
    ) then
      alter publication supabase_realtime add table public.cargoo_conversations;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cargoo_messages'
    ) then
      alter publication supabase_realtime add table public.cargoo_messages;
    end if;
  end if;
end
$$;
