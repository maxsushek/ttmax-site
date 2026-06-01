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
        disallow: ["/api/", "/_next/", "/admin/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
