alter table public.cargoo_profiles
add column if not exists locale text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'locale'
  ) then
    update public.cargoo_profiles as cp
    set locale = coalesce(nullif(cp.locale, ''), nullif(p.locale, ''), 'es')
    from public.profiles as p
    where p.id = cp.user_id
      and (cp.locale is null or cp.locale = '');
  end if;
end $$;

update public.cargoo_profiles as cp
set locale = coalesce(nullif(cp.locale, ''), nullif(au.raw_user_meta_data ->> 'locale', ''), 'es')
from auth.users as au
where au.id = cp.user_id
  and (cp.locale is null or cp.locale = '');

update public.cargoo_profiles
set locale = 'es'
where locale is null or locale = '';

alter table public.cargoo_profiles
alter column locale set default 'es';

alter table public.cargoo_profiles
alter column locale set not null;
