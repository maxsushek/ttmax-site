// src/lib/homepage/home.ts
// Серверні хелпери головної (читають site_settings). Константи — у ./keys (client-safe).
import type { SettingsMap } from "@/lib/settings/get";
import { settingString } from "@/lib/settings/get";
import { HOME_KEYS, DEFAULT_HITS, parseHits, homeKey } from "./keys";

export { HOME_KEYS, HOME_KEY_VALUES, DEFAULT_HITS, parseHits } from "./keys";

/** Резолвлені текстові оверрайди головної (порожнэ "" → секція бере дефолт із i18n). */
export type HomeOverrides = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
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
