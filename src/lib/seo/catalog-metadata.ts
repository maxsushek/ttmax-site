// src/lib/seo/catalog-metadata.ts
// Метаданные для страниц КАТАЛОГА (товар/категория/бренд). Отдельный билдер, чтобы не трогать
// существующий buildMetadata. Повторяет его логику canonical/hreflang/OG, но title/description — из данных.
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, localeToLang, type Locale } from "@/i18n/config";

export function buildCatalogMetadata(opts: {
  locale: Locale;
  /** Путь без локали, напр. "/butterfly/nakladki/dignics-09c". */
  pathname: string;
  title: string;
  description: string;
  /** false → noindex (для пустых категорий до наполнения). */
  index?: boolean;
}): Metadata {
  const { locale, pathname, title, description, index = true } = opts;
  // До запуску — все сторінки каталогу noindex, навіть наповнені.
  const indexable = siteConfig.launched && index;

  const url = `${siteConfig.url}/${locale}${pathname}`;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeToLang[l]] = `${siteConfig.url}/${l}${pathname}`;
  languages["x-default"] = `${siteConfig.url}/${defaultLocale}${pathname}`;

  return {
    // absolute → игнорирует title.template из корневого layout (заголовки уже полные).
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title,
      description,
      locale: locale === "ua" ? "uk_UA" : "ru_UA",
      alternateLocale: locale === "ua" ? ["ru_UA"] : ["uk_UA"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: indexable
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        }
      : { index: false, follow: true },
  };
}
