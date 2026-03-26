drop policy if exists "Anyone can view public cargoo trip stops" on public.cargoo_trip_stops;
create policy "Anyone can view public cargoo trip stops"
on public.cargoo_trip_stops
for select
using (
  exists (
    select 1
    from public.cargoo_trips
    join public.cargoo_profiles on cargoo_profiles.user_id = cargoo_trips.user_id
    where cargoo_trips.id = cargoo_trip_stops.trip_id
      and cargoo_profiles.is_public = true
  )
);
