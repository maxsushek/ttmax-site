/**
 * ⚠️ «грн», а НЕ знак ₴ — і повертати ₴ не треба.
 *
 * Заміряно на живому проді через PageSpeed: один символ ₴ робив кандидатами ТРИ
 * підмножинні файли вебшрифта, яких немає серед префетчених, — Tektur latin-ext
 * (16 КБ), Roboto latin-ext (25 КБ) і Roboto cyrillic-ext (32 КБ), разом 73 КБ.
 * Вони висіли в критичному ланцюжку й забивали канал у момент відмальовки.
 * «грн» — кирилиця, вона вже завантажена, тож коштує рівно нуль.
 *
 * Рішення власника 04.08.2026. Форма «грн» — стандарт для українського рітейлу.
 */
export const CURRENCY_SYMBOL = "грн";

export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("uk-UA").format(amount)}\u00A0${CURRENCY_SYMBOL}`;
}

export function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatCardExp(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
