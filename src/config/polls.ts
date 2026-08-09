// src/config/polls.ts
// Опитування в статтях блогу. Чисті дані без серверних імпортів — файл читають
// І клієнтський компонент, І /api/poll, тож він мусить лишатись без залежностей.

import type { Locale } from "@/i18n/config";

type L = Record<Locale, string>;

export type PollDef = {
  /** Питання над варіантами. */
  question: L;
  /**
   * ⚠️ БІЛИЙ СПИСОК ключів. Сервер приймає голос, лише якщо ключ є тут — інакше
   * підробленим POST можна було б насипати в таблицю довільних рядків.
   * Ключ — стабільний ідентифікатор, у БД лежить саме він, тому НЕ перейменовувати:
   * перейменування = втрата вже зібраних голосів по цьому варіанту.
   */
  options: readonly string[];
  /** Підписи варіантів. Ключі мають збігатися з options. */
  labels: Record<string, L>;
  /** Посилання на картку товару під підписом (де є що показати). */
  hrefs?: Record<string, string>;
};

export const POLLS = {
  "rubber-2026": {
    question: {
      ua: "А чим граєте ви?",
      ru: "А чем играете вы?",
    },
    options: [
      "tenergy-05",
      "tenergy-05-hard",
      "dignics-05",
      "dignics-09c",
      "zyre-03",
      "other-butterfly",
      "other-brand",
    ],
    labels: {
      "tenergy-05": { ua: "Tenergy 05", ru: "Tenergy 05" },
      "tenergy-05-hard": { ua: "Tenergy 05 Hard", ru: "Tenergy 05 Hard" },
      "dignics-05": { ua: "Dignics 05", ru: "Dignics 05" },
      "dignics-09c": { ua: "Dignics 09C", ru: "Dignics 09C" },
      "zyre-03": { ua: "Zyre 03", ru: "Zyre 03" },
      "other-butterfly": { ua: "Інша Butterfly", ru: "Другая Butterfly" },
      "other-brand": { ua: "Інший бренд", ru: "Другой бренд" },
    },
    hrefs: {
      "tenergy-05": "/butterfly/nakladki/tenergy-05",
      "tenergy-05-hard": "/butterfly/nakladki/tenergy-05-hard",
      "dignics-05": "/butterfly/nakladki/dignics-05",
      "dignics-09c": "/butterfly/nakladki/dignics-09c",
      "zyre-03": "/butterfly/nakladki/zyre-03",
    },
  },
} as const satisfies Record<string, PollDef>;

export type PollId = keyof typeof POLLS;

/**
 * Доступ до опитування з РОЗШИРЕНИМ типом.
 *
 * ⚠️ `as const satisfies` вище потрібен, щоб вивести PollId із ключів, але він же робить
 * options кортежем літералів, а labels/hrefs — обʼєктами з фіксованими ключами. Через це
 * `options.includes(будь-який рядок)` і `labels[key]` не компілюються там, де ключ приходить
 * ззовні (тіло запиту, .map по options). Ця функція повертає той самий обʼєкт, але як PollDef.
 */
export function getPoll(id: PollId): PollDef {
  return POLLS[id];
}
