import { Container, Section } from "@/components/ui/Section";
import { LeadForm } from "@/components/forms/LeadForm";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import type { HomeOverrides } from "@/lib/homepage/home";

export function LeadCTA({
  locale,
  messages,
  overrides,
}: {
  locale: Locale;
  messages: Messages;
  overrides: HomeOverrides;
}) {
  const m = messages.cta;
  return (
    <Section
      id="consultation"
      ariaLabelledBy="consultation-title"
      className="relative overflow-hidden bg-accent !py-16 lg:!py-20"
    >
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:44px_44px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[6%] -top-[25%] h-[400px] w-[400px] rounded-full bg-white/[0.14] animate-float"
      />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black/45">
              {overrides.ctaKicker || m.kicker}
            </div>
            <h2
              id="consultation-title"
              className="mb-5 font-display text-display-lg font-black uppercase leading-[0.88] tracking-tight text-bg-base text-balance"
            >
              {overrides.ctaTitle ? (
                overrides.ctaTitle
              ) : (
                <>
                  {m.title1}
                  <br />
                  {m.title2}
                </>
              )}
            </h2>
            <p className="max-w-[350px] font-body text-base leading-[1.78] text-black/55 text-pretty">
              {overrides.ctaSubtitle || m.subtitle}
            </p>
          </div>
          <div className="rounded-3xl bg-black/[0.07] p-7 sm:p-9">
            <LeadForm locale={locale} messages={messages} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
