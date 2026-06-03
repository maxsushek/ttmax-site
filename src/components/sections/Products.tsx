import Link from "next/link";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { getProductBySlug, getMinPrice, getBrandBySlug, catalogCategories } from "@/data/catalog";
import { getOverrides, applyOverrides } from "@/lib/catalog/overrides";
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
import { getSettings } from "@/lib/settings/get";
import { resolveHitSlugs } from "@/lib/homepage/home";
import { formatPrice } from "@/utils/format";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";

const ACCENTS = ["#E8FF47", "#FF6B81", "#2ED573", "#54A0FF", "#FFA502", "#C77DFF"];

type HitVM = {
  slug: string;
  href: string;
  brand: string;
  category: string;
  model: string;
  price: number | undefined;
  image: string | null;
  accent: string;
};

export async function Products({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.products;
  const [settings, overrides, media] = await Promise.all([
    getSettings(),
    getOverrides(),
    getMediaMap(),
  ]);

  const hits: HitVM[] = resolveHitSlugs(settings)
    .map((slug, i) => {
      const base = getProductBySlug(slug);
      if (!base) return null;
      const p = applyOverrides(base, overrides);
      const cat = catalogCategories.find((c) => c.slug === p.categorySlug);
      const img = pickPrimary(media, "product", p.slug);
      return {
        slug: p.slug,
        href: `/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`,
        brand: getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug,
        category: cat?.name[locale] ?? "",
        model: p.model,
        price: getMinPrice(p),
        image: img ? cldUrl(img.publicId, { w: 320, h: 320, crop: "fit" }) : null,
        accent: ACCENTS[i % ACCENTS.length] as string,
      } satisfies HitVM;
    })
    .filter((x): x is HitVM => x !== null);

  if (hits.length === 0) return null;

  return (
    <Section id="products" className="pt-0 lg:pt-0" ariaLabelledBy="products-title">
      <Container>
        <div className="mb-11 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionKicker>{m.kicker}</SectionKicker>
            <SectionTitle id="products-title">
              <span className="text-white/60">{m.titleMuted} </span>
              <span className="text-gradient-accent">{m.titleAccent}</span>
            </SectionTitle>
          </div>
          <Link
            href={`/${locale}/butterfly`}
            className="nav-link font-display text-[13px] font-bold uppercase tracking-[0.1em] text-accent"
          >
            {m.seeAll} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {hits.map((p) => (
            <li key={p.slug} className="h-full">
              <Link
                href={p.href}
                data-cta="hit"
                data-location={p.slug}
                className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                style={{ ["--product-accent" as string]: p.accent }}
              >
                <div
                  aria-hidden
                  className="h-0.5"
                  style={{ background: `linear-gradient(90deg,${p.accent},transparent)` }}
                />
                <div className="relative flex h-[140px] items-center justify-center border-b border-white/[0.08] bg-white/[0.02] py-6">
                  <span
                    className="absolute right-3 top-3 rounded-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-bg-base"
                    style={{ backgroundColor: p.accent }}
                  >
                    {m.badges.hit}
                  </span>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={`${p.brand} ${p.model}`}
                      className="max-h-[120px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.08]"
                    />
                  ) : (
                    <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-ghost">
                      {p.brand}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-ghost">
                    {p.brand}
                    {p.category ? ` · ${p.category}` : ""}
                  </div>
                  <div className="font-display text-[17px] font-extrabold leading-tight tracking-tight">
                    {p.model}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="font-display text-xl font-black text-accent">
                      {typeof p.price === "number"
                        ? formatPrice(p.price)
                        : locale === "ru"
                          ? "Цена по запросу"
                          : "Ціна за запитом"}
                    </span>
                    <span className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted transition-colors group-hover:text-accent">
                      {m.seeAll} →
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
