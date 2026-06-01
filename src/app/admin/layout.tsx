import type { ReactNode } from "react";
import { getSiteLogoUrl } from "@/lib/media/site-assets";
import { AdminLogoProvider } from "@/components/admin/AdminLogoContext";

export const metadata = {
  title: "Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Логотип з адмінки (entity_media → category:site-logo); фолбэк — у самому AdminShell.
  const logoUrl = await getSiteLogoUrl();
  return (
    <div className="min-h-screen bg-[#080A0E] text-[#F0F0F0] antialiased">
      <AdminLogoProvider logoUrl={logoUrl}>{children}</AdminLogoProvider>
    </div>
  );
}
