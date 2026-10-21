// src/lib/reviews/purchase.ts
// «Покупець»: чи купувала людина цей товар (або взагалі в магазині) — за телефоном
// або за номером замовлення з персонального посилання.
//
// ⚠️ Телефон у orders записаний так, як його ввели (0671234567 / +380671234567 / 380…),
// тому порівнюємо за останніми 9 цифрами — код оператора + номер.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { slugFromProductId } from "@/lib/catalog/product-url";
import { variantOf } from "@/data/catalog/variants";

type Sb = SupabaseClient<Database>;

/** 380XXXXXXXXX або null, якщо це не схоже на український мобільний. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  const nine = d.length === 12 && d.startsWith("380") ? d.slice(3) : d.length === 10 && d.startsWith("0") ? d.slice(1) : d.length === 9 ? d : null;
  return nine && /^(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/.test(nine) ? `380${nine}` : null;
}

const mainSlug = (slug: string) => variantOf(slug)?.main ?? slug;

export type OrderInfo = {
  orderNumber: string;
  locale: "uk" | "ru";
  createdAt: string;
  /** Основні slug-и моделей у замовленні (без дублів). */
  slugs: string[];
};

const DEAD = ["cancelled", "refunded"];

type OrderWithItems = {
  order_number: string;
  locale: "uk" | "ru";
  created_at: string;
  status: string;
  order_items: { product_id: string }[] | null;
};

const toInfo = (o: OrderWithItems): OrderInfo => ({
  orderNumber: o.order_number,
  locale: o.locale,
  createdAt: o.created_at,
  slugs: Array.from(new Set((o.order_items ?? []).map((i) => mainSlug(slugFromProductId(i.product_id))).filter(Boolean))),
});

/** Замовлення за номером (для персонального посилання). */
export async function findOrder(sb: Sb, orderNumber: string): Promise<OrderInfo | null> {
  const { data, error } = await sb
    .from("orders")
    .select("order_number, locale, created_at, status, order_items(product_id)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error || !data) return null;
  const o = data as unknown as OrderWithItems;
  return DEAD.includes(o.status) ? null : toInfo(o);
}

/**
 * Найсвіжіше замовлення з цим телефоном, у якому є товар (або будь-яке — для відгуку про
 * магазин). null — збігу немає.
 */
export async function findPurchase(sb: Sb, phone: string, slug: string | null): Promise<OrderInfo | null> {
  const nine = phone.slice(-9);
  const { data, error } = await sb
    .from("orders")
    .select("order_number, locale, created_at, status, order_items(product_id)")
    .ilike("customer_phone", `%${nine}`)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return null;
  const want = slug ? mainSlug(slug) : null;
  for (const raw of data as unknown as OrderWithItems[]) {
    if (DEAD.includes(raw.status)) continue;
    const info = toInfo(raw);
    if (!want || info.slugs.includes(want)) return info;
  }
  return null;
}
