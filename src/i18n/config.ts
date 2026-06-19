export const locales = ["ua", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ua";

export const localeNames: Record<Locale, string> = {
  ua: "Українська",
  ru: "Русский",
};

export const localeLabels: Record<Locale, string> = {
  ua: "UA",
  ru: "RU",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** BCP-47 код мови для <html lang>, hreflang та Schema inLanguage. URL лишається /ua. */
export const localeToLang: Record<Locale, string> = {
  ua: "uk",
  ru: "ru",
};
