// src/data/catalog/gtin.ts
// Штрихкоди (GTIN / JAN / EAN) товарів — для фіду Google Merchant і розмітки Product.
//
// НАВІЩО: Google зводить пропозиції різних магазинів в одну картку товару саме за GTIN.
// Без коду наш рядок у фіді «обмеженої ефективності», а відгуки й рейтинг не привʼязуються
// до загальної картки моделі в Shopping.
//
// КЛЮЧ — той самий рядок, з якого фід рахує id (feedId у lib/feeds/google-merchant.ts):
//   накладка:            `${slug}__${товщина}__${колір}`  → "dignics-05__2.1__red"
//   одяг / взуття:       `${slug}__${розмір}`             → "futbolka-butterfly-…__M"
//   чохол у кольорах:    `${slug}__${колір ua}`
//   товар без варіантів: `${slug}`                        → основа, клей, мʼячі
// Порожній шаблон з усіма ключами: `npx tsx scripts/gtin-template.ts > gtin.csv`.
//
// ⚠️ ДЖЕРЕЛО — ЛИШЕ штрихкод на упаковці товару, що лежить у нас на складі, або накладна /
// прайс постачальника. НЕ брати коди з японських магазинів «за назвою»: у Butterfly в одного
// й того самого варіанта бувають різні JAN (після зміни маркування товщин у грудні 2024 —
// «TA»→«2.1», «A»→«1.9» — частина моделей отримала нові коди), і хибний GTIN гірший за
// відсутній: Merchant Center позначає товар як невідповідний коду, а Google може приклеїти
// нашу пропозицію до чужої картки.
//
// ⚠️ У основ код залежить від ручки (FL/ST/AN), а у фіді основа поки ОДИН рядок без ручки —
// тому основам код ставити лише тоді, коли модель продається з однією ручкою.
export const GTIN: Readonly<Record<string, string>> = {
  // "dignics-05__2.1__red": "4906901199811",
};

/** Контрольна цифра GTIN-8/12/13/14 (той самий алгоритм для всіх довжин). */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Ключ таблиці GTIN — збігається з сирим ключем id у фіді. */
export const gtinKey = (slug: string, ...parts: string[]): string => [slug, ...parts].join("__");

/** Код для ключа або undefined. Код з хибною контрольною цифрою не віддається нікуди. */
export function gtinFor(key: string): string | undefined {
  const code = GTIN[key]?.replace(/\s+/g, "");
  return code && isValidGtin(code) ? code : undefined;
}
