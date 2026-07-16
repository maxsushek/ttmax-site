// src/lib/seo/blog-metadata.ts
// Метадані для сторінок блогу. Окремий білдер (НЕ чіпаємо buildCatalogMetadata — його
// дьоргають каталог і 7 статичних сторінок). Додає og:type=article + published/modified time.
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, localeToLang, type Locale } from "@/i18n/config";

export function buildBlogMetadata(opts: {
  locale: Locale;
  /** Шлях без локалі, напр. "/blog" або "/blog/pravyla-nastilnogo-tenisu". */
  pathname: string;
  title: string;
  description: string;
  /** false → noindex (для чернеток/службових). */
  index?: boolean;
  /** Абсолютний URL обкладинки (1200×630). */
  image?: string;
  /** Для статей: ISO-дати + автор → og article-теги. */
  article?: {
    publishedTime: string;
    modifiedTime: string;
    authorUrl: string;
  };
}): Metadata {
  const { locale, pathname, title, description, index = true, image, article } = opts;
  // До запуску — весь сайт noindex (консистентно з buildCatalogMetadata).
  const indexable = siteConfig.launched && index;

  const url = `${siteConfig.url}/${locale}${pathname}`;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeToLang[l]] = `${siteConfig.url}/${l}${pathname}`;
  languages["x-default"] = `${siteConfig.url}/${defaultLocale}${pathname}`;

  const ogImages = image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined;
  const ogLocale = locale === "ua" ? "uk_UA" : "ru_UA";
  const ogAlt = locale === "ua" ? ["ru_UA"] : ["uk_UA"];

  // Два окремі літерали — щоб не зламати дискримінований union OpenGraph по `type`.
  const openGraph: Metadata["openGraph"] = article
    ? {
        type: "article",
        url,
        siteName: siteConfig.name,
        title,
        description,
        locale: ogLocale,
        alternateLocale: ogAlt,
        ...(ogImages ? { images: ogImages } : {}),
        publishedTime: article.publishedTime,
        modifiedTime: article.modifiedTime,
        authors: [article.authorUrl],
      }
    : {
        type: "website",
        url,
        siteName: siteConfig.name,
        title,
        description,
        locale: ogLocale,
        alternateLocale: ogAlt,
        ...(ogImages ? { images: ogImages } : {}),
      };

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
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
