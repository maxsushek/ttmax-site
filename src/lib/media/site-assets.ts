// src/lib/media/site-assets.ts
// Загальносайтові зображення (logo / hero / favicon).
// Зберігаються в існуючій таблиці entity_media БЕЗ нової міграції:
// перевикористовуємо entity_type="category" із зарезервованими slug.
// Важливо: slug у API валідовано регуляркою /^[a-z0-9-]{1,80}$/ (без підкреслень),
// тому ключі — лише малі літери та дефіси. З реальними категоріями
// (nakladki, osnovaniya, rakety, …) ці slug не перетинаються.
import { pickPrimary, type EntityMediaMap } from "./get";
import type { EntityMedia, EntityType } from "./types";

/** Тип сутності, під яким живуть сайтові слоти. */
export const SITE_ASSET_TYPE: EntityType = "category";

/** Зарезервовані slug сайтових слотів. */
export const SITE_ASSETS = {
  logo: "site-logo",
  hero: "site-hero",
  favicon: "site-favicon",
} as const;

export type SiteAssetKey = keyof typeof SITE_ASSETS;

/** Головне (перше) зображення для сайтового слота або null. */
export function getSiteAsset(map: EntityMediaMap, key: SiteAssetKey): EntityMedia | null {
  return pickPrimary(map, SITE_ASSET_TYPE, SITE_ASSETS[key]);
}
