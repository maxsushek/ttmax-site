// src/lib/seo/meta-length.ts
// ЄДИНЕ місце, де живуть межі довжин сніпета. Раніше 158 було зашите в product-copy.ts,
// а сторінка автора віддавала повну біографію на 232 символи — тобто ліміт існував, але
// знав про нього лише один файл.
//
// Перевіряє ці ж пороги scripts/check-meta.mjs (обхід живого сайту). Міняєш тут —
// поміняй і там: скрипт навмисно не імпортує з src, бо ходить по HTML, а не по коду.

/** Google ріже сніпет ~160 символів. Тримаємо невеликий запас. */
export const META_CAP = 158;

/**
 * Нижня межа. Коротший опис Google часто ігнорує й склеює сніпет сам — із випадкового
 * місця сторінки, де може опинитись назва фільтра або хлібні крихти. 110 — поріг,
 * на який орієнтуються аудити (Ahrefs, Screaming Frog).
 */
export const META_MIN = 110;

/** Максимум для <title>: далі Google ріже в видачі. */
export const TITLE_CAP = 60;

/**
 * Обрізка по межі КЛАУЗИ (— : ; ,) — читається як завершена думка.
 * Якщо межі в межах ліміту немає — ріжемо по слову з «…».
 *
 * ⚠️ Межу приймаємо, лише якщо вона забирає БІЛЬШУ ЧАСТИНУ ліміту (≥70%).
 * Поріг 45% віддавав опис на 87 символів там, де було доступно 158: у вердикті
 * Omar Assar остання кома стоїть на 62-му символі, і решта 73 просто губились.
 * Не дотягнути до META_MIN гірше, ніж обірвати по слову.
 */
const CLAUSE_MIN_FILL = 0.7;

export function clauseCut(text: string, cap: number = META_CAP): string {
  if (text.length <= cap) return text;
  let best = -1;
  for (const m of text.matchAll(/[—:;,]\s/g)) {
    if (m.index === undefined) continue;
    if (m.index <= cap - 1) best = m.index;
    else break;
  }
  if (best > cap * CLAUSE_MIN_FILL) return `${text.slice(0, best).trimEnd()}.`;
  const hard = text.slice(0, cap - 1);
  const lastSpace = hard.lastIndexOf(" ");
  const base = lastSpace > cap * 0.5 ? hard.slice(0, lastSpace) : hard;
  return `${base.replace(/[\s,;:—-]+$/, "")}…`;
}

/**
 * Розбивка на речення.
 *
 * ⚠️ Межа речення — розділовий знак ПЛЮС пробіл. Наївне `[^.!?]+[.!?]` ламається на
 * скороченнях у назвах: вердикт «Innerforce Layer ALC.S — контрольована…» давав
 * «Innerforce Layer ALC.» — обрубок, який їхав у сніпет як опис товару.
 */
export function sentences(text: string): string[] {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Готовий опис для довільного тексту (біографія автора, опис розділу):
 * добираємо речення, доки влазять, решту ріжемо по клаузі.
 */
export function clampDescription(text: string, cap: number = META_CAP): string {
  const t = text.trim();
  if (t.length <= cap) return t;

  const parts = sentences(t);
  let body = parts[0] ?? t;
  let used = 1;
  for (const next of parts.slice(1)) {
    if (body.length + 1 + next.length > cap) break;
    body = `${body} ${next}`;
    used += 1;
  }

  /**
   * ⚠️ Якщо цілими реченнями не дотягнули до META_MIN — добираємо ЧАСТИНОЮ наступного.
   *
   * Біографія автора російською давала 101 символ: друге речення не влазило цілком,
   * і опис лишався нижче порога, за яким Google складає сніпет сам. Обірвана по клаузі
   * думка краща за опис, який пошуковик замінить власним уривком зі сторінки.
   */
  const rest = parts[used];
  if (body.length < META_MIN && rest) {
    const room = cap - body.length - 1;
    if (room > 40) body = `${body} ${clauseCut(rest, room)}`;
  }

  return body.length <= cap ? body : clauseCut(body, cap);
}
