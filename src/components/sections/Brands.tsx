import Link from "next/link";
import Image from "next/image";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { t } from "@/i18n";
import { getSettings } from "@/lib/settings/get";
import { brandsTitleOverride } from "@/lib/homepage/home";
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
import { getProductsBySeries, getProductsByCategory } from "@/data/catalog";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";

// Поверхні основ, що вважаємо «ALC / ZLC» для колекції дощок.
const ALC_ZLC = ["alc", "super-alc", "zlc", "super-zlc"];

type Collection = {
  id: string;
  name: string;
  emoji: string; // фолбек, якщо фото товара-репрезентанта ще не залите
  href: string; // веде САМЕ на цю частину товарів (серія-хаб або відфільтровані основи)
  imageSlug: string; // товар-репрезентант — його головне фото на плитці
  count: number; // к-сть товарів (рахуємо з каталогу, щоб збігалося зі сторінкою)
};

export async function Brands({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.brands;
  const [settings, media] = await Promise.all([getSettings(), getMediaMap()]);
  const title = brandsTitleOverride(settings, locale) || m.title;

  const boardsAlcZlc = getProductsByCategory("osnovaniya").filter((p) =>
    ALC_ZLC.includes(p.base?.surface ?? ""),
  ).length;

  const collections: Collection[] = [
    { id: "dignics", name: "Dignics", emoji: "💎", href: "/nakladki/dignics", imageSlug: "dignics-09c", count: getProductsBySeries("dignics").length },
    { id: "tenergy", name: "Tenergy", emoji: "🔥", href: "/nakladki/tenergy", imageSlug: "tenergy-05", count: getProductsBySeries("tenergy").length },
    { id: "zyre", name: "Zyre", emoji: "⚡", href: "/nakladki/zyre", imageSlug: "zyre-03", count: getProductsBySeries("zyre").length },
    { id: "glayzer", name: "Glayzer", emoji: "✴️", href: "/nakladki/glayzer", imageSlug: "glayzer-09c", count: getProductsBySeries("glayzer").length },
    { id: "boards", name: "Основи ALC / ZLC", emoji: "🎯", href: "/osnovaniya?surface=alc,super-alc,zlc,super-zlc", imageSlug: "viscaria", count: boardsAlcZlc },
    // ↓ 6-та плитка — припущення (ваше повідомлення обірвалось на «и»); замініть за потреби.
    { id: "rozena", name: "Rozena", emoji: "🌟", href: "/nakladki/rozena", imageSlug: "rozena", count: getProductsBySeries("rozena").length },
  ];

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
          {collections.map((c) => {
            const img = pickPrimary(media, "product", c.imageSlug);
            return (
              <li key={c.id}>
                <Link
                  href={`/${locale}${c.href}`}
                  className="group flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-raised px-3 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/15 hover:bg-bg-elevated"
                  data-cta="brand"
                  data-location={c.id}
                >
                  {img ? (
                    <span className="mb-2.5 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04]">
                      <Image
                        src={cldUrl(img.publicId, { w: 128, h: 128 })}
                        alt={c.name}
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
                      {c.emoji}
                    </span>
                  )}
                  <span className="mb-1 font-display text-[17px] font-extrabold uppercase tracking-[0.04em]">
                    {c.name}
                  </span>
                  <span className="font-body text-[11px] text-ink-muted transition-colors group-hover:text-accent">
                    {t(m.productsCount, { count: c.count })}
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
