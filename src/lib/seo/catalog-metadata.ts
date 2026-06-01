import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getMessages } from "@/i18n";
import { locales, type Locale } from "@/i18n/config";

export function buildMetadata(locale: Locale, pathname: string = ""): Metadata {
  const messages = getMessages(locale);
  const meta = messages.meta;
  const url = `${siteConfig.url}/${locale}${pathname}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${siteConfig.url}/${l}${pathname}`;
  }
  languages["x-default"] = `${siteConfig.url}/uk${pathname}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: meta.title,
      template: meta.titleTemplate,
    },
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title: meta.title,
      description: meta.description,
      locale: locale === "uk" ? "uk_UA" : "ru_UA",
      alternateLocale: locale === "uk" ? ["ru_UA"] : ["uk_UA"],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: siteConfig.launched
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
  };
}
