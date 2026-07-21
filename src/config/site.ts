export const siteConfig = {
  /** Main brand displayed in Logo/Header/Footer */
  name: "Butterfly UA",
  /** Yellow-accented part of the brand name in Logo */
  brandSuffix: "UA",
  /** Sub-brand line shown under main logo */
  subBrand: "by TTMAX",
  /** Used in legal footer copyright */
  operator: "TTMAX",
  // Рішення власника (2026-07-21): основний домен — ttmax.com.ua.
  // ⚠️ Фактичний URL у canonical/og/hreflang/sitemap бере NEXT_PUBLIC_SITE_URL (на Vercel зараз
  // vercel-піддомен). Перемикати змінну ТІЛЬКИ ПІСЛЯ того, як домен підключено й відкривається,
  // інакше canonical показуватиме на домен, який не віддає сайт.
  domain: "ttmax.com.ua",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ttmax.com.ua",
  /** Логотип для JSON-LD publisher/Organization (Cloudinary, ≥112px для rich results). */
  logoUrl:
    "https://res.cloudinary.com/dh6vuxjko/image/upload/f_auto,q_auto,c_fit,h_200/ttmax/category/site-logo/hndfad14fgl7vipsxont",
  /** false → весь сайт noindex + robots блокує все (до офіційного запуску). Вмикається NEXT_PUBLIC_SITE_LAUNCHED="true". */
  launched: process.env.NEXT_PUBLIC_SITE_LAUNCHED === "true",
  emoji: "🦋",
  /** Featured brand on the storefront (used in Hero, FAQ, JSON-LD) */
  featuredBrand: "Butterfly",
  phone: "+380000000000",
  phoneDisplay: "+380 (XX) XXX-XX-XX",
  // Фолбек: реальна пошта задається в /admin (contacts) і перебиває це значення.
  email: "hello@ttmax.com.ua",
  freeShippingThreshold: 5000,
  yearFounded: 2008,
  social: [
    { key: "telegram", label: "TG", color: "#229ED9", href: "#" },
    { key: "youtube", label: "YT", color: "#FF0000", href: "#" },
    { key: "facebook", label: "FB", color: "#1877F2", href: "#" },
  ],
  // Schema.org address — магазин у Харкові. TODO: додати точну адресу (streetAddress) + postalCode, коли будуть.
  address: {
    streetAddress: "", // TODO: додати точну адресу магазину в Харкові
    addressLocality: "Kharkiv",
    addressRegion: "Kharkivska oblast",
    postalCode: "",
    addressCountry: "UA",
  },
} as const;

export type SiteConfig = typeof siteConfig;
