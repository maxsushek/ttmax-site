import { siteConfig } from "@/config/site";

export const heroStats = {
  productsTotal: 340,
  /** Re-used as "Butterfly collections / series count" in Hero */
  brandsTotal: 6,
  /**
   * Рік заснування (третій стат у Hero).
   * ⚠️ Раніше було `yearsExperience: new Date().getFullYear() - siteConfig.yearFounded`.
   * Після зміни року заснування на 2026 цей вираз дає 0 — на головній зʼявилось би
   * «0 Років з Butterfly». Показуємо сам рік: він не протухає й не потребує перерахунку.
   * Власник може перебити значення й підпис у /admin (statValue3 / statLabel3).
   */
  foundedYear: siteConfig.yearFounded,
} as const;
