import type { NextConfig } from "next";

/**
 * ЗАПОБІЖНИК ЗАПУСКУ: не даємо зібрати «відкритий для індексації» сайт на прев'ю-домені.
 *
 * ⚠️ НАВІЩО: у момент запуску треба зробити дві незалежні дії — підключити домен
 * (NEXT_PUBLIC_SITE_URL) і зняти noindex (NEXT_PUBLIC_SITE_LAUNCHED). Якщо переплутати
 * порядок і зняти noindex РАНІШЕ, ніж заданий домен, Google проіндексує 682 URL на
 * ttmax-site-z2za.vercel.app — домені зі списку публічних суфіксів. Далі це лікується
 * лише повною 301-міграцією всіх URL із просадкою. Помилка тиха: збірка зелена,
 * сайт працює, а наслідок видно через тижні.
 *
 * Тому — падаємо на збірці. Краще червоний деплой на хвилину, ніж міграція на місяці.
 */
function assertLaunchConfigSane(): void {
  if (process.env.NEXT_PUBLIC_SITE_LAUNCHED !== "true") return;
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let host = "";
  try {
    host = new URL(raw).host;
  } catch {
    /* нижче впаде на порожньому host */
  }
  if (!host || host.endsWith(".vercel.app")) {
    throw new Error(
      [
        "",
        "❌ ЗБІРКУ ЗУПИНЕНО: сайт відкрито для індексації на прев'ю-домені.",
        "",
        `   NEXT_PUBLIC_SITE_LAUNCHED = true`,
        `   NEXT_PUBLIC_SITE_URL      = ${raw || "(не задано)"}`,
        "",
        "   Спершу задайте справжній домен у NEXT_PUBLIC_SITE_URL (напр. https://ttmax.com.ua),",
        "   і лише ПОТІМ вмикайте NEXT_PUBLIC_SITE_LAUNCHED=true.",
        "   Інакше 682 URL підуть в індекс на *.vercel.app, і це виправляється",
        "   лише повною 301-міграцією.",
        "",
      ].join("\n"),
    );
  }
}

assertLaunchConfigSane();

/**
 * Content-Security-Policy — поки що в режимі REPORT-ONLY.
 *
 * ⚠️ Свідомо Report-Only, а не enforce: цей заголовок нічого НЕ блокує, лише повідомляє
 * браузеру, що вважати порушенням. Увімкнути enforce можна тільки після того, як переконаємось,
 * що жоден легітимний скрипт не потрапляє під заборону — інакше можна тихо вимкнути аналітику,
 * картинки Cloudinary або зламати адмінку на живому сайті.
 *
 * Чому CSP потрібен: аналітика (GTM/GA/Pixel) виконується inline, а на чекауті збираються
 * персональні дані — імʼя, телефон, адреса відділення. Без CSP будь-який сторонній чи
 * підмінений скрипт читає їх з DOM і відправляє куди завгодно, не маючи доступу до сервера.
 *
 * ⚠️ Полів картки на /checkout ЗАРАЗ НЕМА: онлайн-оплату вимкнено (config/payment.ts), бо вона
 * збирала картку й нікуди її не слала. Коли платіжний шлюз підключать і поля повернуться,
 * ризик веб-скімінгу стане на порядок серйознішим — саме тоді CSP треба переводити з
 * Report-Only в enforce, а не «колись потім».
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
  /**
   * Вбудовує CSS маршруту прямо в HTML замість окремого <link>.
   *
   * НАВІЩО: у розбивці LCP від PageSpeed видно, що сервер уже не проблема — TTFB 20 мс
   * після переїзду у Франкфурт. Уся затримка сиділа в «element render delay» — 2310 мс,
   * і елементом LCP був звичайний АБЗАЦ тексту героя. Тобто текст уже прийшов, але
   * браузеру не дозволено його намалювати, поки не завантажиться блокувальний CSS
   * (15,4 КБ, оцінка економії від Lighthouse — 1390 мс).
   *
   * ⚠️ Розмін свідомий: HTML кожної сторінки виросте приблизно на розмір CSS маршруту,
   * зате зникає цілий мережевий похід до першої відмальовки. На повільному 4G, під який
   * і міряє PageSpeed, це вигідно. Перевіряти замірами до/після, а не на віру.
   *
   * Прапорець ще experimental, але існує у нашій версії Next (15.5.22) — звірено з
   * config-shared.js, а не з документації.
   */
  experimental: {
    inlineCss: true,
  },
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
