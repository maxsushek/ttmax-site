// src/data/catalog/aliases.ts
// Кириличне написання моделей: «Butterfly Viscaria» → «Баттерфляй Вискария».
//
// ⚠️ НАВІЩО (GSC, жовтень–листопад 2026): частина покупців шукає моделі кирилицею —
// «дигникс 09с», «тенерджи 19», «харимото алс», «глейзер 09с», «мизутани злц», «батерфляй».
// Конкуренція за такими запитами слабша, ніж за латиницею, але на картках цих слів не було
// зовсім. Показуємо їх одним рядком під H1 (люди й так не знають, як читається назва) і
// в Product.alternateName — без набивання ключів у текст.
//
// Будується зі СЛОВНИКА ТОКЕНІВ (aliasTokens.ts), а не вручну на кожну картку: так 127
// карток отримують однакові написання, а правка одного слова змінює всі моделі з ним.
// Токен зі значенням null (абревіатури без усталеного кириличного написання) лишається
// латиницею; якщо жоден токен моделі не перекладено — рядка немає взагалі.
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import { ALIAS_BRAND, ALIAS_TOKENS } from "./aliasTokens";

const KINDS = new Set(["rubber", "base"]);

export function cyrillicName(product: CatalogProduct, locale: Locale): string | null {
  if (!KINDS.has(product.kind ?? "rubber")) return null;
  let translated = 0;
  const words = product.model.split(/\s+/).map((w) => {
    const hit = ALIAS_TOKENS[w];
    if (hit) {
      translated++;
      return hit[locale];
    }
    return w;
  });
  if (translated === 0) return null;
  const brand = product.brandSlug === "butterfly" ? ALIAS_BRAND[locale] : null;
  return [brand, ...words].filter(Boolean).join(" ");
}
