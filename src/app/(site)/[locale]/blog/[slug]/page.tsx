import { blogOgImage } from "@/lib/seo/blog-og";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
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

  // og/twitter зображення: hero з Cloudinary, растрова копія SVG-обкладинки або растрова
  // обкладинка — правило в lib/seo/blog-og.ts (спільне з розміткою й sitemap).
  const og = blogOgImage(post, l);
  const image = og?.url;
  const imageDims = og?.width && og?.height ? { imageWidth: og.width, imageHeight: og.height } : {};

  return buildBlogMetadata({
    locale: l,
    pathname: `/blog/${post.slug}`,
    title: post.metaTitle[l],
    description: post.metaDescription[l],
    image,
    ...imageDims,
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
