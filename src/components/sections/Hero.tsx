import { Container } from "@/components/ui/Section";
import { HeroCTA } from "./HeroCTA";
import { heroStats } from "@/data/stats";
import { t } from "@/i18n";
import { getMediaMap } from "@/lib/media/get";
import { getSiteAsset } from "@/lib/media/site-assets";
import { cldUrl } from "@/lib/cloudinary/url";
import type { HomeOverrides } from "@/lib/homepage/home";
import { DEFAULT_HERO_IMAGE_BADGE } from "@/lib/homepage/keys";
import type { Messages } from "@/i18n/messages/types";

export async function Hero({
  messages,
  overrides,
}: {
  messages: Messages;
  overrides: HomeOverrides;
}) {
  const m = messages.hero;
  const media = await getMediaMap();
  const titleOverride = overrides.heroTitle;
  const heroAsset = getSiteAsset(media, "hero");
  const heroUrl = heroAsset ? cldUrl(heroAsset.publicId, { w: 600, h: 600, crop: "fit" }) : "";

  return (
    <section className="bg-grid-pattern relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Floating glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[54%] top-[4%] h-[420px] w-[420px] animate-float rounded-full bg-[radial-gradient(circle,rgba(232,255,71,0.07),transparent_70%)] blur-[2px]"
      />
      {/* Diagonal accent line */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[30%] top-0 h-full w-px bg-[linear-gradient(to_bottom,transparent,rgba(232,255,71,0.12)_40%,transparent)] [transform:skewX(-18deg)]"
      />

      <Container className="relative z-10 py-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.04] px-4 py-1.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 animate-ping-dot rounded-full bg-accent shadow-[0_0_8px_#E8FF47]"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                {overrides.heroBadge || m.badge}
              </span>
            </div>

            <h1 className="mb-7 text-balance font-display text-display-xl font-black uppercase tracking-tight">
              {titleOverride ? (
                <span className="text-gradient-accent block py-[0.14em] -my-[0.14em]">{titleOverride}</span>
              ) : (
                <>
                  <span className="block text-[0.72em] text-white/55">{m.title1}</span>
                  <span className="text-gradient-accent block py-[0.14em] -my-[0.14em]">{m.title2}</span>
                </>
              )}
            </h1>

            <p className="mb-9 max-w-[400px] text-pretty font-body text-base leading-[1.75] text-ink-muted">
              {overrides.heroSubtitle ? (
                overrides.heroSubtitle
              ) : (() => {
                const full = t(m.subtitle, { brandsCount: heroStats.brandsTotal });
                const accent = t(m.brandsAccent, { brandsCount: heroStats.brandsTotal });
                const idx = full.indexOf(accent);
                if (idx === -1) return full;
                return (
                  <>
                    {full.slice(0, idx)}
                    <span className="font-semibold text-accent">{accent}</span>
                    {full.slice(idx + accent.length)}
                  </>
                );
              })()}
            </p>

            <HeroCTA messages={messages} />

            <dl className="mt-12 flex flex-wrap gap-x-11 gap-y-6">
              {[
                {
                  value: overrides.statValue1 || `${heroStats.productsTotal}+`,
                  label: overrides.statLabel1 || m.stats.products,
                },
                {
                  value: overrides.statValue2 || `${heroStats.brandsTotal}+`,
                  label: overrides.statLabel2 || m.stats.brands,
                },
                {
                  value: overrides.statValue3 || `${heroStats.yearsExperience}`,
                  label: overrides.statLabel3 || m.stats.experience,
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-[34px] font-black leading-none tracking-tight text-accent">
                    {stat.value}
                  </dd>
                  <dd className="mt-1 font-body text-[10px] uppercase tracking-[0.12em] text-ink-ghost">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            aria-hidden
            className="relative hidden h-[500px] items-center justify-center lg:flex"
          >
            <div className="absolute h-[170px] w-[170px] animate-pulse-ring rounded-full border border-accent/15" />
            <div
              className="absolute h-[170px] w-[170px] animate-pulse-ring rounded-full border border-accent/[0.08]"
              style={{ animationDelay: "1s" }}
            />
            <div className="absolute h-[330px] w-[330px] animate-spin-slow rounded-full border border-dashed border-accent/[0.09]" />
            <div className="absolute h-[250px] w-[250px] animate-spin-slower rounded-full border border-info/[0.08]" />
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Головне фото з адмінки (entity_media → category:site-hero). */}
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroUrl}
                  alt=""
                  className="h-[220px] w-[220px] animate-float rounded-3xl border border-accent/20 bg-white/[0.03] object-contain shadow-[0_0_44px_rgba(232,255,71,0.12)]"
                />
              ) : (
                <div className="h-[150px] w-[150px] animate-float rounded-3xl border border-accent/20 bg-white/[0.03] shadow-[0_0_44px_rgba(232,255,71,0.12)]" />
              )}
              <div
                className="mt-5 inline-block rounded-full border border-accent/20 bg-accent/[0.07] px-6 py-2"
                style={{ backdropFilter: "blur(8px)" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                  {overrides.heroImageBadge || DEFAULT_HERO_IMAGE_BADGE}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div
        aria-hidden
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 opacity-30 sm:flex"
      >
        <span className="text-[9px] uppercase tracking-[0.25em]">{m.scroll}</span>
        <div className="h-8 w-px rounded bg-[linear-gradient(to_bottom,#E8FF47,transparent)]" />
      </div>
    </section>
  );
}
