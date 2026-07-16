import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { cldUrl } from "@/lib/cloudinary/url";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { BlogArticle } from "@/components/content/BlogArticle";
import { getPost, getAllPosts } from "@/data/blog";

export function generateStaticParams() {
  return locales.flatMap((locale) => getAllPosts().map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) return {};
  const post = getPost(slug);
  if (!post) return { robots: { index: false, follow: false } };

  const image = post.heroPublicId
    ? cldUrl(post.heroPublicId, { w: 1200, h: 630, crop: "fill" }) || undefined
    : undefined;

  return buildBlogMetadata({
    locale: l,
    pathname: `/blog/${post.slug}`,
    title: post.metaTitle[l],
    description: post.metaDescription[l],
    image,
    article: {
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authorUrl: `${siteConfig.url}/${l}/author/${post.author}`,
    },
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const post = getPost(slug);
  if (!post) notFound();
  return <BlogArticle post={post} locale={locale} />;
}
