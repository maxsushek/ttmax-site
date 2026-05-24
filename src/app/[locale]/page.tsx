import { notFound } from "next/navigation";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { TrustBar } from "@/components/sections/TrustBar";
import { Categories } from "@/components/sections/Categories";
import { Products } from "@/components/sections/Products";
import { Brands } from "@/components/sections/Brands";
import { LeadCTA } from "@/components/sections/LeadCTA";
import { FAQ } from "@/components/sections/FAQ";
import { isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n";
import { faqJsonLd } from "@/lib/seo/jsonld";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const messages = getMessages(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(messages.faq.items)),
        }}
      />
      <Hero messages={messages} />
      <Marquee />
      <TrustBar messages={messages} />
      <Categories locale={locale} messages={messages} />
      <Products locale={locale} messages={messages} />
      <Brands locale={locale} messages={messages} />
      <LeadCTA locale={locale} messages={messages} />
      <FAQ messages={messages} />
    </>
  );
}
