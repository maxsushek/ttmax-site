// src/lib/homepage/home.ts
// Серверні хелпери головної (читають site_settings). Константи — у ./keys (client-safe).
import type { SettingsMap } from "@/lib/settings/get";
import { settingString } from "@/lib/settings/get";
import { getMessages, t } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { heroStats } from "@/data/stats";
import {
  HOME_KEYS,
  HOME_SINGLE,
  DEFAULT_HERO_IMAGE_BADGE,
  DEFAULT_HITS,
  parseHits,
  homeKey,
} from "./keys";

export { HOME_KEYS, HOME_KEY_VALUES, DEFAULT_HITS, parseHits } from "./keys";

/**
 * Поточні (дефолтні) тексти головної з i18n під локаль — base → значення.
 * Використовуэться в адмінці, щоб ПОКАЗАТИ реальний контент у полях (а не порожнэ),
 * і щоб зберігати лише те, що адмін реально змінив (diff проти цих дефолтів).
 */
export function homeDefaults(locale: Locale): Record<string, string> {
  const m = getMessages(locale);
  const brandsCount = heroStats.brandsTotal;
  return {
    hero_badge: m.hero.badge,
    hero_title: `${m.hero.title1} ${m.hero.title2}`,
    hero_subtitle: t(m.hero.subtitle, { brandsCount }),
    hero_stat1_label: m.hero.stats.products,
    hero_stat2_label: m.hero.stats.brands,
    hero_stat3_label: m.hero.stats.experience,
    cat_kicker: m.categories.kicker,
    cat_title_muted: m.categories.titleMuted,
    cat_title_accent: m.categories.titleAccent,
    prod_kicker: m.products.kicker,
    prod_title_muted: m.products.titleMuted,
    prod_title_accent: m.products.titleAccent,
    brands_kicker: m.brands.kicker,
    brands_title: m.brands.title,
    trust_1: m.trustBar.delivery,
    trust_2: m.trustBar.returns,
    trust_3: m.trustBar.secure,
    trust_4: m.trustBar.rating,
    cta_kicker: m.cta.kicker,
    cta_title: `${m.cta.title1} ${m.cta.title2}`,
    cta_subtitle: m.cta.subtitle,
    faq_kicker: m.faq.kicker,
    faq_title: m.faq.title,
  };
}

/** Дефолти мовно-нейтральних полів Hero (числа статистики + бейдж під фото). */
export function homeSingleDefaults(): Record<string, string> {
  return {
    [HOME_SINGLE.stat1Value]: `${heroStats.productsTotal}+`,
    [HOME_SINGLE.stat2Value]: `${heroStats.brandsTotal}+`,
    [HOME_SINGLE.stat3Value]: `${heroStats.yearsExperience}`,
    [HOME_SINGLE.imageBadge]: DEFAULT_HERO_IMAGE_BADGE,
  };
}

/** Резолвлені текстові оверрайди головної (порожнэ "" → секція бере дефолт із i18n). */
export type HomeOverrides = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  statValue1: string;
  statValue2: string;
  statValue3: string;
  statLabel1: string;
  statLabel2: string;
  statLabel3: string;
  heroImageBadge: string;
  catKicker: string;
  catTitleMuted: string;
  catTitleAccent: string;
  prodKicker: string;
  prodTitleMuted: string;
  prodTitleAccent: string;
  brandsKicker: string;
  brandsTitle: string;
  trust1: string;
  trust2: string;
  trust3: string;
  trust4: string;
  ctaKicker: string;
  ctaTitle: string;
  ctaSubtitle: string;
  faqKicker: string;
  faqTitle: string;
};

/** Зчитує всі текстові оверрайди головної під поточну локаль (одним проходом по settings). */
export function resolveHomeOverrides(settings: SettingsMap, locale: "ua" | "ru"): HomeOverrides {
  const lang = locale === "ru" ? "ru" : "uk";
  const g = (base: string) => settingString(settings, homeKey(base, lang));
  return {
    heroBadge: g("hero_badge"),
    heroTitle: g("hero_title"),
    heroSubtitle: g("hero_subtitle"),
    statValue1: settingString(settings, HOME_SINGLE.stat1Value),
    statValue2: settingString(settings, HOME_SINGLE.stat2Value),
    statValue3: settingString(settings, HOME_SINGLE.stat3Value),
    statLabel1: g("hero_stat1_label"),
    statLabel2: g("hero_stat2_label"),
    statLabel3: g("hero_stat3_label"),
    heroImageBadge: settingString(settings, HOME_SINGLE.imageBadge),
    catKicker: g("cat_kicker"),
    catTitleMuted: g("cat_title_muted"),
    catTitleAccent: g("cat_title_accent"),
    prodKicker: g("prod_kicker"),
    prodTitleMuted: g("prod_title_muted"),
    prodTitleAccent: g("prod_title_accent"),
    brandsKicker: g("brands_kicker"),
    brandsTitle: g("brands_title"),
    trust1: g("trust_1"),
    trust2: g("trust_2"),
    trust3: g("trust_3"),
    trust4: g("trust_4"),
    ctaKicker: g("cta_kicker"),
    ctaTitle: g("cta_title"),
    ctaSubtitle: g("cta_subtitle"),
    faqKicker: g("faq_kicker"),
    faqTitle: g("faq_title"),
  };
}

/** Поточні slug хітів: налаштування або дефолтний сид. */
export function resolveHitSlugs(settings: SettingsMap): string[] {
  const list = parseHits(settingString(settings, HOME_KEYS.hits));
  return list.length > 0 ? list : DEFAULT_HITS;
}
