import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { BlogList } from "@/components/content/BlogList";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META: Record<Locale, { title: string; description: string }> = {
  ua: {
    title: "Блог про настільний теніс — гайди та поради | TTMAX",
    description:
      "Правила, розміри столу, як обрати ракетку й накладку — практичні гайди від гравця-практика. Блог магазину TTMAX.",
  },
  ru: {
    title: "Блог о настольном теннисе — гайды и советы | TTMAX",
    description:
      "Правила, размеры стола, как выбрать ракетку и накладку — практические гайды от игрока-практика. Блог магазина TTMAX.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  const m = META[l];
  return buildBlogMetadata({ locale: l, pathname: "/blog", title: m.title, description: m.description });
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  return <BlogList locale={locale} />;
}
