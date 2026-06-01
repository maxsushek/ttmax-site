"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CartButton } from "@/components/cart/CartButton";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { navigation } from "@/config/navigation";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

export function Header({
  locale,
  messages,
  logoUrl,
}: {
  locale: Locale;
  messages: Messages;
  logoUrl?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[600] transition-[background-color,border-color,box-shadow] duration-300",
          scrolled
            ? "border-b border-white/10 bg-[#05070B]/95 shadow-[0_4px_32px_rgba(0,0,0,0.6)]"
            : "border-b border-white/[0.04] bg-bg-base/40",
        )}
        style={{
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div className="container-page flex h-16 items-center gap-6">
          <Logo locale={locale} imageUrl={logoUrl} />

          <nav aria-label="Primary" className="hidden flex-1 items-center gap-5 lg:flex">
            {navigation.map((link) => {
              const label = messages.nav[link.key as keyof Messages["nav"]];
              return (
                <div key={link.key} className="group relative">
                  <Link
                    href={`/${locale}${link.href}`}
                    className="nav-link whitespace-nowrap font-display text-[13px] font-semibold uppercase tracking-[0.07em] text-ink-muted"
                  >
                    {label}
                    {link.sub && (
                      <span aria-hidden className="ml-1 align-middle text-[8px] text-accent">
                        ▾
                      </span>
                    )}
                  </Link>
                  {link.sub && (
                    <div
                      className={cn(
                        "absolute left-1/2 top-full mt-3 -translate-x-1/2",
                        "min-w-[168px] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D13]/[0.97]",
                        "pointer-events-none opacity-0 transition-all duration-200",
                        "group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
                      )}
                      style={{ backdropFilter: "blur(20px)" }}
                    >
                      {link.sub.map((s) => (
                        <Link
                          key={s}
                          href={`/${locale}${link.href}`}
                          className="block border-b border-white/[0.04] px-4 py-2.5 font-body text-[13px] font-medium tracking-[0.05em] text-ink-dim transition-all last:border-0 hover:bg-accent/[0.05] hover:pl-5 hover:text-accent"
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <LocaleSwitcher currentLocale={locale} />
            </div>
            <CartButton label={messages.nav.cart} />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Menu"
              className={cn(
                "flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-border lg:hidden",
                scrolled ? "bg-white/[0.07]" : "bg-white/10",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "block h-0.5 w-5 rounded transition-all",
                  menuOpen ? "translate-y-2 rotate-45 bg-accent" : "bg-ink",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "block h-0.5 w-3.5 rounded bg-accent transition-opacity",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "block h-0.5 w-5 rounded transition-all",
                  menuOpen ? "-translate-y-2 -rotate-45 bg-accent" : "bg-ink",
                )}
              />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        locale={locale}
        messages={messages}
        logoUrl={logoUrl}
      />
    </>
  );
}
