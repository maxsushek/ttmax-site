export const locales = ["uk", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const localeNames: Record<Locale, string> = {
  uk: "Українська",
  ru: "Русский",
};

export const localeLabels: Record<Locale, string> = {
  uk: "UA",
  ru: "RU",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
