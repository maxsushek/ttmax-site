-- 0006_product_overrides.sql
-- Шар переопределення ціни та наявності поверх коду (як entity_media / site_settings).
-- key = slug товару (рівень товару) АБО "slug__товщина__колір" / "slug__ручка" (рівень варіанту).
-- price / in_stock = NULL означає «використати значення з коду».
-- Запусти в Supabase → SQL Editor → New query → Run.

create table if not exists public.product_overrides (
  key        text primary key,
  price      numeric,
  in_stock   boolean,
  updated_at timestamptz not null default now()
);

alter table public.product_overrides enable row level security;

-- Доступ лише через service_role (сервер), який обходить RLS.
-- Анонімний ключ доступу не має; ціни читаються на сервері (каталог / адмінка).
