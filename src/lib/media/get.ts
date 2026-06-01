// src/lib/media/get.ts
// Единый кешируемый источник картинок для витрины.
// Одним запросом читает всю таблицу entity_media и отдаёт map "type:slug" → EntityMedia[].
// Кеш инвалидируется тегом MEDIA_TAG при загрузке/удалении (мгновенное обновление без передеплоя).
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityMedia, EntityType } from "./types";

export const MEDIA_TAG = "entity-media";

/** Карта картинок: ключ "type:slug" → список изображений. */
export type EntityMediaMap = Record<string, EntityMedia[]>;

type Row = {
  id: string;
  entity_type: EntityType;
  entity_slug: string;
  public_id: string;
  format: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  sort: number | null;
};

async function loadAll(): Promise<EntityMediaMap> {
  const client = getSupabaseServerClient(); // anon-чтение (политика public select)
  if (!client) return {};
  const db = client as unknown as SupabaseClient;

  const { data, error } = await db
    .from("entity_media")
    .select("*")
    .order("sort", { ascending: true });

  if (error || !data) return {};

  const map: EntityMediaMap = {};
  for (const r of data as Row[]) {
    const item: EntityMedia = {
      id: r.id,
      entityType: r.entity_type,
      entitySlug: r.entity_slug,
      publicId: r.public_id,
      format: r.format ?? null,
      width: r.width ?? null,
      height: r.height ?? null,
      alt: r.alt ?? null,
      sort: r.sort ?? 0,
    };
    const key = `${item.entityType}:${item.entitySlug}`;
    (map[key] ??= []).push(item);
  }
  return map;
}

/** Кешированная карта всех картинок. Безопасно вызывать в любом серверном компоненте. */
export const getMediaMap = unstable_cache(loadAll, ["entity-media-map-v1"], {
  tags: [MEDIA_TAG],
  revalidate: 3600,
});

/** Главное (первое по сортировке) изображение сущности или null. */
export function pickPrimary(
  map: EntityMediaMap,
  type: EntityType,
  slug: string,
): EntityMedia | null {
  return map[`${type}:${slug}`]?.[0] ?? null;
}

/** Все изображения сущности. */
export function pickAll(
  map: EntityMediaMap,
  type: EntityType,
  slug: string,
): EntityMedia[] {
  return map[`${type}:${slug}`] ?? [];
}
