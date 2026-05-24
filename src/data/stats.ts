import { siteConfig } from "@/config/site";

export const heroStats = {
  productsTotal: 1000,
  brandsTotal: 20,
  yearsExperience: new Date().getFullYear() - siteConfig.yearFounded,
} as const;
