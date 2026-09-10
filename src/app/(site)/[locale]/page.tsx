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
import { getSettings } from "@/lib/settings/get";
import { resolveHomeOverrides } from "@/lib/homepage/home";
import { getContact } from "@/lib/contact/get";

// ISR: після завантаження фото в адмінці кеш вітрини інвалідується тегом і сторінка перезбирається.
// 600 → 3600 разом з каталогом: див. розгорнуте пояснення в [...segments]/page.tsx.
// Головна — лише 2 URL і на квоту майже не впливає, але тримаємо вікно однаковим,
// щоб вітрина й картки не розʼїжджались за свіжістю.
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const messages = getMessages(locale);
  // Текстові оверрайди з адмінки (Головна). Порожнэ значення → секція бере дефолт із i18n.
  const overrides = resolveHomeOverrides(await getSettings(), locale);

  // FAQ у i18n містить плейсхолдер {freeShippingThreshold} — його ніхто не розгортав,
  // тож токен їхав як є і у видимий текст, і у FAQPage-розмітку. Підставляємо реальний
  // поріг (з адмінки, фолбек — siteConfig) ОДИН раз і віддаємо в обидва місця.
  const contact = await getContact();
  const faqItems = messages.faq.items.map((it) => ({
    q: it.q,
    a: it.a.replace(/\{freeShippingThreshold\}/g, String(contact.freeShippingThreshold)),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(faqItems)),
        }}
      />
      <Hero messages={messages} overrides={overrides} />
      <Marquee />
      <TrustBar messages={messages} overrides={overrides} />
      <Categories locale={locale} messages={messages} overrides={overrides} />
      <Products locale={locale} messages={messages} overrides={overrides} />
      <Brands locale={locale} messages={messages} overrides={overrides} />
      <LeadCTA locale={locale} messages={messages} overrides={overrides} />
      <FAQ
        faq={{ kicker: messages.faq.kicker, title: messages.faq.title, items: faqItems }}
        overrides={overrides}
      />
    </>
  );
}
