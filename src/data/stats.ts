import { siteConfig } from "@/config/site";

export const heroStats = {
  productsTotal: 340,
  /** Re-used as "Butterfly collections / series count" in Hero */
  brandsTotal: 6,
  yearsExperience: new Date().getFullYear() - siteConfig.yearFounded,
} as const;
