import Link from "next/link";
import Image from "next/image";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { categories } from "@/data/categories";
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import type { HomeOverrides } from "@/lib/homepage/home";

// showcase-категории (ключи bases/rubbers/apparel/balls) → реальные slug каталога.
const CATEGORY_SLUG: Record<string, string> = {
  bases: "osnovaniya",
  rubbers: "nakladki",
  apparel: "odyag",
  balls: "myachi",
};

export async function Categories({
  locale,
  messages,
  overrides,
}: {
  locale: Locale;
  messages: Messages;
  overrides: HomeOverrides;
}) {
  const m = messages.categories;
  const media = await getMediaMap();
  return (
    <Section id="categories" ariaLabelledBy="categories-title">
      <Container>
        <div className="mb-11 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionKicker>{overrides.catKicker || m.kicker}</SectionKicker>
            <SectionTitle id="categories-title">
              <span className="text-white/60">{overrides.catTitleMuted || m.titleMuted}</span>{" "}
              <span className="text-gradient-accent">{overrides.catTitleAccent || m.titleAccent}</span>
            </SectionTitle>
          </div>
          <Link
            href={`/${locale}/butterfly`}
            className="nav-link font-display text-[13px] font-bold uppercase tracking-[0.1em] text-accent"
          >
            {m.seeAll} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {categories.map((c) => {
            const itemTexts = m.items[c.key];
            const slug = CATEGORY_SLUG[c.key] ?? c.key;
            const img = pickPrimary(media, "category", slug);
            return (
              <li key={c.key} className="h-full">
                <Link
                  href={`/${locale}/${slug}`}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-bg-elevated hover:shadow-card-hover sm:p-6"
                  data-cta="category"
                  data-location={c.key}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-[400ms] group-hover:scale-x-100"
                    style={{ backgroundColor: c.accentColor }}
                  />
                  {/* Фото категории (Cloudinary) либо плейсхолдер, если ещё не загружено. */}
                  {img ? (
                    <span className="mb-4 block h-14 w-14 overflow-hidden rounded-xl border border-white/10 transition-all duration-[400ms] group-hover:scale-110 group-hover:border-white/25">
                      <Image
                        src={cldUrl(img.publicId, { w: 112, h: 112 })}
                        alt={img.alt ?? itemTexts.label}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="mb-4 block h-14 w-14 rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-[400ms] group-hover:scale-110 group-hover:border-white/25"
                    />
                  )}
                  <span className="mt-1 font-display text-[22px] font-extrabold uppercase tracking-tight">
                    {itemTexts.label}
                  </span>
                  <span className="mt-1 flex-1 font-body text-[13px] text-ink-muted">
                    {itemTexts.desc}
                  </span>
                  <span
                    className="mt-5 text-xs font-bold uppercase tracking-[0.1em]"
                    style={{ color: c.accentColor }}
                  >
                    {m.cta}{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1.5">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
