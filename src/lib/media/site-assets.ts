// src/lib/media/site-assets.ts
// Загальносайтові зображення (logo / hero / favicon).
// Зберігаються в існуючій таблиці entity_media БЕЗ нової міграції:
// перевикористовуємо entity_type="category" із зарезервованими slug.
// Важливо: slug у API валідовано регуляркою /^[a-z0-9-]{1,80}$/ (без підкреслень),
// тому ключі — лише малі літери та дефіси. З реальними категоріями
// (nakladki, osnovaniya, rakety, …) ці slug не перетинаються.
import { getMediaMap, pickPrimary, type EntityMediaMap } from "./get";
import { cldUrl } from "@/lib/cloudinary/url";
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

/** URL логотипа сайту з адмінки (entity_media → category:site-logo) або undefined. */
export async function getSiteLogoUrl(opts?: { h?: number }): Promise<string | undefined> {
  const map = await getMediaMap();
  const asset = getSiteAsset(map, "logo");
  return asset ? cldUrl(asset.publicId, { h: opts?.h ?? 64, crop: "fit" }) : undefined;
}
