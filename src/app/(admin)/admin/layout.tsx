import type { ReactNode } from "react";
import { Tektur } from "next/font/google";
import { getSiteLogoUrl } from "@/lib/media/site-assets";
import { AdminLogoProvider } from "@/components/admin/AdminLogoContext";
import "../../globals.css";

/**
 * ⚠️ Tektur тут потрібен, хоч адмінка й не публічна: компоненти використовують клас
 * font-display (AdminShell, MediaManager), а він розкривається у var(--font-display).
 * Змінну ставить next/font класом на <html>, і оскільки (admin) — окремий кореневий
 * layout зі своїм <html>, без цього блоку типографіка адмінки тихо падає на system-ui.
 *
 * Roboto тут БІЛЬШЕ НЕМА: основний текст на всьому проєкті переведено на системний
 * шрифт (див. tailwind.config.ts, fontFamily.body). Клас font-body тепер одразу
 * розкривається в системний стек, змінна --font-body не потрібна.
 */
const tektur = Tektur({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });

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
    <html lang="uk" className={tektur.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[#080A0E] text-[#F0F0F0] antialiased">
        <AdminLogoProvider logoUrl={logoUrl}>{children}</AdminLogoProvider>
      </body>
    </html>
  );
}
