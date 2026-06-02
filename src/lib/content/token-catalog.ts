// src/lib/content/token-catalog.ts
// ЧИСТИЙ каталог токенів контенту (без серверних імпортів) — спільний для:
//   • адмін-UI (шпаргалка + підсвічування, де які формули вжито),
//   • серверного сканування (огляд формул по всіх описах).
// Тут НЕМАЄ обчислення значень — лише визначення/опис/пошук. Обчислення живе в tokens.ts.

export type TokenDef = {
  /** Як показати в шпаргалці. */
  label: string;
  /** Що вставити/скопіювати (готовий приклад). */
  insert: string;
  /** Пояснення українською (адмінка україномовна). */
  desc: string;
};

export const TOKEN_DEFS: TokenDef[] = [
  {
    label: "{{price_from}}",
    insert: "{{price_from}}",
    desc: "Мін. ціна ЦІЄЇ сутності (серія/категорія) — з оверрайдами цін із адмінки.",
  },
  {
    label: "{{price_from:slug}}",
    insert: "{{price_from:tenergy}}",
    desc: "Мін. ціна ІНШОЇ серії/категорії за slug (напр. tenergy) — для блоків порівняння.",
  },
  {
    label: "{{price:slug}}",
    insert: "{{price:dignics-05}}",
    desc: "Ціна конкретного товару за slug.",
  },
  {
    label: "{{count}}",
    insert: "{{count}}",
    desc: "Кількість моделей у цій сутності.",
  },
  {
    label: "{{count:slug}}",
    insert: "{{count:tenergy}}",
    desc: "Кількість моделей в іншій серії/категорії.",
  },
  {
    label: "{{year}}",
    insert: "{{year}}",
    desc: "Поточний рік (для свіжості заголовків).",
  },
];

export const TOKEN_NOTE =
  "Ціна вже з символом ₴ — пишіть «від {{price_from}}» без ручного ₴ (інакше буде подвійний ₴). " +
  "Значення підставляються на сайті автоматично; зміна ціни в адмінці одразу оновлює всі формули.";

// Має збігатися з рушієм у tokens.ts.
const SCAN_RE = /\{\{\s*[a-z_]+(?::[a-z0-9-]+)?\s*\}\}/gi;

/** Унікальні токени в тексті, нормалізовані до вигляду {{name}} / {{name:arg}} без зайвих пробілів. */
export function findTokens(text: string | null | undefined): string[] {
  if (!text) return [];
  const out = new Set<string>();
  for (const m of text.matchAll(SCAN_RE)) out.add(m[0].replace(/\s+/g, ""));
  return [...out];
}

/** Рекурсивно шукає токени в будь-якому JSON-значенні (рядки, масиви, обʼєкти: FAQ, порівняння). */
export function findTokensDeep(value: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      for (const t of findTokens(v)) out.add(t);
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (v && typeof v === "object") {
      Object.values(v as Record<string, unknown>).forEach(walk);
    }
  };
  walk(value);
  return [...out];
}
