import type { ReactNode } from "react";

export const metadata = {
  title: "Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080A0E] text-[#F0F0F0] antialiased">
      {children}
    </div>
  );
}
