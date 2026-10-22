-- =====================================================
-- TTMAX — Спосіб оплати «готівка» для замовлень, внесених вручну
-- Migration: 0011_orders_cash_payment
-- =====================================================
-- Продажі наживо (знайомим, зі спецціною) вносяться в orders, щоб вони були в CRM і Telegram
-- і клієнтам можна було надіслати посилання на відгук. На сайті готівку не пропонуємо —
-- чекаут перевіряє спосіб оплати за config/payment.ts, а не за цим обмеженням.
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method = any (array['apple', 'cod', 'card', 'cash']));
