// src/data/playerProfiles.ts
// Сторінки гравців /{locale}/igroki/{slug}: карʼєра + інвентар із посиланнями на товари.
//
// ⚠️ ДЖЕРЕЛА. Інвентар — ЛИШЕ з офіційних сторінок Butterfly (butterfly.co.jp/players/detail/<slug>.html,
// блок 使用用具 з датою «станом на»; порядок там: основа → форхенд → бекхенд) або butterfly-global.com.
// Дата `equipment.asOf` — та, що надрукована на сторінці Butterfly, а не дата нашої перевірки (`checked`).
// Титули — сторінки Butterfly, ITTF/WTT, olympics.com; Вікіпедія — лише як вторинне джерело.
// Нічого «від себе»: стиль гри, оцінки й цитати не вигадуємо.
//
// Дані згенеровано з перевірених JSON (scripts/gen-player-profiles.mjs) — правити можна тут напряму,
// але при повторній генерації ручні правки затруться: краще міняти JSON і перегенеровувати.
// Імена, Wikidata й фото — у players.ts (одне джерело з блогом).
import type { Locale } from "@/i18n/config";
import type { PlayerSlug } from "@/data/players";
import { PROFILES_DATA } from "@/data/playerProfilesData";

type L = Record<Locale, string>;

export type EquipmentItem = { name: string; product: string | null };

export type PlayerProfile = {
  slug: PlayerSlug;
  /** Дата нашої звірки з джерелами. */
  checked: string;
  country: { code: string } & L;
  born: string | null;
  active: boolean;
  retired: string | null;
  hand: "right" | "left" | null;
  grip: "shakehand" | "penhold" | null;
  summary: L;
  bio: Record<Locale, string[]>;
  achievements: { year: number; event: L; result: L; source: string }[];
  ranking: { best: number | null; bestDate: string | null; source: string | null };
  equipment: {
    asOf: string;
    source: string;
    blade: EquipmentItem;
    fh: EquipmentItem | null;
    bh: EquipmentItem | null;
    note: L | null;
  };
  history: { period: L; blade: string; rubbers: string; source: string }[];
  faq: { q: L; a: L }[];
  sources: { label: L; url: string; kind: "official" | "reference" }[];
};

export const PROFILES: Partial<Record<PlayerSlug, PlayerProfile>> = PROFILES_DATA;

export function getProfile(slug: string): PlayerProfile | null {
  return (PROFILES as Record<string, PlayerProfile | undefined>)[slug] ?? null;
}

/**
 * Порядок у списку: спершу чинні топ-гравці (за пошуковим попитом і рейтингом), далі —
 * ті, хто завершив карʼєру. Гравці поза списком — у кінці, за алфавітом slug.
 */
const ORDER: string[] = [
  "harimoto-tomokazu",
  "lin-yunju",
  "fan-zhendong",
  "lin-shidong",
  "harimoto-miwa",
  "ovtcharov-dimitrij",
  "franziska-patrick",
  "freitas-marcos",
  "apolonia-tiago",
  // друга партія (03.11.2026)
  "matsushima-sora",
  "togami-shunsuke",
  "shinozuka-hiroto",
  "lim-jonghoon",
  "wong-chun-ting",
  "zhu-yuling",
  "cheng-i-ching",
  "qiu-dang",
  "kallberg-anton",
  "gacina-andrej",
  "polcanova-sofia",
  "jha-kanak",
  "diaz-adriana",
  "assar-omar",
  // завершили карʼєру
  "boll-timo",
  "zhang-jike",
  "mizutani-jun",
];

export function allProfiles(): PlayerProfile[] {
  const rank = (slug: string) => {
    const i = ORDER.indexOf(slug);
    return i === -1 ? ORDER.length : i;
  };
  return Object.values(PROFILES)
    .filter((p): p is PlayerProfile => Boolean(p))
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
}

export function hasProfile(slug: string): boolean {
  return getProfile(slug) !== null;
}

/** Товари з чинного інвентарю гравця (основа → форхенд → бекхенд), без повторів. */
export function profileProductSlugs(p: PlayerProfile): string[] {
  const items = [p.equipment.blade, p.equipment.fh, p.equipment.bh];
  return [...new Set(items.map((i) => i?.product).filter((s): s is string => Boolean(s)))];
}

/** Хто з гравців грає цим товаром (за чинним інвентарем) — для блоку на картці товару. */
export function playersUsingProduct(productSlug: string): PlayerProfile[] {
  return allProfiles().filter((p) => profileProductSlugs(p).includes(productSlug));
}
