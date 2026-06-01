// src/components/admin/AdminShell.tsx
// Оболонка адмінки: бічна панель на ПК + бургер-дровер на мобайлі.
// Підсвічує активний пункт, містить вихід. Обгортає сторінки /admin/*
// (крім /admin/login, яка цю оболонку не використовує).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { signOutAction } from "@/app/admin/actions";
import { adminNav } from "@/config/admin-nav";
import { cn } from "@/utils/cn";

function isActive(pathname: string | null, href?: string): boolean {
  if (!pathname || !href) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8FF47] text-base">
        🏓
      </div>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="whitespace-nowrap text-base font-black tracking-wider">
          TT<span className="text-[#E8FF47]">MAX</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#555]">Admin</span>
      </div>
    </div>
  );
}

const ITEM_BASE =
  "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {adminNav.map((group, gi) => (
        <div key={group.title ?? `group-${gi}`}>
          {group.title && (
            <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">
              {group.title}
            </div>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              if (item.status === "soon") {
                return (
                  <li key={item.label}>
                    <span className={cn(ITEM_BASE, "cursor-default text-[#555]")}>
                      {item.label}
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] text-[#555] ring-1 ring-white/10">
                        скоро
                      </span>
                    </span>
                  </li>
                );
              }

              if (item.externalHref) {
                return (
                  <li key={item.label}>
                    <a
                      href={item.externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onNavigate}
                      className={cn(
                        ITEM_BASE,
                        "text-[#888] hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      {item.label}
                      <span aria-hidden className="text-[#555]">
                        ↗
                      </span>
                    </a>
                  </li>
                );
              }

              const active = isActive(pathname, item.href);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href ?? "#"}
                    onClick={onNavigate}
                    className={cn(
                      ITEM_BASE,
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-[#888] hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SignOutButton({ full }: { full?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    if (isPending) return;
    if (!confirm("Точно выйти из админки?")) return;
    startTransition(() => signOutAction());
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={cn(
        "rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#888] transition-colors hover:border-white/25 hover:text-white disabled:opacity-50",
        full && "w-full",
      )}
    >
      {isPending ? "Выход..." : "Выйти →"}
    </button>
  );
}

function SidebarBody({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="mb-2 truncate px-1 font-body text-[11px] text-[#666]">{email}</div>
        <SignOutButton full />
      </div>
    </>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#bbb] transition-colors hover:text-white"
    >
      {children}
    </button>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Закривати дровер при зміні маршруту.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Блокувати прокрутку фону, поки відкрито дровер.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr]">
      {/* Бічна панель — ПК */}
      <aside className="hidden border-r border-white/[0.06] bg-[#0A0C12] lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-14 items-center border-b border-white/[0.06] px-4">
            <Brand />
          </div>
          <SidebarBody email={email} />
        </div>
      </aside>

      {/* Колонка контенту */}
      <div className="min-w-0">
        {/* Верхня панель — мобайл */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0A0C12]/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <IconButton label="Меню" onClick={() => setOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </IconButton>
            <Brand />
          </div>
          <SignOutButton />
        </header>

        {/* Дровер — мобайл */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Закрити меню"
              className="absolute inset-0 bg-black/70"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-72 animate-slide-in flex-col border-r border-white/[0.08] bg-[#0A0C12]">
              <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
                <Brand />
                <IconButton label="Закрити" onClick={() => setOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </IconButton>
              </div>
              <SidebarBody email={email} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
