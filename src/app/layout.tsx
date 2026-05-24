import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { headers } from "next/headers";
import { defaultLocale, isLocale } from "@/i18n/config";
import { cn } from "@/utils/cn";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const headerLocale = h.get("x-locale");
  const locale = headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;
  return (
    <html
      lang={locale}
      className={cn(barlowCondensed.variable, barlow.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-base text-ink">{children}</body>
    </html>
  );
}
