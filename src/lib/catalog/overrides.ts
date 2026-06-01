// src/lib/catalog/overrides.ts
// Шар переопределення ціни/наявності поверх коду (таблиця product_overrides).
// getOverrides() — кешована карта key→{price,inStock} (інвалідується тегом при збереженні).
// applyOverrides() — чиста функція: повертає КОПІЮ товару з накладеними значеннями.
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogProduct } from "@/types/catalog";

export const PRODUCT_OVERRIDES_TAG = "product-overrides";

export type Override = { price?: number; inStock?: boolean };
export type OverridesMap = Record<string, Override>;

async function loadOverrides(): Promise<OverridesMap> {
  // service role: таблиця закрита RLS, читаємо лише на сервері
  const client = getSupabaseServerClient({ useServiceRole: true });
  if (!client) return {};
  const db = client as unknown as SupabaseClient;

  const { data, error } = await db.from("product_overrides").select("key, price, in_stock");
  if (error || !data) return {};

  const map: OverridesMap = {};
  for (const row of data as {
    key: string;
    price: number | string | null;
    in_stock: boolean | null;
  }[]) {
    map[row.key] = {
      price: row.price == null ? undefined : Number(row.price),
      inStock: typeof row.in_stock === "boolean" ? row.in_stock : undefined,
    };
  }
  return map;
}

/** Кешована карта переопределень. Безпечно викликати в серверних компонентах. */
export const getOverrides = unstable_cache(loadOverrides, ["product-overrides-map-v1"], {
  tags: [PRODUCT_OVERRIDES_TAG],
  revalidate: 3600,
});

/**
 * Повертає КОПІЮ товару з накладеними ціною/наявністю.
 * Пріоритет: варіант-рівень ("slug__товщина__колір") → товар-рівень ("slug") → код.
 */
export function applyOverrides(p: CatalogProduct, ov: OverridesMap): CatalogProduct {
  if (!ov || Object.keys(ov).length === 0) return p;

  const prod = ov[p.slug];

  const variants = p.variants.map((v) => {
    const variantKey = `${p.slug}__${v.thickness}__${v.color}`;
    const o = ov[variantKey] ?? prod;
    if (!o) return v;
    return {
      ...v,
      price: typeof o.price === "number" ? o.price : v.price,
      inStock: typeof o.inStock === "boolean" ? o.inStock : v.inStock,
    };
  });

  return {
    ...p,
    variants,
    priceFrom: prod && typeof prod.price === "number" ? prod.price : p.priceFrom,
    inStock: prod && typeof prod.inStock === "boolean" ? prod.inStock : p.inStock,
  };
}
