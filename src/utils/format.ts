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

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("380")
    ? digits
    : digits.startsWith("0")
      ? "38" + digits
      : "380" + digits;
  const c = normalized.slice(0, 12);
  return (
    "+" +
    [c.slice(0, 3), c.slice(3, 5), c.slice(5, 8), c.slice(8, 10), c.slice(10, 12)]
      .filter(Boolean)
      .join(" ")
  );
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
