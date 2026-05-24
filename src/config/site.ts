export const siteConfig = {
  name: "TTMAX",
  brandSuffix: "MAX",
  domain: "ttmax.ua",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ttmax.ua",
  emoji: "🏓",
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
  // Schema.org address — placeholder, replace with real data
  address: {
    streetAddress: "",
    addressLocality: "Kyiv",
    addressRegion: "",
    postalCode: "",
    addressCountry: "UA",
  },
} as const;

export type SiteConfig = typeof siteConfig;
