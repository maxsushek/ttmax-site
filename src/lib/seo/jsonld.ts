import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: siteConfig.social.map((s) => s.href).filter((h) => h !== "#"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteConfig.phoneDisplay,
        contactType: "customer service",
        areaServed: "UA",
        availableLanguage: ["uk", "ru"],
      },
    ],
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: `${siteConfig.url}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/${locale}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phoneDisplay,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.address,
    },
  };
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** Хлібні крихти. items: [{ name, path }], path без локалі ("/" = головна). */
export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>,
  locale: Locale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}/${locale}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

/** Schema.org Product для сторінки товару. Якщо ціни немає — блок offers не додається. */
export function productJsonLd(opts: {
  name: string;
  description: string;
  /** Абсолютний URL сторінки товару. */
  url: string;
  brand: string;
  /** Абсолютні URL зображень (поки порожньо — додамо з Cloudinary). */
  images?: string[];
  sku?: string;
  /** Ціна "від". */
  price?: number;
  /** Напр. "UAH". */
  currency?: string;
  inStock?: boolean;
}) {
  const { name, description, url, brand, images, sku, price, currency = "UAH", inStock } = opts;

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    brand: { "@type": "Brand", name: brand },
  };
  if (images && images.length > 0) node.image = images;
  if (sku) node.sku = sku;
  if (typeof price === "number" && price > 0) {
    node.offers = {
      "@type": "Offer",
      url,
      price,
      priceCurrency: currency,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    };
  }
  return node;
}
