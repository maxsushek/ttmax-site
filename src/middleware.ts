import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";

const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;

function detectLocaleFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  const langs = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "")
    .filter(Boolean);
  for (const lang of langs) {
    const short = lang.split("-")[0];
    if (short && isLocale(short)) return short;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const pathLocale = first && isLocale(first) ? first : null;

  if (pathLocale) {
    const response = NextResponse.next();
    response.headers.set("x-locale", pathLocale);
    response.headers.set("x-pathname", pathname);
    // Persist user preference
    if (request.cookies.get("NEXT_LOCALE")?.value !== pathLocale) {
      response.cookies.set("NEXT_LOCALE", pathLocale, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  }

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const detected =
    cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : (detectLocaleFromAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale);

  const url = request.nextUrl.clone();
  url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
