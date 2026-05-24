-- =====================================================
-- TTMAX — Orders (заявки с кошика)
-- Migration: 0004_orders
-- Apply with: supabase db push  OR  paste into SQL Editor
-- =====================================================

create extension if not exists "uuid-ossp";

-- 1. Enum для статусов заказа
do $$ begin
  create type order_status as enum (
    'pending',     -- только пришёл с сайта, не подтверждён
    'processing',  -- менеджер взял в работу
    'paid',        -- оплачен (для безналичных)
    'shipped',     -- передан в доставку
    'delivered',   -- доставлен
    'cancelled',   -- отменён клиентом / нами
    'refunded'     -- возврат
  );
exception when duplicate_object then null; end $$;

-- 2. Sequence + функция для человекочитаемого номера TT-YYYYMMDD-XXXXX
create sequence if not exists public.order_number_seq;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.order_number_seq');
  return 'TT-' || to_char(now() at time zone 'Europe/Kyiv', 'YYYYMMDD')
              || '-' || lpad(n::text, 5, '0');
end;
$$;

-- 3. Таблица orders — шапка заказа
create table if not exists public.orders (
  id                       uuid primary key default uuid_generate_v4(),
  order_number             text not null unique default public.generate_order_number(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- Клиент
  customer_name            text not null,
  customer_phone           text not null,
  customer_email           text,

  -- Локаль интерфейса
  locale                   text not null check (locale in ('uk','ru')),

  -- Доставка
  delivery_method          text not null check (delivery_method in ('np','ukrposhta','pickup')),
  delivery_city            text,
  delivery_branch          text,

  -- Оплата
  payment_method           text not null check (payment_method in ('apple','cod','card')),

  -- Деньги (uah)
  subtotal_uah             numeric(10,2) not null,
  shipping_uah             numeric(10,2) not null default 0,
  total_uah                numeric(10,2) not null,
  items_count              integer not null default 0,

  -- Дополнительно
  comment                  text,
  agreed                   boolean not null default false,

  -- Статус + воронка
  status                   order_status not null default 'pending',
  assigned_to              text,
  notes                    text,                  -- внутренние заметки менеджера
  cancel_reason            text,

  -- Таймстемпы переходов (для аналитики и Ads conversion tracking)
  processing_at            timestamptz,
  paid_at                  timestamptz,
  shipped_at               timestamptz,
  delivered_at             timestamptz,
  cancelled_at             timestamptz,

  -- Маркетинговая атрибуция
  -- (UTM + clickIDs + landing_page + referrer + user_agent + ip)
  attribution              jsonb not null default '{}'::jsonb,

  -- Sync статусы для рекламных платформ
  synced_to_google_ads_at  timestamptz,
  synced_to_meta_ads_at    timestamptz
);

create index if not exists orders_created_at_idx       on public.orders (created_at desc);
create index if not exists orders_status_idx           on public.orders (status);
create index if not exists orders_order_number_idx     on public.orders (order_number);
create index if not exists orders_customer_phone_idx   on public.orders (customer_phone);
create index if not exists orders_assigned_to_idx      on public.orders (assigned_to) where assigned_to is not null;

-- 4. Таблица order_items — позиции заказа
create table if not exists public.order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  created_at      timestamptz not null default now(),

  -- Снепшот товара на момент оформления (catalog может измениться)
  product_id      text not null,
  brand           text not null,
  model           text not null,
  category        text,
  emoji           text,
  price_uah       numeric(10,2) not null,
  qty             integer not null check (qty > 0),
  line_total_uah  numeric(10,2) not null
);

create index if not exists order_items_order_id_idx    on public.order_items (order_id);
create index if not exists order_items_product_id_idx  on public.order_items (product_id);

-- 5. История событий заказа (по аналогии с lead_events)
create table if not exists public.order_events (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  created_at   timestamptz not null default now(),
  from_status  order_status,
  to_status    order_status not null,
  changed_by   text,
  reason       text,
  metadata     jsonb not null default '{}'::jsonb
);

create index if not exists order_events_order_id_idx   on public.order_events (order_id, created_at desc);
create index if not exists order_events_to_status_idx  on public.order_events (to_status, created_at desc);

