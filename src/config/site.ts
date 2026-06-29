export const siteConfig = {
  /** Main brand displayed in Logo/Header/Footer */
  name: "Butterfly UA",
  /** Yellow-accented part of the brand name in Logo */
  brandSuffix: "UA",
  /** Sub-brand line shown under main logo */
  subBrand: "by TTMAX",
  /** Used in legal footer copyright */
  operator: "TTMAX",
  domain: "ttmax.ua",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ttmax.ua",
  /** false → весь сайт noindex + robots блокує все (до офіційного запуску). Вмикається NEXT_PUBLIC_SITE_LAUNCHED="true". */
  launched: process.env.NEXT_PUBLIC_SITE_LAUNCHED === "true",
  emoji: "🦋",
  /** Featured brand on the storefront (used in Hero, FAQ, JSON-LD) */
  featuredBrand: "Butterfly",
  phone: "+380000000000",
  phoneDisplay: "+380 (XX) XXX-XX-XX",
  email: "hello@ttmax.ua",
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
