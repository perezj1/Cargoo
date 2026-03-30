alter table public.cargoo_trips
  add column if not exists coverage_mode text not null default 'exact' check (coverage_mode in ('exact', 'country_flexible')),
  add column if not exists origin_country_code text,
  add column if not exists destination_country_code text,
  add column if not exists origin_city_id text,
  add column if not exists destination_city_id text;
