// src/lib/analytics/attribution-schema.ts
// Схема поля attribution для публічних форм (/api/leads і /api/orders).
//
// ⚠️ НАВІЩО: раніше обидва ендпоінти приймали z.record(z.string(), z.unknown()) — тобто jsonb
// БУДЬ-ЯКОГО розміру (до платформного ліміту ~4.5 МБ на запит) писався в БД без обмежень.
// Кілька сотень таких запитів вичерпують квоту Supabase, після чого перестають зберігатись
// СПРАВЖНІ замовлення. Ключі анонімні, авторизації тут немає за задумом — тому обмежуємо.
//
// ⚠️ Список має покривати ВСЕ, що реально пише getAttribution() (attribution.ts), плюс поля,
// які додають форми (product / productName / productSlug). Забути ключ = ТИХО втратити
// атрибуцію реклами: невідомі ключі відкидаються мовчки (.strip()), помилки не буде.
// Додаєш новий utm-параметр у attribution.ts — додай і сюди.
//
// Спільний модуль СВІДОМО: коли схема лежала окремо в кожному роуті, вони розходились.
import { z } from "zod";

export const AttributionSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    gclid: z.string().max(300).optional(),
    gbraid: z.string().max(300).optional(),
    wbraid: z.string().max(300).optional(),
    fbclid: z.string().max(300).optional(),
    msclkid: z.string().max(300).optional(),
    landing_page: z.string().max(500).optional(),
    referrer: z.string().max(500).optional(),
    captured_at: z.string().max(40).optional(),
    product: z.string().max(200).optional(),
    productName: z.string().max(200).optional(),
    productSlug: z.string().max(200).optional(),
  })
  .strip();
