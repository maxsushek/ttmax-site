// src/lib/seo/catalog-metadata.ts
// Метаданные для страниц КАТАЛОГА (товар/категория/бренд). Отдельный билдер, чтобы не трогать
// существующий buildMetadata. Повторяет его логику canonical/hreflang/OG, но title/description — из данных.
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, localeToLang, type Locale } from "@/i18n/config";
import { ogImages as brandOgImages } from "./og-image";

export function buildCatalogMetadata(opts: {
  locale: Locale;
  /** Путь без локали, напр. "/butterfly/nakladki/dignics-09c". */
  pathname: string;
  title: string;
  description: string;
  /** false → noindex (для пустых категорий до наполнения). */
  index?: boolean;
  /** Абсолютний URL зображення для og:image / twitter (1200×630). */
  image?: string;
  /**
   * Опис для og/twitter, якщо він має бути ДОВШИЙ за meta description.
   * Соцмережі не ріжуть на 155, тож картка товару віддає туди повний вердикт експерта.
   * Не задано — використовується description.
   */
  ogDescription?: string;
}): Metadata {
  const { locale, pathname, title, description, index = true, image } = opts;
  const ogDescription = opts.ogDescription || description;
  // ⚠️ Фолбек ОБОВʼЯЗКОВИЙ. Цей білдер обслуговує не лише картки товару (де фото є),
  // а й /about, /delivery, /payment, /returns, /terms, /privacy, /contacts — там
  // картинки немає взагалі, і в Telegram вони йшли голим текстом. Дефолт із
  // buildMetadata сюди НЕ доїжджає: openGraph сторінки замінює батьківський цілком,
  // а не зливається з ним по полях.
  const ogImages = image
    ? [{ url: image, width: 1200, height: 630, alt: title }]
    : brandOgImages(locale);
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
      description: ogDescription,
      locale: locale === "ua" ? "uk_UA" : "ru_UA",
      alternateLocale: locale === "ua" ? ["ru_UA"] : ["uk_UA"],
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: ogImages,
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
