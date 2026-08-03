import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { AuthorProfile } from "@/components/content/AuthorProfile";
import { allAuthors, authors } from "@/data/authors";

export function generateStaticParams() {
  return locales.flatMap((locale) => allAuthors.map((a) => ({ locale, slug: a.slug })));
}

function resolveAuthor(slug: string) {
  return (authors as Record<string, (typeof allAuthors)[number]>)[slug] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) return {};
  const author = resolveAuthor(slug);
  if (!author) return { robots: { index: false, follow: false } };
  const title = `${author.name[l]} — ${author.jobTitle[l]} | TTMAX`;
  return buildBlogMetadata({
    locale: l,
    pathname: `/author/${author.slug}`,
    title,
    description: author.description[l],
  });
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const author = resolveAuthor(slug);
  if (!author) notFound();
  return <AuthorProfile author={author} locale={locale} />;
}

export const dynamicParams = false;
