drop policy if exists "Anyone can view public cargoo profiles" on public.cargoo_profiles;
create policy "Anyone can view public cargoo profiles"
on public.cargoo_profiles
for select
using (is_public = true);

drop policy if exists "Anyone can view public cargoo trips" on public.cargoo_trips;
create policy "Anyone can view public cargoo trips"
on public.cargoo_trips
for select
using (
  exists (
    select 1
    from public.cargoo_profiles
    where cargoo_profiles.user_id = cargoo_trips.user_id
      and cargoo_profiles.is_public = true
  )
);
