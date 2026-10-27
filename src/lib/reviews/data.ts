// src/lib/reviews/data.ts
// Читання СХВАЛЕНИХ відгуків для сторінок сайту + підсумки (середня, розподіл).
//
// ⚠️ Кеш на ТОВАР, а не один на всіх. Сторінки живуть без таймера (revalidate:false),
// і схвалення відгуку скидає тег. Якби всі картки читали один спільний кеш, кожне
// схвалення перебудовувало б ~1600 сторінок (ліміт ISR-записів Vercel) — тепер лише
// сторінку цього товару, /vidguky і нічого більше.
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { noClient, queryFailed } from "@/lib/supabase/load-failure";
import { buildMemo } from "@/lib/supabase/build-memo";
import { variantOf } from "@/data/catalog/variants";

export const productReviewsTag = (slug: string) => `reviews:p:${slug}`;
export const STORE_REVIEWS_TAG = "reviews:store";
export const LATEST_REVIEWS_TAG = "reviews:latest";

/** Те, що можна показати публічно. Телефону, IP, замовлення тут немає й бути не може. */
export type PublicReview = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  lang: "uk" | "ru";
  rating: number;
  name: string;
  city: string | null;
  body: string;
  verified: boolean;
  reply: string | null;
  productSlug: string | null;
};

export type ReviewSummary = {
  count: number;
  /** Середня з одним знаком після коми (4.8). 0, якщо відгуків немає. */
  avg: number;
  /** Кількість оцінок 5,4,3,2,1 — саме в такому порядку. */
  dist: [number, number, number, number, number];
};

const PUBLIC_COLUMNS =
  "id, created_at, locale, rating, author_name, author_city, body, verified, reply_body, product_slug";

type Row = {
  id: string;
  created_at: string;
  locale: "uk" | "ru";
  rating: number;
  author_name: string;
  author_city: string | null;
  body: string;
  verified: boolean;
  reply_body: string | null;
  product_slug: string | null;
};

const toPublic = (r: Row): PublicReview => ({
  id: r.id,
  date: r.created_at.slice(0, 10),
  lang: r.locale,
  rating: r.rating,
  name: r.author_name,
  city: r.author_city,
  body: r.body,
  verified: r.verified,
  reply: r.reply_body,
  productSlug: r.product_slug,
});

/**
 * Slug, під яким зберігаються відгуки моделі: колірні й обʼємні дублі (variants.ts)
 * мають одну основну картку — і відгуки в них спільні, як і опис.
 */
export const reviewSlugFor = (slug: string): string => variantOf(slug)?.main ?? slug;

async function loadProduct(slug: string): Promise<PublicReview[]> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return noClient("reviews", []);
  const { data, error } = await sb
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("kind", "product")
    .eq("product_slug", slug)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) queryFailed("reviews", error.message);
  return ((data ?? []) as Row[]).map(toPublic);
}

/** Усі схвалені відгуки про товари — один запит (для збірки, де сторінок ~1600). */
async function loadAllProduct(): Promise<Map<string, PublicReview[]>> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return noClient("reviews", new Map());
  const { data, error } = await sb
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("kind", "product")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) queryFailed("reviews", error.message);
  const map = new Map<string, PublicReview[]>();
  for (const r of (data ?? []) as Row[]) {
    if (!r.product_slug) continue;
    const list = map.get(r.product_slug) ?? [];
    list.push(toPublic(r));
    map.set(r.product_slug, list);
  }
  return map;
}

/** Схвалені відгуки моделі (нові першими). */
export function getProductReviews(slug: string): Promise<PublicReview[]> {
  const key = reviewSlugFor(slug);
  // ⚠️ unstable_cache — на кожній картці: так вона отримує тег reviews:p:<slug>, і схвалення
  // відгуку її перебудовує. Всередині під час збірки — одна вибірка всіх відгуків на процес
  // (lib/supabase/build-memo.ts) замість запиту на кожну картку; у рантаймі — запит на модель.
  const load = () =>
    process.env.NEXT_PHASE === "phase-production-build"
      ? buildMemo("reviews-all", loadAllProduct).then((m) => m.get(key) ?? [])
      : loadProduct(key);
  return unstable_cache(load, ["reviews-product-v1", key], {
    tags: [productReviewsTag(key)],
    revalidate: false,
  })();
}

