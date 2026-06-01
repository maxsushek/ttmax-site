// src/components/admin/AdminLogoContext.tsx
// Передає URL логотипа (з admin layout, сервер) у клієнтський AdminShell.
"use client";

import { createContext, useContext, type ReactNode } from "react";

const AdminLogoContext = createContext<string | undefined>(undefined);

export function AdminLogoProvider({
  logoUrl,
  children,
}: {
  logoUrl?: string;
  children: ReactNode;
}) {
  return <AdminLogoContext.Provider value={logoUrl}>{children}</AdminLogoContext.Provider>;
}

export function useAdminLogo(): string | undefined {
  return useContext(AdminLogoContext);
}
