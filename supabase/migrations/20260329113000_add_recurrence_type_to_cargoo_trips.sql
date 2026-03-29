alter table public.cargoo_trips
add column if not exists recurrence_type text not null default 'once';
