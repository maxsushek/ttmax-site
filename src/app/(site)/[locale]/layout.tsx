import type { ReactNode } from "react";
import { Tektur } from "next/font/google";
import { notFound } from "next/navigation";
import { localeToLang } from "@/i18n/config";
import "../../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { getMediaMap } from "@/lib/media/get";
import { getSiteAsset } from "@/lib/media/site-assets";
import { cldUrl } from "@/lib/cloudinary/url";
import { getSettings, settingString } from "@/lib/settings/get";
import { resolveContact } from "@/lib/contact/get";
import { COUNTER_KEYS, type AnalyticsIds } from "@/lib/analytics/ids";
import type { Metadata } from "next";

/**
 * ⚠️ ЦЕ КОРЕНЕВИЙ LAYOUT ГРУПИ (site) — саме тут <html> і <body>.
 *
 * Раніше вони жили в app/layout.tsx, який читав локаль із заголовка `x-locale`
 * через `await headers()`. Одне це звернення переводило ВСЕ дерево в динамічний рендер:
 * у білді виходило 0 файлів .html і 2 маршрути в prerender-manifest — попри
 * generateStaticParams() і revalidate = 600. Наслідок на живому: кожна сторінка
 * рендерилась на кожен запит, `cache-control: private, no-cache, no-store`,
 * `x-vercel-cache: MISS` завжди. Заміряна ціна — ~155 мс зайвих на кожному запиті
 * (HTML 305 мс проти 150 мс у файлу з CDN).
 *
 * Тепер локаль береться з params маршруту — заголовок не потрібен, дерево статичне.
 * Адмінка має власний кореневий layout у групі (admin), тому app/layout.tsx не потрібен
 * узагалі: Next дозволяє кілька кореневих layout, коли маршрути розведені по групах.
 *
 * ⚠️ Шрифт теж переїхав сюди: змінна --font-display ставиться класом на <html>,
 * а <html> тепер тут. Основний текст вебшрифта НЕ використовує — див. коментар
 * до fontFamily.body у tailwind.config.ts.
 */
const tektur = Tektur({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  const meta = buildMetadata(l);
  // Динамічний фавікон з адмінки (entity_media → category:site-favicon).
  // Якщо не завантажено — лишається статичний /favicon.svg із buildMetadata.
  try {
    const map = await getMediaMap();
    const fav = getSiteAsset(map, "favicon");
    const url = fav ? cldUrl(fav.publicId, { w: 64, h: 64, crop: "fit" }) : "";
    if (url) {
      meta.icons = { icon: [{ url }] };
    }
  } catch {
    // ignore — fallback to static favicon
  }
  return meta;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const messages = getMessages(locale);

  // Логотип з адмінки (entity_media → category:site-logo). Фолбэк — текстовий логотип у <Logo/>.
  const media = await getMediaMap();
  const logoAsset = getSiteAsset(media, "logo");
  const logoUrl = logoAsset ? cldUrl(logoAsset.publicId, { h: 72, crop: "fit" }) : undefined;

  // Лічильники: з site_settings, із фолбэком на env (NEXT_PUBLIC_*).
  const settings = await getSettings();
  const analyticsIds: AnalyticsIds = {
    gtm: settingString(settings, COUNTER_KEYS.gtm) || (process.env.NEXT_PUBLIC_GTM_ID ?? ""),
    ga: settingString(settings, COUNTER_KEYS.ga) || (process.env.NEXT_PUBLIC_GA_ID ?? ""),
    adsId:
      settingString(settings, COUNTER_KEYS.adsId) || (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? ""),
    adsLabel:
      settingString(settings, COUNTER_KEYS.adsLabel) ||
      (process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ?? ""),
    pixel:
      settingString(settings, COUNTER_KEYS.pixel) || (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ""),
  };

  // Контакти + доставка: те саме джерело (site_settings), із фолбэком на siteConfig.
  const contact = resolveContact(settings);

  return (
    <html
      lang={localeToLang[locale]}
      className={tektur.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-base text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(contact)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(locale)) }}
        />
        <AnalyticsProvider ids={analyticsIds} />
        <CartProvider
          freeShippingThreshold={contact.freeShippingThreshold}
          shippingFee={contact.shippingFee}
        >
          <Header locale={locale} messages={messages} logoUrl={logoUrl} />
          <main id="main" className="pt-16">
            {children}
          </main>
          <Footer locale={locale} messages={messages} logoUrl={logoUrl} contact={contact} />
          <CartDrawer messages={messages} locale={locale} logoUrl={logoUrl} />
        </CartProvider>
      </body>
    </html>
  );
}