async function loadStore(): Promise<PublicReview[]> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return noClient("reviews", []);
  const { data, error } = await sb
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("kind", "store")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) queryFailed("reviews", error.message);
  return ((data ?? []) as Row[]).map(toPublic);
}

export const getStoreReviews = unstable_cache(loadStore, ["reviews-store-v1"], {
  tags: [STORE_REVIEWS_TAG],
  revalidate: false,
});

async function loadLatest(): Promise<PublicReview[]> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return noClient("reviews", []);
  const { data, error } = await sb
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("kind", "product")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) queryFailed("reviews", error.message);
  return ((data ?? []) as Row[]).map(toPublic);
}

/** Останні відгуки про товари — для /vidguky. */
export const getLatestProductReviews = unstable_cache(loadLatest, ["reviews-latest-v1"], {
  tags: [LATEST_REVIEWS_TAG],
  revalidate: false,
});

/** Середня й кількість відгуків по моделі — для зірок у картках каталогу. Ключ — reviewSlugFor. */
export type RatingsMap = Record<string, { avg: number; count: number }>;

async function loadRatings(): Promise<RatingsMap> {
  // Під час збірки — та сама вибірка всіх відгуків, що вже є для карток товарів (buildMemo):
  // зірки в лістингах не додають жодного запиту до Supabase.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    const all = await buildMemo("reviews-all", loadAllProduct);
    return Object.fromEntries(
      [...all].map(([slug, list]) => {
        const s = summarize(list);
        return [slug, { avg: s.avg, count: s.count }];
      }),
    );
  }
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return noClient("reviews", {});
  const { data, error } = await sb
    .from("reviews")
    .select("product_slug, rating")
    .eq("status", "approved")
    .eq("kind", "product")
    .limit(5000);
  if (error) queryFailed("reviews", error.message);
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of (data ?? []) as { product_slug: string | null; rating: number }[]) {
    if (!r.product_slug) continue;
    const a = (acc[r.product_slug] ??= { sum: 0, count: 0 });
    a.sum += r.rating;
    a.count += 1;
  }
  return Object.fromEntries(
    Object.entries(acc).map(([slug, a]) => [slug, { avg: Math.round((a.sum / a.count) * 10) / 10, count: a.count }]),
  );
}

/**
 * Рейтинги всіх моделей для карток каталогу (лістинги, «Схожі товари»).
 *
 * ⚠️ НАВІЩО без тегу, який скидає модерація: картки є на ~1600 сторінках (кожна картка
 * товару має блок «Схожі»). Якби схвалення відгуку скидало цей кеш, кожен відгук
 * перебудовував би весь сайт — рівно той інцидент з лімітом ISR-записів, через який
 * кеш відгуків розбито по товарах (див. шапку файлу). Тому зірки в картках оновлюються з
 * наступним деплоєм, а сама сторінка товару і /vidguky — одразу, як і раніше.
 *
 * ⚠️ ID деплою в ключі обовʼязковий: Data Cache на Vercel переживає деплої, і без нього
 * кеш без тегу лишився б зі старими цифрами назавжди. Новий деплой → новий ключ → свіжі дані.
 */
export function getRatingsMap(): Promise<RatingsMap> {
  const deployKey = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
  return unstable_cache(loadRatings, ["reviews-ratings-v1", deployKey], { revalidate: false })();
}

export function summarize(reviews: PublicReview[]): ReviewSummary {
  const dist: ReviewSummary["dist"] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of reviews) {
    const i = 5 - Math.min(5, Math.max(1, Math.round(r.rating)));
    dist[i] = (dist[i] ?? 0) + 1;
    sum += r.rating;
  }
  const count = reviews.length;
  return { count, avg: count ? Math.round((sum / count) * 10) / 10 : 0, dist };
}
