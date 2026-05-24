-- =====================================================
-- TTMAX — Admin access + RLS policies
-- Migration: 0003_admin_access
-- =====================================================

-- 1. Таблица admins — список email-ов с доступом к /admin
create table if not exists public.admins (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null unique,
  created_at   timestamptz not null default now(),
  added_by     text,
  notes        text
);

create index if not exists admins_email_idx on public.admins (lower(email));

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Seed: первый admin (project owner)
insert into public.admins (email, added_by, notes)
values ('maxsushek@gmail.com', 'system', 'Initial admin (project owner)')
on conflict (email) do nothing;

-- 2. Helper-функция: проверка прав admin для текущего пользователя
--    SECURITY DEFINER позволяет функции читать admins даже когда
--    у вызывающего нет прямого доступа к таблице.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 3. Grants для authenticated роли
--    (далее RLS-политики ограничат только до admin'ов)
grant select, insert, update, delete on public.leads        to authenticated;
grant select                          on public.lead_events to authenticated;

-- Views — security_invoker=true заставляет view использовать
-- права вызывающего, тогда RLS на leads применится корректно.
alter view public.lead_funnel              set (security_invoker = true);
alter view public.leads_pending_ads_sync   set (security_invoker = true);

grant select on public.lead_funnel             to authenticated;
grant select on public.leads_pending_ads_sync  to authenticated;

-- 4. RLS-политики: только admin-пользователи видят и меняют данные

-- leads — admin'ы могут всё
drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all"
on public.leads
for all
to authenticated
using      (public.is_admin())
with check (public.is_admin());

-- lead_events — admin'ы могут только читать (запись идёт через триггеры)
drop policy if exists "lead_events_admin_select" on public.lead_events;
create policy "lead_events_admin_select"
on public.lead_events
for select
to authenticated
using (public.is_admin());

-- =====================================================
-- Результат:
--   - anon:                       полностью заблокирован
--   - authenticated, НЕ admin:    проходит auth, но RLS блокирует данные
--   - authenticated AND admin:    полный доступ к leads и lead_events
--   - service_role (server-side): bypass RLS (форма /api/leads работает как было)
-- =====================================================
