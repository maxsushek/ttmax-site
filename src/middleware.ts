import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { locales } from "@/i18n/config";

const DEFAULT_LOCALE = locales[0]; // 'ua'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Игнорируем: _next/*, api/*, файлы с расширением (.ico, .png, .txt и т.д.)
    "/((?!_next/|api/|.*\\..*).*)",
  ],
};
