create table if not exists public.cargoo_shipments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.cargoo_trips(id) on delete cascade,
  conversation_id uuid not null unique references public.cargoo_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  traveler_id uuid not null references auth.users(id) on delete cascade,
  traveler_name text not null,
  route_origin text not null,
  route_destination text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'delivered')),
  accepted_at timestamptz,
  delivered_at timestamptz,
  review_rating integer check (review_rating between 1 and 5),
  review_comment text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cargoo_shipments_sender_traveler_check check (sender_id <> traveler_id)
);

create index if not exists cargoo_shipments_sender_idx on public.cargoo_shipments(sender_id, status, created_at desc);
create index if not exists cargoo_shipments_traveler_idx on public.cargoo_shipments(traveler_id, status, created_at desc);
create index if not exists cargoo_shipments_trip_idx on public.cargoo_shipments(trip_id, status, created_at desc);

alter table public.cargoo_shipments enable row level security;

drop policy if exists "Participants can view cargoo shipments" on public.cargoo_shipments;
create policy "Participants can view cargoo shipments"
on public.cargoo_shipments
for select
using (auth.uid() = sender_id or auth.uid() = traveler_id);

drop policy if exists "Participants can insert cargoo shipments" on public.cargoo_shipments;
create policy "Participants can insert cargoo shipments"
on public.cargoo_shipments
for insert
with check (auth.uid() = sender_id or auth.uid() = traveler_id);

drop policy if exists "Participants can update cargoo shipments" on public.cargoo_shipments;
create policy "Participants can update cargoo shipments"
on public.cargoo_shipments
for update
using (auth.uid() = sender_id or auth.uid() = traveler_id)
with check (auth.uid() = sender_id or auth.uid() = traveler_id);

drop policy if exists "Participants can delete cargoo shipments" on public.cargoo_shipments;
create policy "Participants can delete cargoo shipments"
on public.cargoo_shipments
for delete
using (auth.uid() = sender_id or auth.uid() = traveler_id);

drop policy if exists "Shipment participants can view related cargoo trips" on public.cargoo_trips;
create policy "Shipment participants can view related cargoo trips"
on public.cargoo_trips
for select
using (
  exists (
    select 1
    from public.cargoo_shipments
    where cargoo_shipments.trip_id = cargoo_trips.id
      and (auth.uid() = cargoo_shipments.sender_id or auth.uid() = cargoo_shipments.traveler_id)
  )
);

drop policy if exists "Shipment participants can view related cargoo trip stops" on public.cargoo_trip_stops;
create policy "Shipment participants can view related cargoo trip stops"
on public.cargoo_trip_stops
for select
using (
  exists (
    select 1
    from public.cargoo_shipments
    where cargoo_shipments.trip_id = cargoo_trip_stops.trip_id
      and (auth.uid() = cargoo_shipments.sender_id or auth.uid() = cargoo_shipments.traveler_id)
  )
);

create or replace function public.sync_cargoo_trip_requests_from_shipments()
returns trigger
language plpgsql
as $$
declare
  affected_trip_ids uuid[];
  affected_trip_id uuid;
begin
  affected_trip_ids := array_remove(array[new.trip_id, old.trip_id], null);

  foreach affected_trip_id in array affected_trip_ids loop
    update public.cargoo_trips
    set
      requests = (
        select count(*)
        from public.cargoo_shipments
        where cargoo_shipments.trip_id = affected_trip_id
          and cargoo_shipments.status = 'pending'
      ),
      updated_at = now()
    where id = affected_trip_id;
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists cargoo_shipments_set_updated_at on public.cargoo_shipments;
create trigger cargoo_shipments_set_updated_at
before update on public.cargoo_shipments
for each row execute function public.set_cargoo_updated_at();

drop trigger if exists cargoo_shipments_sync_trip_requests on public.cargoo_shipments;
create trigger cargoo_shipments_sync_trip_requests
after insert or update or delete on public.cargoo_shipments
for each row execute function public.sync_cargoo_trip_requests_from_shipments();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cargoo_shipments'
    ) then
      alter publication supabase_realtime add table public.cargoo_shipments;
    end if;
  end if;
end
$$;
