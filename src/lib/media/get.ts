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

/**
 * ⚠️ Порожня карта картинок — це НЕ безпечний фолбек, а тиха катастрофа.
 *
 * Від неї залежить `isPhotolessHidden`: товар без рядка в entity_media вважається
 * «поки без фото» і ховається з лістингу, з sitemap і йде в noindex. Тому збірка,
 * у якої не було доступу до Supabase, збирає САЙТ БЕЗ ЖОДНОГО ФОТО і з порожніми
 * категоріями — і виглядає при цьому успішною. Саме так вийшло на локальному
 * сухому прогоні: /odyag і /myachi зібрались порожніми, хоч на проді там 47 і 7 карток.
 *
 * На проді таку збірку Vercel задеплоїв би мовчки. Тому на БІЛДІ падаємо голосно:
 * зламаний деплой помітно одразу, а сайт без фото в індексі — ні.
 * У рантаймі (ISR/ревалідація) лишаємо м'яку поведінку: сторінка вже є, і краще
 * віддати її без свіжих картинок, ніж 500.
 */
function onMediaFailure(reason: string): EntityMediaMap {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      `[media] ${reason}. Збірка зупинена: без entity_media сайт зібрався б без фото ` +
        `і з порожніми категоріями. Перевір SUPABASE env у Vercel.`,
    );
  }
  console.error(`[media] ${reason} — віддаю порожню карту (рантайм)`);
  return {};
}

async function loadAll(): Promise<EntityMediaMap> {
  const client = getSupabaseServerClient(); // anon-чтение (политика public select)
  if (!client) return onMediaFailure("немає клієнта Supabase");
  const db = client as unknown as SupabaseClient;

  const { data, error } = await db
    .from("entity_media")
    .select("*")
    .order("sort", { ascending: true });

  if (error || !data) return onMediaFailure(`запит до entity_media не вдався: ${error?.message ?? "порожня відповідь"}`);

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

/**
 * ⚠️ БУМПНУТИ ВЕРСІЮ В КЛЮЧІ ПРИ ПРАВЦІ entity_media НАПРЯМУ ЧЕРЕЗ SQL.
 *
 * Та сама пастка, що і в content/get.ts: Data Cache на Vercel спільний для деплоїв, тож
 * редеплой його НЕ скидає. Запис в обхід адмінки (яка кличе revalidateTag(MEDIA_TAG))
 * лишається невидимим до години — фото вже в БД, а сторінка далі малює порожню галерею.
 * Інкремент версії = гарантований промах = свіже читання з БД на першому ж запиті.
 *
 * v2: додано фото 5 клеїв Free Chack / Free Chack Pro II (залиті власником у Cloudinary,
 * рядки entity_media проставлені SQL-ом).
 * v3: + Free Chack Pro II 500 ml.
 * v4: + Free Chack 500 ml (avif; поле format ніде не читається, лише зберігається).
 * v5: + Freechack PRO 37 ml.
 * v6: + усі 3 сітки (Elite Clip, Europa, National League) — категорія закрита повністю.
 * v7: + 2 мʼячі (Training Ball 40+ 6шт, S40+ 3* ITTF 3шт).
 */
export const getMediaMap = unstable_cache(loadAll, ["entity-media-map-v7"], {
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
