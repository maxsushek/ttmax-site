-- =====================================================
-- TTMAX — Звʼязок заявки / замовлення з повідомленням у Telegram
-- Migration: 0010_tg_message_links
-- =====================================================
--
-- Під повідомленням про заявку чи замовлення — кнопки статусів (як у CRM). Щоб змінити
-- статус із CRM і перемалювати кнопки в чаті, треба знати, яке це повідомлення.

alter table public.leads  add column if not exists tg_chat_id    bigint;
alter table public.leads  add column if not exists tg_message_id bigint;
alter table public.orders add column if not exists tg_chat_id    bigint;
alter table public.orders add column if not exists tg_message_id bigint;
