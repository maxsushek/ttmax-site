import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // До офіційного запуску повністю закриваємо сайт від пошукових систем.
  if (!siteConfig.launched) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${siteConfig.url}/sitemap.xml`,
      host: siteConfig.url,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // ⚠️ НЕ додавати сюди "/_next/": цим шляхом ідуть УСІ фото товарів
        // (/_next/image?url=…cloudinary…) і весь CSS/JS. Заблокувати його = Googlebot
        // не завантажить жодне зображення й не зможе відрендерити сторінку
        // («Page resources couldn't be loaded» в URL Inspection).
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
