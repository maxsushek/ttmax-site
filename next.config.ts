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
  /**
   * ⚠️ ПОТОКОВІ МЕТАДАНІ ВИМКНЕНО — через квоту ISR Writes. Не прибирати.
   *
   * Vercel рахує ISR-запис лише тоді, коли перегенерована сторінка ВІДРІЗНЯЄТЬСЯ від
   * попередньої ("content hasn't changed → no ISR write units"). Наші сторінки при тих
   * самих даних відрізнялись — і кожна перегенерація була повним записом (~11 одиниць
   * по 8 КБ на картку). Звідси 202K при ліміті Hobby 200K.
   *
   * Що саме скаче — виміряно на проді (дві перегенерації /ua/nakladki і картки Omar Assar ZLC
   * в межах одного деплою, дані не мінялись): розмітка без <script> ідентична байт у байт,
   * а в RSC-потоці ті самі рядки з ІНШИМИ номерами й на інших місцях — переїжджають рядки
   * метаданих ({"metadata"…}, IconMark). Обидві версії — у ПОТОКОВОМУ режимі: метадані
   * резолвляться в Suspense паралельно з тілом, і хто першим, залежить від таймінгу
   * запитів до Supabase. React роздає номери рядкам у порядку резолву.
   *
   * Другий, окремий розкол — за User-Agent того запиту, що розбудив перегенерацію. Звичайний
   * Googlebot, Ahrefs, GPTBot, curl і браузери отримують потокові метадані, а YandexBot,
   * bingbot, Google-InspectionTool — блокуючі, тобто структурно іншу сторінку. Це показав
   * ЛОКАЛЬНИЙ стенд (on-demand ревалідація від різних UA: рівно дві версії за класом бота);
   * на проді окремо не ловили.
   *
   * /.*\/ = блокуючі метадані для всіх → зникає розкол на ДВІ структурно різні версії за
   * класом бота. Побічно: метадані завжди в <head>, що для SEO лише краще. Динамічні
   * сторінки (адмінка) чекають на метадані перед тілом — там це непомітно.
   *
   * ⚠️ ЦЕ НЕ РОБИТЬ ВИВІД БАЙТ-У-БАЙТ СТАБІЛЬНИМ. React нумерує рядки RSC-потоку в порядку,
   * в якому резолвляться паралельні async-компоненти (layout, page, MetadataResolver, секції
   * головної), а це залежить від таймінгу запитів до Supabase. Локальний стенд цього не
   * показує — без мережі все резолвиться миттєво. Тож на проді перегенерація й далі часто
   * дає нові байти; справжній важіль — КІЛЬКІСТЬ перегенерацій (див. revalidate у
   * [...segments]/page.tsx), а не цей прапорець.
   *
   * ⚠️ Ще два пробіли, які конфігом не закрити:
   *  • запит БЕЗ User-Agent усе одно отримує потокові метадані (app-page.js:
   *    `!userAgent ? true : …`). Підміна UA в middleware НЕ допомогла — перевірено стендом;
   *  • next build ЗАВЖДИ пререндерить із потоковими метаданими (export/worker.js,
   *    `serveStreamingMetadata: true` зашито), тож білд-версія структурно відрізняється від
   *    будь-якої рантайм-перегенерації.
   */
  htmlLimitedBots: /.*/,
  images: {
    /**
     * ⚠️ ОПТИМІЗАТОР VERCEL ВИМКНЕНО СВІДОМО. Не вмикати назад.
     *
     * Усі картинки сайту йдуть через Cloudinary з `f_auto,q_auto` — тобто вже
     * віддаються в AVIF/WebP і вже стиснуті. Прогін їх ЩЕ РАЗ через /_next/image —
     * подвійна обробка того самого файлу: якості не додає, а квоту Vercel їсть.
     *
     * Чим це закінчилось: квота вичерпалась, і оптимізатор почав віддавати
     * 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED. Причому непомітно — сторінки,
     * відкриті раніше, працювали з кешу, а будь-яка НЕ відкрита раніше показувала
     * биті картинки. Знайшлось на картках одягу лише тому, що їх ніхто не відкривав.
     *
     * unoptimized змушує next/image рендерити звичайний <img> з вихідним src:
     * розмітка й пропси (fill, sizes, className) лишаються, посередник зникає.
     */
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  /**
   * 301 зі знятих URL. Тримати список тут, а не «забути» — прибраний товар,
   * на який десь лишилось посилання, інакше віддає 404 і губить вагу.
   *
   * BG Case: спершу завели чотирма окремими товарами (по товару на колір), потім
   * звели в одну картку з вибором кольору. Три слаги встигли побувати на проді.
   */
  /**
   * /.well-known/ai.txt → маршрут app/well-known/ai.txt.
   * App Router ігнорує теки, що починаються з крапки, тож стандартний шлях віддаємо
   * переписом. Для клієнта й для ботів адреса лишається канонічною — /.well-known/ai.txt.
   */
  async rewrites() {
    return [{ source: "/.well-known/ai.txt", destination: "/well-known/ai.txt" }];
  },
  async redirects() {
    const gone = ["salatovyi", "blakytnyi", "fioletovyi"];
    return gone.flatMap((c) =>
      (["ua", "ru"] as const).map((l) => ({
        source: `/${l}/butterfly/chehly/chokhol-butterfly-bg-case-${c}`,
        destination: `/${l}/butterfly/chehly/chokhol-butterfly-bg-case`,
        permanent: true,
      })),
    );
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
