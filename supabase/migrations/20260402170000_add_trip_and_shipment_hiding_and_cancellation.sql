alter table public.cargoo_shipments
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by_user_id uuid references auth.users(id) on delete set null;

alter table public.cargoo_shipments
  drop constraint if exists cargoo_shipments_status_check;

alter table public.cargoo_shipments
  add constraint cargoo_shipments_status_check
  check (status in ('pending', 'accepted', 'delivered', 'cancelled'));

create table if not exists public.cargoo_trip_hidden_states (
  trip_id uuid not null references public.cargoo_trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists public.cargoo_shipment_hidden_states (
  shipment_id uuid not null references public.cargoo_shipments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (shipment_id, user_id)
);

create index if not exists cargoo_trip_hidden_states_user_idx
  on public.cargoo_trip_hidden_states(user_id, hidden_at desc);

create index if not exists cargoo_shipment_hidden_states_user_idx
  on public.cargoo_shipment_hidden_states(user_id, hidden_at desc);

alter table public.cargoo_trip_hidden_states enable row level security;
alter table public.cargoo_shipment_hidden_states enable row level security;

drop policy if exists "Users can view their hidden trip states" on public.cargoo_trip_hidden_states;
create policy "Users can view their hidden trip states"
on public.cargoo_trip_hidden_states
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their hidden trip states" on public.cargoo_trip_hidden_states;
create policy "Users can insert their hidden trip states"
on public.cargoo_trip_hidden_states
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their hidden trip states" on public.cargoo_trip_hidden_states;
create policy "Users can update their hidden trip states"
on public.cargoo_trip_hidden_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their hidden trip states" on public.cargoo_trip_hidden_states;
create policy "Users can delete their hidden trip states"
on public.cargoo_trip_hidden_states
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view their hidden shipment states" on public.cargoo_shipment_hidden_states;
create policy "Users can view their hidden shipment states"
on public.cargoo_shipment_hidden_states
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their hidden shipment states" on public.cargoo_shipment_hidden_states;
create policy "Users can insert their hidden shipment states"
on public.cargoo_shipment_hidden_states
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their hidden shipment states" on public.cargoo_shipment_hidden_states;
create policy "Users can update their hidden shipment states"
on public.cargoo_shipment_hidden_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their hidden shipment states" on public.cargoo_shipment_hidden_states;
create policy "Users can delete their hidden shipment states"
on public.cargoo_shipment_hidden_states
for delete
using (auth.uid() = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cargoo_trip_hidden_states'
    ) then
      alter publication supabase_realtime add table public.cargoo_trip_hidden_states;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cargoo_shipment_hidden_states'
    ) then
      alter publication supabase_realtime add table public.cargoo_shipment_hidden_states;
    end if;
  end if;
end
$$;
