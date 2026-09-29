// src/lib/seo/blog-og.ts
// Картинка статті для соцмереж і розмітки — ОДНЕ правило для og:image, BlogPosting.image
// і sitemap, щоб вони не розходились.
//
// ⚠️ SVG-обкладинку в og:image віддавати НЕ МОЖНА: Telegram, Facebook, Viber, WhatsApp і
// LinkedIn SVG у превʼю не показують — посилання розліталось без картинки. Для таких
// статей є растрова копія 1200×630 із заголовком: public/blog/og/{slug}-{locale}.png,
// її робить scripts/gen-og-covers.mjs (генерувати локально й комітити — див. коментар там).
import { siteConfig } from "@/config/site";
import { cldUrl } from "@/lib/cloudinary/url";
import type { BlogPost } from "@/data/blog";
import type { Locale } from "@/i18n/config";

export type BlogOgImage = { url: string; width?: number; height?: number };

export function blogOgImage(post: BlogPost, locale: Locale): BlogOgImage | undefined {
  if (post.heroPublicId) {
    const url = cldUrl(post.heroPublicId, { w: 1200, h: 630, crop: "fill" });
    return url ? { url, width: 1200, height: 630 } : undefined;
  }
  if (!post.coverSrc) return undefined;
  if (post.coverSrc.endsWith(".svg")) {
    return { url: `${siteConfig.url}/blog/og/${post.slug}-${locale}.png`, width: 1200, height: 630 };
  }
  // Растрові обкладинки різного розміру — розміри опускаємо (краще без них, ніж із хибними).
  return { url: `${siteConfig.url}${post.coverSrc}` };
}
