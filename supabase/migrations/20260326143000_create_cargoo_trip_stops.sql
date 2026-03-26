create table if not exists public.cargoo_trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.cargoo_trips(id) on delete cascade,
  stop_order integer not null check (stop_order >= 0),
  city text not null,
  reached_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cargoo_trip_stops_trip_order_key unique (trip_id, stop_order)
);

create index if not exists cargoo_trip_stops_trip_order_idx
on public.cargoo_trip_stops(trip_id, stop_order asc);

alter table public.cargoo_trip_stops enable row level security;

drop policy if exists "Users can view own cargoo trip stops" on public.cargoo_trip_stops;
create policy "Users can view own cargoo trip stops"
on public.cargoo_trip_stops
for select
using (
  exists (
    select 1
    from public.cargoo_trips
    where cargoo_trips.id = cargoo_trip_stops.trip_id
      and cargoo_trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own cargoo trip stops" on public.cargoo_trip_stops;
create policy "Users can insert own cargoo trip stops"
on public.cargoo_trip_stops
for insert
with check (
  exists (
    select 1
    from public.cargoo_trips
    where cargoo_trips.id = cargoo_trip_stops.trip_id
      and cargoo_trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own cargoo trip stops" on public.cargoo_trip_stops;
create policy "Users can update own cargoo trip stops"
on public.cargoo_trip_stops
for update
using (
  exists (
    select 1
    from public.cargoo_trips
    where cargoo_trips.id = cargoo_trip_stops.trip_id
      and cargoo_trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cargoo_trips
    where cargoo_trips.id = cargoo_trip_stops.trip_id
      and cargoo_trips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own cargoo trip stops" on public.cargoo_trip_stops;
create policy "Users can delete own cargoo trip stops"
on public.cargoo_trip_stops
for delete
using (
  exists (
    select 1
    from public.cargoo_trips
    where cargoo_trips.id = cargoo_trip_stops.trip_id
      and cargoo_trips.user_id = auth.uid()
  )
);

drop trigger if exists cargoo_trip_stops_set_updated_at on public.cargoo_trip_stops;
create trigger cargoo_trip_stops_set_updated_at
before update on public.cargoo_trip_stops
for each row execute function public.set_cargoo_updated_at();

insert into public.cargoo_trip_stops (trip_id, stop_order, city, reached_at, created_at, updated_at)
select
  trip.id,
  0,
  trip.origin,
  coalesce(trip.created_at, now()),
  coalesce(trip.created_at, now()),
  coalesce(trip.updated_at, trip.created_at, now())
from public.cargoo_trips as trip
where not exists (
  select 1
  from public.cargoo_trip_stops as stop
  where stop.trip_id = trip.id
    and stop.stop_order = 0
);

insert into public.cargoo_trip_stops (trip_id, stop_order, city, reached_at, created_at, updated_at)
select
  trip.id,
  1,
  trip.destination,
  case
    when trip.status = 'completed' then coalesce(trip.updated_at, trip.created_at, now())
    else null
  end,
  coalesce(trip.created_at, now()),
  coalesce(trip.updated_at, trip.created_at, now())
from public.cargoo_trips as trip
where trim(lower(trip.destination)) <> trim(lower(trip.origin))
  and not exists (
    select 1
    from public.cargoo_trip_stops as stop
    where stop.trip_id = trip.id
      and stop.stop_order = 1
  );
