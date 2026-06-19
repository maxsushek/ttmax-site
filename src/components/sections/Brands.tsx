import Link from "next/link";
import Image from "next/image";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { brands } from "@/data/brands";
import { t } from "@/i18n";
import { getSettings } from "@/lib/settings/get";
import { brandsTitleOverride } from "@/lib/homepage/home";
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";

// Коллекции Butterfly → хабы серий (где лежат приоритетные товары) вместо широких категорий.
const COLLECTION_HREF: Record<string, string> = {
  tenergy: "/nakladki/tenergy",
  dignics: "/nakladki/dignics",
  rozena: "/nakladki/rozena",
  viscaria: "/osnovaniya",
  hadraw: "/osnovaniya",
  wear: "/odyag",
};

// Репрезентативный товар коллекции: его главное фото — на плитке (нет фото → эмодзи b.flag).
const COLLECTION_IMAGE_SLUG: Record<string, string> = {
  tenergy: "tenergy-05",
  dignics: "dignics-09c",
  rozena: "rozena",
  viscaria: "viscaria",
  hadraw: "hadrawshield",
  wear: "futbolky-butterfly-meranji",
};

export async function Brands({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.brands;
  const [settings, media] = await Promise.all([getSettings(), getMediaMap()]);
  const title = brandsTitleOverride(settings, locale) || m.title;
  return (
    <Section
      className="border-t border-border-subtle bg-white/[0.007] !py-16 lg:!py-20"
      ariaLabelledBy="brands-title"
    >
      <Container>
        <div className="mb-11 text-center">
          <SectionKicker>{m.kicker}</SectionKicker>
          <SectionTitle id="brands-title">{title}</SectionTitle>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {brands.map((b) => {
            const imgSlug = COLLECTION_IMAGE_SLUG[b.id];
            const img = imgSlug ? pickPrimary(media, "product", imgSlug) : null;
            return (
              <li key={b.id}>
                <Link
                  href={`/${locale}${COLLECTION_HREF[b.id] ?? "/butterfly"}`}
                  className="group flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-raised px-3 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/15 hover:bg-bg-elevated"
                  data-cta="brand"
                  data-location={b.id}
                >
                  {img ? (
                    <span className="mb-2.5 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04]">
                      <Image
                        src={cldUrl(img.publicId, { w: 128, h: 128 })}
                        alt={b.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 object-contain transition-transform duration-[400ms] group-hover:scale-[1.12]"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="mb-2.5 text-[26px] transition-transform duration-[400ms] group-hover:rotate-[8deg] group-hover:scale-[1.28]"
                    >
                      {b.flag}
                    </span>
                  )}
                  <span className="mb-1 font-display text-[17px] font-extrabold uppercase tracking-[0.04em]">
                    {b.name}
                  </span>
                  <span className="font-body text-[11px] text-ink-muted transition-colors group-hover:text-accent">
                    {t(m.productsCount, { count: b.productsCount })}
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
