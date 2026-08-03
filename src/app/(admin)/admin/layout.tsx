import type { ReactNode } from "react";
import { Roboto, Tektur } from "next/font/google";
import { cn } from "@/utils/cn";
import { getSiteLogoUrl } from "@/lib/media/site-assets";
import { AdminLogoProvider } from "@/components/admin/AdminLogoContext";
import "../../globals.css";

/**
 * ⚠️ Шрифти тут потрібні, хоч адмінка й не публічна.
 *
 * Компоненти адмінки використовують класи font-display / font-body
 * (AdminShell.tsx, MediaManager.tsx), а ці класи розкриваються у var(--font-display)
 * і var(--font-body). Змінні ставить next/font класом на <html>. Оскільки (admin) —
 * окремий кореневий layout зі своїм <html>, без цього блоку змінні тут не визначені
 * взагалі і вся типографіка адмінки тихо падає на system-ui.
 */
const tektur = Tektur({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });
const roboto = Roboto({ subsets: ["latin", "cyrillic"], variable: "--font-body", display: "swap" });

export const metadata = {
  title: "Admin · TTMAX",
  robots: { index: false, follow: false },
};

/**
 * ⚠️ КОРЕНЕВИЙ LAYOUT ГРУПИ (admin) — тут власні <html> і <body>.
 *
 * Next дозволяє кілька кореневих layout, коли маршрути розведені по групах. Саме це
 * дало змогу прибрати app/layout.tsx, який читав `await headers()` і через це переводив
 * УСЕ дерево в динамічний рендер (0 префендерів, нуль кешу на HTML).
 *
 * Адмінка свідомо лишається динамічною — вона за паролем і кешувати її не можна.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Логотип з адмінки (entity_media → category:site-logo); фолбэк — у самому AdminShell.
  const logoUrl = await getSiteLogoUrl();
  return (
    <html lang="uk" className={cn(tektur.variable, roboto.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-[#080A0E] text-[#F0F0F0] antialiased">
        <AdminLogoProvider logoUrl={logoUrl}>{children}</AdminLogoProvider>
      </body>
    </html>
  );
}
