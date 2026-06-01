-- 0005_site_settings.sql
-- Універсальне сховище налаштувань сайту (ключ → значення jsonb).
-- Фундамент для Лічильників (Етап 3), а далі — контактів, доставки, SEO.
-- Читання/запис — лише через service_role (сервер). Анонімний ключ доступу не має.

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Жодних політик для anon/authenticated: доступ лише через service_role,
-- який обходить RLS. Налаштування читаються на сервері (layout / admin API).
