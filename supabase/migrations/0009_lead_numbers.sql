-- =====================================================
-- TTMAX — Номери заявок (Z-YYYYMMDD-NNNNN)
-- Migration: 0009_lead_numbers
-- =====================================================
--
-- Заявки (швидке замовлення, консультація) отримують людський номер — як замовлення TT-…:
-- на нього посилаються в Telegram, у CRM і в /link Z-… (посилання на відгук).
-- «Z» читається як «З» (заявка), але латиницею — не треба перемикати розкладку.
--
-- Копія замовлення в CRM (source='order') бере номер САМОГО замовлення (TT-…) — це
-- робить /api/orders при вставці; тут — лише бекфіл наявних рядків.

create sequence if not exists public.lead_number_seq;

create or replace function public.generate_lead_number()
returns text
language plpgsql
set search_path = public
as $$
declare
  n bigint;
begin
  n := nextval('public.lead_number_seq');
  return 'Z-' || to_char(now() at time zone 'Europe/Kyiv', 'YYYYMMDD') || '-' || lpad(n::text, 5, '0');
end;
$$;

alter table public.leads add column if not exists lead_number text;

-- 1) Копії замовлень → номер замовлення (той самий телефон, різниця < 2 хв).
update public.leads l
set lead_number = o.order_number
from public.orders o
where l.source = 'order'
  and l.lead_number is null
  and right(regexp_replace(l.phone, '\D', '', 'g'), 9) = right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9)
  and abs(extract(epoch from (l.created_at - o.created_at))) < 120;

-- 2) Решта → Z-номери за датою створення (дата — за Києвом, як у TT-…).
with ordered as (
  select id, created_at, row_number() over (order by created_at) as rn
  from public.leads
  where lead_number is null
)
update public.leads l
set lead_number = 'Z-' || to_char(o.created_at at time zone 'Europe/Kyiv', 'YYYYMMDD') || '-' || lpad(o.rn::text, 5, '0')
from ordered o
where l.id = o.id;

select setval('public.lead_number_seq', greatest(1, (select count(*) from public.leads where lead_number like 'Z-%')));

alter table public.leads alter column lead_number set default public.generate_lead_number();
alter table public.leads alter column lead_number set not null;
create unique index if not exists leads_lead_number_key on public.leads (lead_number);
