import { ua } from "./messages/ua";
import { ru } from "./messages/ru";
import type { Messages } from "./messages/types";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Messages> = { ua, ru };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

/**
 * Lightweight template interpolation.
 * Supports {var} and very basic ICU-style {var, plural, =1{one} other{many}}.
 */
export function t(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  // Plural: {key, plural, =1{...} =2{...} other{...}}
  const pluralRe = /\{(\w+),\s*plural,\s*([^}]*?(?:\{[^}]*\}[^}]*?)*)\}/g;
  let result = template.replace(pluralRe, (_, key: string, body: string) => {
    const value = vars[key];
    if (value === undefined) return "";
    const n = Number(value);
    const cases = [...body.matchAll(/(=\d+|other)\s*\{([^}]*)\}/g)];
    const exact = cases.find(([, sel]) => sel === `=${n}`);
    const other = cases.find(([, sel]) => sel === "other");
    const chosen = exact?.[2] ?? other?.[2] ?? "";
    return chosen.replace(/#/g, String(n));
  });
  // Simple interpolation: {key}
  result = result.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? "" : String(value);
  });
  return result;
}
