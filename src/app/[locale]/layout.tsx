import type { ReactNode } from "react";
import { notFound } from "next/navigation";
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
import { COUNTER_KEYS, type AnalyticsIds } from "@/lib/analytics/ids";
import type { Metadata } from "next";

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(locale)) }}
      />
      <AnalyticsProvider ids={analyticsIds} />
      <CartProvider>
        <Header locale={locale} messages={messages} logoUrl={logoUrl} />
        <main id="main" className="pt-16">
          {children}
        </main>
        <Footer locale={locale} messages={messages} logoUrl={logoUrl} />
        <CartDrawer messages={messages} locale={locale} logoUrl={logoUrl} />
      </CartProvider>
    </>
  );
}
