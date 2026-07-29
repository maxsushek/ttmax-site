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

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Кореневий layout будує <html lang> із заголовка x-locale (app/layout.tsx), але його
  // ніхто не ставив — тож фолбек давав lang="uk" НА ВСЬОМУ САЙТІ, включно з /ru.
  // Половина сайту оголошувала себе українською, суперечачи власному hreflang="ru".
  const locale = locales.find((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
  const headers = new Headers(request.headers);
  if (locale) headers.set("x-locale", locale);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Игнорируем: _next/*, api/*, файлы с расширением (.ico, .png, .txt и т.д.)
    "/((?!_next/|api/|.*\\..*).*)",
  ],
};
