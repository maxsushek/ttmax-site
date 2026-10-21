-- =====================================================
-- TTMAX — Відгуки (про товари й про магазин) з модерацією
-- Migration: 0008_reviews
-- =====================================================
--
-- Потік: форма на сайті → /api/reviews (сервер, service_role) → status 'pending' →
-- повідомлення в Telegram з кнопками → /api/telegram/webhook міняє статус.
-- Публічно показуються лише 'approved' — і читає їх теж сервер (service_role),
-- тому anon/authenticated доступу до таблиці немає зовсім: телефон, IP-хеш і
-- службові поля не можуть «витекти» через публічний ключ.

create extension if not exists "uuid-ossp";

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected', 'spam');
exception when duplicate_object then null; end $$;

create table if not exists public.reviews (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Про що відгук: товар (product_slug — основна картка моделі) або магазин.
  kind           text not null check (kind in ('product', 'store')),
  product_slug   text,
  constraint reviews_kind_slug check (
    (kind = 'product' and product_slug is not null) or
    (kind = 'store'   and product_slug is null)
  ),

  -- Мова, якою написано відгук (для inLanguage у розмітці).
  locale         text not null check (locale in ('uk', 'ru')),

  -- Публічні поля
  rating         smallint not null check (rating between 1 and 5),
  author_name    text not null check (char_length(author_name) between 2 and 60),
  author_city    text check (author_city is null or char_length(author_city) <= 60),
  body           text not null check (char_length(body) between 10 and 3000),

  -- Підтвердження покупки (НЕ публікується): телефон у форматі 380XXXXXXXXX.
  phone          text,
  verified       boolean not null default false,
  order_number   text,
  -- form — звичайна форма; invite — персональне посилання із замовлення.
  source         text not null default 'form' check (source in ('form', 'invite')),

  -- Модерація
  status         review_status not null default 'pending',
  moderated_at   timestamptz,
  moderated_by   text,

  -- Відповідь магазину (з Telegram reply або з адмінки)
  reply_body     text check (reply_body is null or char_length(reply_body) <= 3000),
  reply_at       timestamptz,

  -- Звʼязок із повідомленням у Telegram (щоб редагувати його й ловити reply)
  tg_chat_id     bigint,
  tg_message_id  bigint,

  -- Антиспам: лише хеш IP (з сіллю), не сам IP.
  ip_hash        text,
  user_agent     text,
  flags          text[] not null default '{}',
  meta           jsonb not null default '{}'::jsonb
);

create index if not exists reviews_public_idx   on public.reviews (product_slug, created_at desc) where status = 'approved';
create index if not exists reviews_store_idx    on public.reviews (created_at desc) where status = 'approved' and kind = 'store';
create index if not exists reviews_status_idx   on public.reviews (status, created_at desc);
create index if not exists reviews_ip_idx       on public.reviews (ip_hash, created_at desc);
create index if not exists reviews_tg_msg_idx   on public.reviews (tg_chat_id, tg_message_id);

-- Один відгук на товар (або на магазин) з одного замовлення.
create unique index if not exists reviews_one_per_order_item
  on public.reviews (order_number, kind, coalesce(product_slug, ''))
  where order_number is not null and status <> 'rejected' and status <> 'spam';

create or replace function public.touch_reviews_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_reviews_update on public.reviews;
create trigger on_reviews_update
  before update on public.reviews
  for each row execute function public.touch_reviews_updated_at();

-- RLS: публічного доступу немає; адміни (через сесію /admin) — повний.
alter table public.reviews enable row level security;
revoke all on public.reviews from anon;
revoke all on public.reviews from authenticated;
grant select, update, delete on public.reviews to authenticated;

drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all"
  on public.reviews
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
