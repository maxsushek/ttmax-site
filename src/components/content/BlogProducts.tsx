import Link from "next/link";
import { getProductBySlug, getMinPrice, isInStock } from "@/data/catalog";
import { getOverrides, applyOverrides } from "@/lib/catalog/overrides";
import { isRacket, resolveCombo } from "@/lib/catalog/racket";
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
import { formatPrice } from "@/utils/format";
import { promoOldPrice } from "@/data/catalog/promos";
import type { BlogPost } from "@/data/blog";
import type { Locale } from "@/i18n/config";

/**
 * Блок «Моделі зі статті»: фото, актуальна ціна й кнопка на картку товару.
 *
 * ⚠️ НАВІЩО (03.11.2026, PostHog): із 53 входів зі статей через Google лише 3 дійшли до
 * товару й жоден — до кошика; кліків зі статей у каталог — 3 за 12 днів. «Таблетки» без цін
 * не працюють. Медіанна прокрутка головної статті (versii-osnov-butterfly, RU) — 41%, тож блок
 * стоїть одразу після першого розділу (post.productsAfter), а не в кінці, куди доходить <25%.
 *
 * Ціни й наявність — той самий шар, що в каталозі (product_overrides через unstable_cache з
 * тегом): зміна ціни в адмінці скидає й статтю.
 */

const MAX_PRODUCTS = 6;

const T = {
  ua: {
    heading: "Моделі зі статті в магазині TTMAX",
    sub: "Актуальні ціни й наявність",
    from: "від",
    onRequest: "Ціна за запитом",
    inStock: "В наявності",
    buy: "Купити",
  },
  ru: {
    heading: "Модели из статьи в магазине TTMAX",
    sub: "Актуальные цены и наличие",
    from: "от",
    onRequest: "Цена по запросу",
    inStock: "В наличии",
    buy: "Купить",
  },
} satisfies Record<Locale, Record<string, string>>;

/** Шлях на картку товару: /<brand>/<category>/<slug> (рівно три сегменти). */
function cardSlug(href: string): string | null {
  const parts = href.split(/[?#]/)[0]!.split("/").filter(Boolean);
  if (parts.length !== 3) return null;
  const p = getProductBySlug(parts[2]!);
  return p && p.brandSlug === parts[0] && p.categorySlug === parts[1] ? p.slug : null;
}

/**
 * Товари для блоку: явний post.products або картки, на які стаття вже посилається
 * (rec → links розділів → relatedProducts), у порядку появи, без повторів.
 */
export function blogProductSlugs(post: BlogPost): string[] {
  if (post.products) return post.products.filter((s) => getProductBySlug(s)).slice(0, MAX_PRODUCTS);
  const hrefs = [
    ...post.sections.flatMap((s) => [...(s.rec ? [s.rec.href] : []), ...(s.links ?? []).map((l) => l.href)]),
    ...(post.relatedProducts ?? []).map((l) => l.href),
  ];
  const slugs = hrefs.map(cardSlug).filter((s): s is string => Boolean(s));
  return [...new Set(slugs)].slice(0, MAX_PRODUCTS);
}

export async function BlogProducts({
  owner,
  slugs,
  locale,
  heading,
}: {
  /** Slug статті або гравця — для data-атрибута (аналітика кліків). */
  owner: string;
  slugs: string[];
  locale: Locale;
  /** Свій заголовок блоку (сторінка гравця); інакше — «Моделі зі статті». */
  heading?: string;
}) {
  const t = { ...T[locale], ...(heading ? { heading } : {}) };
  // Без .catch(): збій БД не можна запам'ятати разом зі сторінкою (lib/supabase/load-failure.ts).
  const [overrides, media] = await Promise.all([getOverrides(), getMediaMap()]);

  const items = slugs.flatMap((slug) => {
    const base = getProductBySlug(slug);
    if (!base) return [];
    const p = applyOverrides(base, overrides);
    // Готова ракетка: ціна = сума компонентів зі знижкою (як на її картці), а не з варіантів.
    const combo = isRacket(p) ? resolveCombo(p, overrides) : null;
    const price = combo ? combo.promoPrice : getMinPrice(p);
    const img = pickPrimary(media, "product", p.slug);
    return [
      {
        slug: p.slug,
        href: `/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`,
        name: p.model,
        price,
        oldPrice: combo ? combo.oldPrice : promoOldPrice(p.slug, price),
        inStock: combo ? combo.parts.length > 0 && combo.parts.every(isInStock) : isInStock(p),
        // Кілька цін (варіанти) → «від»; одна → без «від».
        hasRange:
          !combo && new Set(p.variants.map((v) => v.price).filter((x) => typeof x === "number")).size > 1,
        image: img ? cldUrl(img.publicId, { w: 280, h: 280, crop: "fit" }) : null,
      },
    ];
  });
  if (items.length === 0) return null;

  return (
    <aside
      aria-label={t.heading}
      data-blog-products={owner}
      className="rounded-2xl border border-border-strong bg-bg-raised p-4 sm:p-5"
    >
      <p className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-ink">{t.heading}</p>
      <p className="mt-0.5 font-body text-[12px] text-ink-muted">{t.sub}</p>
      {/* На телефоні — горизонтальна стрічка (блок не розтягує статтю), з sm — сітка. */}
      <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
        {items.map((it) => (
          <li key={it.slug} className="w-[150px] shrink-0 snap-start sm:w-auto">
            <Link
              href={it.href}
              data-blog-link="product"
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-base transition-colors hover:border-accent/50"
            >
              <span className="flex h-[110px] items-center justify-center bg-white p-2">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.image}
                    alt={`Butterfly ${it.name}`}
                    width={140}
                    height={140}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="max-h-[96px] w-auto object-contain"
                  />
                ) : (
                  <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-ink-ghost">
                    Butterfly
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col p-3">
                <span className="font-display text-[14px] font-bold leading-tight text-ink">{it.name}</span>
                {it.inStock && (
                  <span className="mt-1 font-body text-[11px] font-bold text-success">{t.inStock}</span>
                )}
                <span className="mt-auto pt-2">
                  {it.oldPrice && (
                    <span className="block font-body text-[11px] text-ink-dim line-through tabular-nums">
                      {formatPrice(it.oldPrice)}
                    </span>
                  )}
                  <span className="block font-display text-[15px] font-black text-accent tabular-nums">
                    {typeof it.price === "number"
                      ? `${it.hasRange ? `${t.from} ` : ""}${formatPrice(it.price)}`
                      : t.onRequest}
                  </span>
                </span>
                <span className="mt-2 block rounded-lg bg-accent px-2 py-1.5 text-center font-display text-[12px] font-bold uppercase tracking-[0.08em] text-bg-base transition-opacity group-hover:opacity-90">
                  {t.buy}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
