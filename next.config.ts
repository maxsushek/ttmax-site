import type { NextConfig } from "next";

/**
 * Content-Security-Policy — поки що в режимі REPORT-ONLY.
 *
 * ⚠️ Свідомо Report-Only, а не enforce: цей заголовок нічого НЕ блокує, лише повідомляє
 * браузеру, що вважати порушенням. Увімкнути enforce можна тільки після того, як переконаємось,
 * що жоден легітимний скрипт не потрапляє під заборону — інакше можна тихо вимкнути аналітику,
 * картинки Cloudinary або зламати адмінку на живому сайті.
 *
 * Чому CSP взагалі потрібен: на сторінці /checkout є поля картки, а аналітика (GTM/GA/Pixel)
 * виконується inline. Без CSP будь-який сторонній чи підмінений скрипт може прочитати ці поля
 * з DOM і відправити куди завгодно — класичний веб-скімінг, який не потребує доступу до сервера.
 *
 * 'unsafe-inline' у script-src поки лишається: інлайн-снипети GTM/GA/Pixel і Next.js-хайдрація
 * без nonce не запрацюють. Наступний крок (окремою задачею) — nonce з middleware і зняття
 * 'unsafe-inline'; лише після цього enforce матиме повну силу.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://api.cloudinary.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://www.googletagmanager.com",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Report-Only: нічого не блокує. Див. коментар до CSP_REPORT_ONLY вище.
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
};

export default nextConfig;
