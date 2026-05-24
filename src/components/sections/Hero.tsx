import { Container } from "@/components/ui/Section";
import { HeroCTA } from "./HeroCTA";
import { heroStats } from "@/data/stats";
import { t } from "@/i18n";
import type { Messages } from "@/i18n/messages/types";
import { siteConfig } from "@/config/site";

export function Hero({ messages }: { messages: Messages }) {
  const m = messages.hero;

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-grid-pattern pt-16">
      {/* Floating glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[54%] top-[4%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(232,255,71,0.07),transparent_70%)] blur-[2px] animate-float"
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
                className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#E8FF47] animate-ping-dot"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                {m.badge}
              </span>
            </div>

            <h1 className="mb-7 font-display text-display-xl font-black uppercase tracking-tight text-balance">
              <span className="block text-white/55 text-[0.72em]">{m.title1}</span>
              <span className="block text-gradient-accent">{m.title2}</span>
            </h1>

            <p className="mb-9 max-w-[400px] font-body text-base leading-[1.75] text-ink-muted text-pretty">
              {t(m.subtitle, { brandsCount: heroStats.brandsTotal }).replace(
                t(m.brandsAccent, { brandsCount: heroStats.brandsTotal }),
                "",
              )}
              <span className="font-semibold text-accent">
                {t(m.brandsAccent, { brandsCount: heroStats.brandsTotal })}
              </span>
              .
            </p>

            <HeroCTA messages={messages} />

            <dl className="mt-12 flex flex-wrap gap-x-11 gap-y-6">
              {[
                { n: heroStats.productsTotal, suffix: "+", l: m.stats.products },
                { n: heroStats.brandsTotal, suffix: "+", l: m.stats.brands },
                { n: heroStats.yearsExperience, suffix: "", l: m.stats.experience },
              ].map((stat) => (
                <div key={stat.l}>
                  <dt className="sr-only">{stat.l}</dt>
                  <dd className="font-display text-[34px] font-black leading-none tracking-tight text-accent">
                    {stat.n}
                    {stat.suffix}
                  </dd>
                  <dd className="mt-1 font-body text-[10px] uppercase tracking-[0.12em] text-ink-ghost">
                    {stat.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            aria-hidden
            className="relative hidden h-[500px] items-center justify-center lg:flex"
          >
            <div className="absolute h-[170px] w-[170px] rounded-full border border-accent/15 animate-pulse-ring" />
            <div
              className="absolute h-[170px] w-[170px] rounded-full border border-accent/[0.08] animate-pulse-ring"
              style={{ animationDelay: "1s" }}
            />
            <div className="absolute h-[330px] w-[330px] rounded-full border border-dashed border-accent/[0.09] animate-spin-slow" />
            <div className="absolute h-[250px] w-[250px] rounded-full border border-info/[0.08] animate-spin-slower" />
            <div className="relative z-10 text-center">
              <div className="text-[108px] leading-none drop-shadow-[0_0_44px_rgba(232,255,71,0.25)] animate-float">
                {siteConfig.emoji}
              </div>
              <div
                className="mt-4 inline-block rounded-full border border-accent/20 bg-accent/[0.07] px-6 py-2"
                style={{ backdropFilter: "blur(8px)" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                  BUTTERFLY · TENERGY 05
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
