import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { buildCatalogMetadata } from "@/lib/seo/catalog-metadata";
import { LegalArticle } from "@/components/content/LegalArticle";
import { infoDocs } from "@/data/info";

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
  const doc = infoDocs.payment;
  return buildCatalogMetadata({
    locale: l,
    pathname: "/payment",
    title: doc.metaTitle[l],
    description: doc.metaDescription[l],
  });
}

export default async function PaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  return <LegalArticle doc={infoDocs.payment} locale={locale} />;
}
