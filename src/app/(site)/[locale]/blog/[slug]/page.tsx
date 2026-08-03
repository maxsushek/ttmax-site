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

  // og/twitter/JSON-LD зображення: спершу Cloudinary-hero (точні 1200×630), інакше —
  // фірмова обкладинка coverSrc (абсолютний URL). Без цього стаття з code-cover їхала
  // без og:image і картка «summary_large_image» деградувала в порожню.
  const image = post.heroPublicId
    ? cldUrl(post.heroPublicId, { w: 1200, h: 630, crop: "fill" }) || undefined
    : post.coverSrc
      ? `${siteConfig.url}${post.coverSrc}`
      : undefined;
  // Розміри лишаємо тільки для hero (рівно 1200×630). Обкладинки різного розміру —
  // og:image:width/height опускаємо (валідно; краще без розмірів, ніж із хибними).
  const imageDims = post.heroPublicId ? { imageWidth: 1200, imageHeight: 630 } : {};

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
