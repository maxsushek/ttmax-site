import { siteConfig } from "@/config/site";
import { localeToLang, type Locale } from "@/i18n/config";
import type { ContactInfo } from "@/lib/contact/get";

export function organizationJsonLd(contact?: ContactInfo) {
  const telephone = contact?.phoneDisplay ?? siteConfig.phoneDisplay;
  const email = contact?.email ?? siteConfig.email;
  const sameAs = contact
    ? Object.values(contact.social).filter((h) => h && h !== "#")
    : siteConfig.social.map((s) => s.href).filter((h) => h !== "#");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone,
        email,
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
    inLanguage: localeToLang[locale],
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
  /** Ціна "від" (для одиничного Offer). */
  price?: number;
  /** Діапазон цін варіантів — для AggregateOffer (коли варіанти мають різні ціни). */
  lowPrice?: number;
  highPrice?: number;
  offerCount?: number;
  /** YYYY-MM-DD; автообчислюється на стороні виклику (вручну не задається). */
  priceValidUntil?: string;
  /** Напр. "UAH". */
  currency?: string;
  inStock?: boolean;
}) {
  const {
    name,
    description,
    url,
    brand,
    images,
    sku,
    price,
    lowPrice,
    highPrice,
    offerCount,
    priceValidUntil,
    currency = "UAH",
    inStock,
  } = opts;

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

  const availability = inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const itemCondition = "https://schema.org/NewCondition";

  if (
    typeof lowPrice === "number" &&
    typeof highPrice === "number" &&
    highPrice > lowPrice &&
    (offerCount ?? 0) > 1
  ) {
    node.offers = {
      "@type": "AggregateOffer",
      url,
      lowPrice,
      highPrice,
      offerCount,
      priceCurrency: currency,
      availability,
      itemCondition,
      ...(priceValidUntil ? { priceValidUntil } : {}),
    };
  } else if (typeof price === "number" && price > 0) {
    node.offers = {
      "@type": "Offer",
      url,
      price,
      priceCurrency: currency,
      availability,
      itemCondition,
      ...(priceValidUntil ? { priceValidUntil } : {}),
    };
  }
  return node;
}