-- 6. Триггер на обновление статуса заказа
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();

  if new.status is not distinct from old.status then
    return new;
  end if;

  case new.status
    when 'processing' then new.processing_at := coalesce(new.processing_at, now());
    when 'paid'       then new.paid_at       := coalesce(new.paid_at,       now());
    when 'shipped'    then new.shipped_at    := coalesce(new.shipped_at,    now());
    when 'delivered'  then new.delivered_at  := coalesce(new.delivered_at,  now());
    when 'cancelled'  then new.cancelled_at  := coalesce(new.cancelled_at,  now());
    else null;
  end case;

  insert into public.order_events (order_id, from_status, to_status, changed_by, reason)
  values (
    new.id,
    old.status,
    new.status,
    coalesce(new.assigned_to, 'system'),
    case when new.status = 'cancelled' then new.cancel_reason else null end
  );

  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  before update on public.orders
  for each row
  execute function public.handle_order_status_change();

-- 7. Триггер на INSERT — первое событие "pending"
create or replace function public.handle_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_events (order_id, from_status, to_status, changed_by)
  values (new.id, null, new.status, 'system');
  return new;
end;
$$;

drop trigger if exists on_order_insert on public.orders;
create trigger on_order_insert
  after insert on public.orders
  for each row
  execute function public.handle_order_insert();

-- 8. View с funnel-метриками для заказов
create or replace view public.orders_funnel as
select
  date_trunc('day', created_at)::date                                       as day,
  coalesce(attribution->>'utm_source', 'direct')                            as utm_source,
  delivery_method,
  payment_method,
  count(*)                                                                  as total,
  count(*) filter (where status in ('processing','paid','shipped','delivered')) as taken,
  count(*) filter (where status = 'delivered')                              as delivered,
  count(*) filter (where status = 'cancelled')                              as cancelled,
  coalesce(sum(total_uah) filter (where status = 'delivered'), 0)           as revenue_uah,
  coalesce(sum(total_uah), 0)                                               as gmv_uah,
  round(100.0 * count(*) filter (where status = 'delivered') / nullif(count(*), 0), 2)
                                                                            as delivery_rate_pct
from public.orders
group by 1, 2, 3, 4
order by 1 desc;

-- 9. View для Ads sync — заказы которые ещё не отправлены в Google/Meta
create or replace view public.orders_pending_ads_sync as
select
  o.id,
  o.order_number,
  o.created_at,
  o.delivered_at,
  o.locale,
  o.total_uah,
  o.attribution,
  o.synced_to_google_ads_at,
  o.synced_to_meta_ads_at,
  o.attribution->>'gclid'  as gclid,
  o.attribution->>'fbclid' as fbclid,
  encode(digest(lower(trim(o.customer_email)), 'sha256'), 'hex')              as email_sha256,
  encode(digest(regexp_replace(o.customer_phone, '\D', '', 'g'), 'sha256'), 'hex') as phone_sha256
from public.orders o
where o.status in ('processing','paid','shipped','delivered')
  and (
    o.synced_to_google_ads_at is null
    or o.synced_to_meta_ads_at is null
  );

-- =====================================================
-- 10. Row Level Security — точно как в leads/lead_events
-- =====================================================

alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.order_events  enable row level security;

revoke all on public.orders        from anon, authenticated;
revoke all on public.order_items   from anon, authenticated;
revoke all on public.order_events  from anon, authenticated;

-- Grants для authenticated (admin'ы) — RLS политики ограничат до is_admin()
grant select, insert, update, delete on public.orders        to authenticated;
grant select, insert, update, delete on public.order_items   to authenticated;
grant select                          on public.order_events  to authenticated;

-- Views — security_invoker=true чтобы RLS применялся корректно
alter view public.orders_funnel              set (security_invoker = true);
alter view public.orders_pending_ads_sync    set (security_invoker = true);

grant select on public.orders_funnel             to authenticated;
grant select on public.orders_pending_ads_sync   to authenticated;

-- RLS-политики (только admin'ы)
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
on public.orders
for all
to authenticated
using      (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
on public.order_items
for all
to authenticated
using      (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_events_admin_select" on public.order_events;
create policy "order_events_admin_select"
on public.order_events
for select
to authenticated
using (public.is_admin());

-- =====================================================
-- Результат:
--   - anon:                       полностью заблокирован
--   - authenticated, НЕ admin:    проходит auth, но RLS блокирует данные
--   - authenticated AND admin:    полный доступ
--   - service_role (server-side): bypass RLS — /api/orders пишет под ним
-- =====================================================
