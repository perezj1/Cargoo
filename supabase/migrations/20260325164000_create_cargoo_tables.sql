create table if not exists public.cargoo_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  is_traveler boolean not null default false,
  is_public boolean not null default true,
  phone text,
  location text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cargoo_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin text not null,
  destination text not null,
  trip_date date not null,
  capacity_kg integer not null check (capacity_kg > 0),
  used_kg integer not null default 0 check (used_kg >= 0),
  requests integer not null default 0 check (requests >= 0),
  notes text,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cargoo_profiles enable row level security;
alter table public.cargoo_trips enable row level security;

create policy "Users can view own cargoo profile"
on public.cargoo_profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert own cargoo profile"
on public.cargoo_profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update own cargoo profile"
on public.cargoo_profiles
for update
using (auth.uid() = user_id);

create policy "Users can delete own cargoo profile"
on public.cargoo_profiles
for delete
using (auth.uid() = user_id);

create policy "Users can view own cargoo trips"
on public.cargoo_trips
for select
using (auth.uid() = user_id);

create policy "Users can insert own cargoo trips"
on public.cargoo_trips
for insert
with check (auth.uid() = user_id);

create policy "Users can update own cargoo trips"
on public.cargoo_trips
for update
using (auth.uid() = user_id);

create policy "Users can delete own cargoo trips"
on public.cargoo_trips
for delete
using (auth.uid() = user_id);

create or replace function public.set_cargoo_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cargoo_profiles_set_updated_at on public.cargoo_profiles;
create trigger cargoo_profiles_set_updated_at
before update on public.cargoo_profiles
for each row execute function public.set_cargoo_updated_at();

drop trigger if exists cargoo_trips_set_updated_at on public.cargoo_trips;
create trigger cargoo_trips_set_updated_at
before update on public.cargoo_trips
for each row execute function public.set_cargoo_updated_at();
