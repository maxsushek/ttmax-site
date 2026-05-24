-- =====================================================
-- TTMAX — Leads funnel (status, events, ads sync)
-- Migration: 0002_leads_funnel
-- =====================================================

-- 1. Enum для статусов воронки
do $$ begin
  create type lead_status as enum (
    'new',          -- только пришёл с сайта
    'qualified',    -- менеджер подтвердил что целевой
    'unqualified',  -- спам / не наша ЦА / нерелевантный
    'contacted',    -- дозвонились, контакт установлен
    'in_progress',  -- ведём в продажу
    'won',          -- купил
    'lost'          -- отказался / не дозвонились / передумал
  );
exception when duplicate_object then null; end $$;

-- 2. Расширяем таблицу leads
alter table public.leads
  add column if not exists status lead_status not null default 'new',
  add column if not exists assigned_to text,
  add column if not exists notes text,
  add column if not exists qualification_reason text,
  add column if not exists loss_reason text,
  add column if not exists value_uah numeric(10,2),

  -- Таймстемпы переходов (для funnel-аналитики и Ads conversion tracking)
  add column if not exists qualified_at timestamptz,
  add column if not exists contacted_at timestamptz,
  add column if not exists in_progress_at timestamptz,
  add column if not exists won_at timestamptz,
  add column if not exists lost_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),

  -- Sync статусы для рекламных платформ
  add column if not exists synced_to_google_ads_at timestamptz,
  add column if not exists synced_to_meta_ads_at timestamptz;

-- Индексы для частых запросов
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_assigned_to_idx on public.leads (assigned_to) where assigned_to is not null;
create index if not exists leads_qualified_at_idx on public.leads (qualified_at desc) where qualified_at is not null;

-- 3. История событий — для аудита и аналитики воронки
create table if not exists public.lead_events (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  created_at  timestamptz not null default now(),
  from_status lead_status,
  to_status   lead_status not null,
  changed_by  text,                              -- кто изменил (email/имя/system)
  reason      text,                              -- причина перехода
  metadata    jsonb not null default '{}'::jsonb -- доп. инфо
);

create index if not exists lead_events_lead_id_idx on public.lead_events (lead_id, created_at desc);
create index if not exists lead_events_to_status_idx on public.lead_events (to_status, created_at desc);

alter table public.lead_events enable row level security;
revoke all on public.lead_events from anon, authenticated;

-- 4. Триггер: автоматически проставляет таймстемпы и пишет в lead_events
create or replace function public.handle_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Всегда обновляем updated_at
  new.updated_at := now();

  -- Если статус не менялся — выходим
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Заполняем соответствующий таймстемп при переходе в новый статус
  case new.status
    when 'qualified'   then new.qualified_at   := coalesce(new.qualified_at,   now());
    when 'contacted'   then new.contacted_at   := coalesce(new.contacted_at,   now());
    when 'in_progress' then new.in_progress_at := coalesce(new.in_progress_at, now());
    when 'won'         then new.won_at         := coalesce(new.won_at,         now());
    when 'lost'        then new.lost_at        := coalesce(new.lost_at,        now());
    else null;
  end case;

  -- Пишем событие в историю
  insert into public.lead_events (lead_id, from_status, to_status, changed_by, reason)
  values (
    new.id,
    old.status,
    new.status,
    coalesce(new.assigned_to, 'system'),
    case
      when new.status = 'qualified'   then new.qualification_reason
      when new.status = 'unqualified' then new.qualification_reason
      when new.status = 'lost'        then new.loss_reason
      else null
    end
  );

  return new;
end;
$$;

drop trigger if exists on_lead_status_change on public.leads;
create trigger on_lead_status_change
  before update on public.leads
  for each row
  execute function public.handle_lead_status_change();

-- 5. Триггер на INSERT — пишем первое событие "new"
create or replace function public.handle_lead_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_events (lead_id, from_status, to_status, changed_by)
  values (new.id, null, new.status, 'system');
  return new;
end;
$$;

drop trigger if exists on_lead_insert on public.leads;
create trigger on_lead_insert
  after insert on public.leads
  for each row
  execute function public.handle_lead_insert();

-- 6. View с funnel-метриками — готовый отчёт
create or replace view public.lead_funnel as
select
  date_trunc('day', created_at)::date                                                as day,
  source,
  count(*)                                                                            as total,
  count(*) filter (where status in ('qualified','contacted','in_progress','won'))    as qualified,
  count(*) filter (where status = 'unqualified')                                     as unqualified,
  count(*) filter (where status in ('contacted','in_progress','won'))                as contacted,
  count(*) filter (where status = 'won')                                             as won,
  count(*) filter (where status = 'lost')                                            as lost,
  coalesce(sum(value_uah) filter (where status = 'won'), 0)                          as revenue_uah,
  -- Конверсии
  round(100.0 * count(*) filter (where status in ('qualified','contacted','in_progress','won')) / nullif(count(*),0), 2)
                                                                                      as qual_rate_pct,
  round(100.0 * count(*) filter (where status = 'won') / nullif(count(*),0), 2)      as win_rate_pct
from public.leads
group by 1, 2
order by 1 desc, 2;

-- 7. View для Ads sync — лиды которые ещё не отправлены в Google/Meta
create or replace view public.leads_pending_ads_sync as
select
  id,
  created_at,
  qualified_at,
  source,
  locale,
  value_uah,
  attribution,
  synced_to_google_ads_at,
  synced_to_meta_ads_at,
  attribution->>'gclid' as gclid,
  attribution->>'fbclid' as fbclid,
  -- Hashed contacts для enhanced conversions (Google Ads / Meta CAPI требуют SHA-256)
  encode(digest(lower(trim(email)), 'sha256'), 'hex') as email_sha256,
  encode(digest(regexp_replace(phone, '\D', '', 'g'), 'sha256'), 'hex') as phone_sha256
from public.leads
where status in ('qualified','contacted','in_progress','won')
  and (
    synced_to_google_ads_at is null
    or synced_to_meta_ads_at is null
  );

-- =====================================================
-- Готово. Все права на новые объекты — только postgres/service_role.
-- =====================================================
