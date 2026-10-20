// src/config/delivery.ts
// СТРОКИ ДОСТАВКИ — одне джерело правди для всього сайту.
//
// Звідси беруть числа: сторінка /delivery (data/info.ts), чекаут (підписи перевізників і
// екран «Замовлення оформлено»), розмітка Offer.shippingDetails (lib/seo/jsonld.ts),
// фід Google Merchant Center (lib/feeds/google-merchant.ts) і llms.txt.
//
// ⚠️ ТІ САМІ ЧИСЛА ВВЕДЕНО В GOOGLE MERCHANT CENTER (Доставка → сроки, 20.10.2026):
// обробка 1–2 дні пн–пт, приймання замовлень до 14:00 за Києвом, транспортування пн–сб.
// Змінюєш тут — зміни й там, інакше Google бачитиме на сайті одне, а в акаунті інше.
//
// Раніше строки жили в чотирьох місцях окремо й розійшлись: чекаут обіцяв Нову Пошту за
// 1–2 дні, сторінка доставки — «службою 1–3 дні» для всіх, а розмітка й фід давали
// Укрпошті ті самі 1–3, хоча на чекауті в неї 3–5.
import type { Locale } from "@/i18n/config";

export type DayRange = { readonly min: number; readonly max: number };

export const DELIVERY_DAYS = {
  /** Збирання й відправлення замовлення — РОБОЧІ дні, пн–пт. */
  handling: { min: 1, max: 2 },
  /** У дорозі з перевізником, календарні дні. */
  np: { min: 1, max: 3 },
  ukrposhta: { min: 3, max: 5 },
} as const satisfies Record<string, DayRange>;

/** До котрої години (за Києвом) замовлення робочого дня беремо в роботу того ж дня. */
export const ORDER_CUTOFF = "14:00";

/** Дні, коли обробляємо замовлення (schema.org dayOfWeek). Те саме «пн–пт», що в Merchant Center. */
export const HANDLING_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

/** «день / дні / днів» — за останнім числом діапазону. */
function dayWord(n: number, locale: Locale): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const one = mod10 === 1 && mod100 !== 11;
  const few = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14);
  if (locale === "ru") return one ? "день" : few ? "дня" : "дней";
  return one ? "день" : few ? "дні" : "днів";
}

/** «1–3 дні» / «3–5 днів» / «1–2 робочих дні». */
export function daysLabel(r: DayRange, locale: Locale, working = false): string {
  const range = r.min === r.max ? `${r.max}` : `${r.min}–${r.max}`;
  if (!working) return `${range} ${dayWord(r.max, locale)}`;
  // «робочих днів» після діапазону — родовий відмінок множини, як у тексті сторінки.
  return `${range} ${locale === "ru" ? "рабочих дней" : "робочих днів"}`;
}
