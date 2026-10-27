#!/usr/bin/env bash
# ttmax_mobile_nav_v2.sh — мобільне меню: сам заголовок розділу клікабельний (веде на розділ),
# стрілка-квадрат окремо лише розгортає підпункти; зайвий пункт "Усі <категорія>" прибрано.
# Перезаписує 1 файл. Запуск: bash ttmax_mobile_nav_v2.sh | Сухий: TTMAX_NO_GIT=1 bash ttmax_mobile_nav_v2.sh
set -euo pipefail

if [ ! -f package.json ] || [ ! -f 'src/components/layout/MobileMenu.tsx' ]; then echo Запустіть у корені ttmax-site.; exit 1; fi
echo "▶ Оновлюю мобільне меню (клікабельний заголовок + окрема стрілка)…"
cat > 'src/components/layout/MobileMenu.tsx' <<'MOBILE_EOF'
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { navigation } from "@/config/navigation";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

export function MobileMenu({
  open,
  onClose,
  locale,
  messages,
  logoUrl,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  messages: Messages;
  logoUrl?: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const cart = useCart();

  // Lock scroll
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[700] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "fixed bottom-0 right-0 top-0 z-[800] flex w-[min(320px,85vw)] flex-col overflow-y-auto",
          "border-l border-border-subtle bg-[#0A0C12] transition-transform duration-[380ms] ease-[cubic-bezier(0.23,1,0.32,1)] lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
          <Logo locale={locale} size="sm" imageUrl={logoUrl} />
          <button
            type="button"
            onClick={onClose}
            aria-label={messages.common.close}
            className="p-1 text-xl text-ink-dim transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 py-2">
          {navigation.map((link) => {
            const label = messages.nav[link.key as keyof Messages["nav"]];
            const isActive = activeKey === link.key;
            return (
              <div key={link.key} className="border-b border-white/[0.04]">
                {link.sub ? (
                  <>
                    <div
                      className={cn(
                        "flex items-stretch transition-colors",
                        isActive ? "bg-accent/[0.05]" : "",
                      )}
                    >
                      <Link
                        href={`/${locale}${link.href}`}
                        onClick={onClose}
                        className={cn(
                          "flex flex-1 items-center gap-3 px-5 py-4 text-left",
                          "font-display text-lg font-bold uppercase tracking-[0.06em] transition-colors",
                          isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "h-[18px] w-[3px] shrink-0 rounded transition-colors",
                            isActive ? "bg-accent" : "bg-accent/40",
                          )}
                        />
                        {label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setActiveKey(isActive ? null : link.key)}
                        aria-expanded={isActive}
                        aria-label={isActive ? "Згорнути" : "Розгорнути"}
                        className="flex items-center border-l border-white/[0.06] px-4 transition-colors hover:bg-white/[0.03]"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                            isActive
                              ? "rotate-180 bg-accent"
                              : "border border-border bg-white/[0.07]",
                          )}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 4L6 8L10 4"
                              stroke={isActive ? "#080A0E" : "#E8FF47"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div
                      className={cn(
                        "grid bg-black/20 transition-[grid-template-rows] duration-[380ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                        isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="py-1.5">
                          {link.sub.map((s) => (
                            <Link
                              key={s.href}
                              href={`/${locale}${s.href}`}
                              onClick={onClose}
                              className="flex items-center gap-2 px-5 py-2.5 pl-[52px] font-body text-sm text-ink-dim transition-all hover:pl-[60px] hover:text-accent"
                            >
                              <span
                                aria-hidden
                                className="h-1 w-1 shrink-0 rounded-full bg-accent/40"
                              />
                              {s.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={`/${locale}${link.href}`}
                    onClick={onClose}
                    className="flex items-center justify-between bg-transparent px-5 py-4 font-display text-lg font-bold uppercase tracking-[0.06em] text-ink-muted transition-colors hover:text-ink"
                  >
                    {label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4">
          <span className="font-body text-xs text-ink-dim">Language</span>
          <LocaleSwitcher currentLocale={locale} />
        </div>

        <div className="border-t border-border-subtle px-6 py-5">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              onClose();
              cart.open();
            }}
            data-cta="open-cart"
            data-location="mobile-menu"
          >
            🛒 {messages.nav.cart}
            {cart.count > 0 ? ` (${cart.count})` : ""}
          </Button>
        </div>
      </aside>
    </>
  );
}
MOBILE_EOF
echo "  ✓ src/components/layout/MobileMenu.tsx"
if [ "${TTMAX_NO_GIT:-0}" = "1" ]; then echo "▶ TTMAX_NO_GIT=1 — без git.";
else
  git add 'src/components/layout/MobileMenu.tsx'
  git commit -m "fix(nav): клікабельний заголовок розділу + окрема стрілка у мобільному меню" || echo "(нема змін)"
  git push origin HEAD
  echo "✓ Запушено."
fi
echo ""
echo "✅ Готово. На мобільному: тап по назві розділу веде на розділ; квадрат зі стрілкою — розгортає підпункти."
