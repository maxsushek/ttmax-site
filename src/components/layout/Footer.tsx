"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics/events";
import type { ContactInfo } from "@/lib/contact/get";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

type FootLink = { label: string; href: string };
type FootColumn = { key: string; title: string; links: ReadonlyArray<FootLink> };

function FooterColumn({ column }: { column: FootColumn }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-subtle lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between bg-transparent py-3.5 lg:pointer-events-none"
      >
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {column.title}
        </span>
        <span
          aria-hidden
          className={cn(
            "text-lg text-accent transition-transform duration-300 lg:hidden",
            open && "rotate-45",
          )}
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
          "lg:grid-rows-[1fr]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 pb-2">
            {column.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block py-1.5 font-body text-[13px] text-ink-muted transition-all hover:pl-1 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer({
  locale,
  messages,
  logoUrl,
  contact,
}: {
  locale: Locale;
  messages: Messages;
  logoUrl?: string;
  contact?: ContactInfo;
}) {
  const m = messages.footer;
  const phoneHref = contact?.phone ?? siteConfig.phone;
  const socialHref = (key: string): string =>
    (contact?.social[key as "telegram" | "youtube" | "facebook"] ||
      siteConfig.social.find((s) => s.key === key)?.href) ??
    "#";

  // Каталожные пункты футера → реальные URL категорий.
  const catalogPaths: Record<string, string> = {
    Основи: `/${locale}/osnovaniya`,
    Накладки: `/${locale}/nakladki`,
    "М'ячі": `/${locale}/myachi`,
    Одяг: `/${locale}/odyag`,
    Аксесуари: `/${locale}/aksessuary`,
  };
  const catalogLinks: FootLink[] = m.catalogLinks.map((label) => ({
    label,
    href: catalogPaths[label] ?? `/${locale}/nakladki`,
  }));
  // Только Butterfly.
  const brandLinks: FootLink[] = [{ label: "Butterfly", href: `/${locale}/butterfly` }];
  const infoLinks: FootLink[] = m.infoLinks.map((label) => ({ label, href: "#" }));

  const columns: FootColumn[] = [
    { key: "catalog", title: m.columns.catalog, links: catalogLinks },
    { key: "brands", title: m.columns.brands, links: brandLinks },
    { key: "info", title: m.columns.info, links: infoLinks },
  ];

  return (
    <footer className="border-t border-border-subtle bg-bg-deeper">
      <div className="container-page pt-12">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
          <div>
            <Logo locale={locale} imageUrl={logoUrl} className="mb-3.5" />
            <p className="max-w-[240px] font-body text-[13px] leading-relaxed text-ink-muted">
              {m.tagline}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              {siteConfig.social.map((s) => (
                <a
                  key={s.key}
                  href={socialHref(s.key)}
                  rel="noopener noreferrer"
                  aria-label={s.key}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-white/[0.12] text-[11px] font-bold text-ink-muted transition-all hover:-translate-y-0.5"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = s.color;
                    e.currentTarget.style.color = s.color;
                    e.currentTarget.style.background = `${s.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.color = "";
                    e.currentTarget.style.background = "";
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
            <a
              href={`tel:${phoneHref}`}
              data-cta="phone"
              data-location="footer"
              onClick={() => trackEvent({ name: "phone_click", params: { location: "footer" } })}
              className="font-display text-base font-bold text-ink-muted transition-colors hover:text-ink"
            >
              {m.phone}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 py-5 lg:grid-cols-3">
          {columns.map((col) => (
            <FooterColumn key={col.key} column={col} />
          ))}
        </div>
      </div>
      <div className="border-t border-border-subtle">
        <div className="container-page flex flex-wrap items-center justify-between gap-2.5 py-4">
          <span className="font-body text-[11px] text-ink-muted">{m.copyright}</span>
          <div className="flex gap-5">
            <Link
              href={`/${locale}/privacy`}
              className="font-body text-[11px] text-ink-muted transition-colors hover:text-ink"
            >
              {m.privacy}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="font-body text-[11px] text-ink-muted transition-colors hover:text-ink"
            >
              {m.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
