create table if not exists public.cargoo_conversation_hidden_states (
  conversation_id uuid not null references public.cargoo_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists cargoo_conversation_hidden_states_user_idx
on public.cargoo_conversation_hidden_states(user_id, hidden_at desc);

alter table public.cargoo_conversation_hidden_states enable row level security;

drop policy if exists "Users can view own hidden cargoo conversations" on public.cargoo_conversation_hidden_states;
create policy "Users can view own hidden cargoo conversations"
on public.cargoo_conversation_hidden_states
for select
using (auth.uid() = user_id);

drop policy if exists "Participants can hide cargoo conversations for themselves" on public.cargoo_conversation_hidden_states;
create policy "Participants can hide cargoo conversations for themselves"
on public.cargoo_conversation_hidden_states
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.cargoo_conversations
    where cargoo_conversations.id = cargoo_conversation_hidden_states.conversation_id
      and (auth.uid() = cargoo_conversations.participant_one_id or auth.uid() = cargoo_conversations.participant_two_id)
  )
);

drop policy if exists "Users can remove own hidden cargoo conversations" on public.cargoo_conversation_hidden_states;
create policy "Users can remove own hidden cargoo conversations"
on public.cargoo_conversation_hidden_states
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can refresh own hidden cargoo conversations" on public.cargoo_conversation_hidden_states;
create policy "Users can refresh own hidden cargoo conversations"
on public.cargoo_conversation_hidden_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cargoo_conversation_hidden_states'
    ) then
      alter publication supabase_realtime add table public.cargoo_conversation_hidden_states;
    end if;
  end if;
end
$$;
