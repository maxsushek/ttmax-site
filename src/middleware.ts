import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { locales } from "@/i18n/config";
import { siteConfig } from "@/config/site";

const DEFAULT_LOCALE = locales[0]; // 'ua'

/**
 * Канонічний хост — той, що заданий у NEXT_PUBLIC_SITE_URL (через siteConfig.url).
 * Порожній рядок, якщо URL некоректний, — тоді канонізація просто не вмикається.
 */
const CANONICAL_HOST = (() => {
  try {
    return new URL(siteConfig.url).host;
  } catch {
    return "";
  }
})();

/**
 * Чи маємо примусово зводити трафік на канонічний хост.
 *
 * ⚠️ НАВІЩО: після підключення ttmax.com.ua прод-аліас ttmax-site-z2za.vercel.app
 * НЕ зникає — він і далі віддає ПОВНУ копію сайту (682 URL). Для Google це два
 * однакові сайти: він обирає канонічний сам, і не факт що правильно, а вага ділиться.
 * Тому 308 з будь-якого іншого хоста на канонічний.
 *
 * ⚠️ ТРИ ЗАПОБІЖНИКИ, без яких це б зламало роботу:
 *  1) Лише VERCEL_ENV === "production". Прев'ю-деплої (*-git-*.vercel.app) мають лишатись
 *     доступними — саме на них перевіряють зміни ПЕРЕД флипом noindex.
 *  2) Лише якщо канонічний хост уже НЕ vercel.app. Доки домену немає, редирект
 *     зациклився б сам на себе.
 *  3) Локальна розробка (VERCEL_ENV undefined) не зачіпається взагалі.
 */
const ENFORCE_CANONICAL_HOST =
  process.env.VERCEL_ENV === "production" &&
  CANONICAL_HOST !== "" &&
  !CANONICAL_HOST.endsWith(".vercel.app");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Канонічний хост (має бути ПЕРШИМ, до будь-якої іншої логіки) =====
  if (ENFORCE_CANONICAL_HOST) {
    const host = request.headers.get("host");
    if (host && host !== CANONICAL_HOST) {
      const url = request.nextUrl.clone();
      url.host = CANONICAL_HOST;
      url.port = "";
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  // ===== /admin/* — авторизация =====
  if (pathname.startsWith("/admin")) {
    const { response, user, isAdmin } = await updateSession(request);
    const isLoginPage = pathname === "/admin/login";

    // 1. Не залогинен на защищённой странице → редирект на /admin/login
    if (!user && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // 2. Залогинен, но НЕ admin → выкидываем с ошибкой
    if (user && !isAdmin && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_admin");
      return NextResponse.redirect(url);
    }

    // 3. Admin уже залогинен и открыл /admin/login → отправляем в leads
    if (user && isAdmin && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/leads";
      return NextResponse.redirect(url);
    }

    return response;
  }
  /**
   * Верхній регістр у шляху → 308 на канонічний нижній.
   *
   * Усі наші slug — нижнім регістром, тож /ua/Nakladki це та сама сторінка, записана інакше.
   * Досі такий URL просто рендерився як 404. Дві причини завернути його:
   *
   * 1. Дублікати для пошуковиків: зовнішній сайт цілком може послатись із «красивою» великою
   *    літерою, і замість ваги на канонічну сторінку ми отримували 404.
   * 2. ⚠️ Практичніша: після переходу на SSG `next start` пише ISR-кеш у ФАЙЛИ під
   *    .next/server/app. На macOS файлова система нечутлива до регістру, тому запит
   *    /ua/Myachi створював запис у тому самому myachi.html — і ЗАТИРАВ закешовану живу
   *    сторінку 404-кою. Відтворено: /ua/myachi віддавав 200, після одного /ua/Myachi
   *    почав віддавати 404, файл схуд з 283 КБ до 162 КБ. На Vercel (Linux + не файловий
   *    кеш) не відтворюється, але будь-яка локальна перевірка збірки на Mac псувалась тихо.
   */
  const lower = pathname.toLowerCase();
  if (lower !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = lower;
    return NextResponse.redirect(url, 308);
  }

  // Старая локаль /uk/* -> /ua/* (постоянный редирект)
  if (pathname === "/uk" || pathname.startsWith("/uk/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/ua" + pathname.slice(3);
    return NextResponse.redirect(url, 308);
  }


  // ===== Локали для публичного сайта =====
  const hasLocale = locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );

  /**
   * Адреса без локалі → до мови за замовчуванням. Саме 308, а НЕ типовий 307.
   *
   * NextResponse.redirect за замовчуванням віддає 307 «тимчасово». Для Google це означає,
   * що адреса лишається окремою сутністю і вага посилань на неї НЕ переноситься на ціль.
   * А посилання на голий домен будуть завжди: візитка, реклама, каталоги, підпис у
   * месенджері — люди пишуть ttmax.com.ua, а не ttmax.com.ua/ua.
   *
   * Наше правило детерміноване: завжди на DEFAULT_LOCALE, без розбору Accept-Language.
   * Тобто це постійний редирект, і чесний код для нього — 308.
   *
   * ⚠️ Наслідок, про який треба знати: браузери кешують постійні редиректи надовго.
   * Якщо колись захочеться віддавати вміст прямо на корені або визначати мову
   * автоматично — у тих, хто вже отримав 308, це не спрацює до скидання кеша.
   * Свідомий розмін: зараз важливіше не втрачати вагу зовнішніх посилань.
   */
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 308);
  }

  // ⚠️ ТУТ БІЛЬШЕ НІЧОГО НЕ РОБИМО — і заголовок x-locale повертати не треба.
  //
  // Раніше middleware ставив x-locale, а кореневий app/layout.tsx читав його через
  // await headers(), щоб зібрати <html lang>. Це коштувало дорого: одне звернення до
  // headers() переводило ВСЕ дерево в динамічний рендер — у білді виходило 0 файлів .html
  // попри generateStaticParams() і revalidate, а на живому кожна сторінка рендерилась
  // на кожен запит із cache-control: private, no-cache, no-store.
  //
  // Тепер локаль береться з params маршруту в app/(site)/[locale]/layout.tsx, заголовок
  // не потрібен нікому (git grep x-locale → лише цей коментар), а сторінки статичні.
  // Повернути set("x-locale") = повернути динамічний рендер усього сайту.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Игнорируем: _next/*, api/*, файлы с расширением (.ico, .png, .txt и т.д.)
    "/((?!_next/|api/|.*\\..*).*)",
  ],
};
