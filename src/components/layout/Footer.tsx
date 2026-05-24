"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics/events";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

type FootColumn = { key: string; title: string; links: ReadonlyArray<string> };

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
            {column.links.map((label) => (
              <Link
                key={label}
                href="#"
                className="block py-1.5 font-body text-[13px] text-ink-ghost transition-all hover:pl-1 hover:text-ink-muted"
              >
                {label}
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
}: {
  locale: Locale;
  messages: Messages;
}) {
  const m = messages.footer;
  const brandLinks = ["Butterfly", "DHS", "Stiga", "Tibhar", "Nittaku"];

  const columns: FootColumn[] = [
    { key: "catalog", title: m.columns.catalog, links: m.catalogLinks },
    { key: "brands", title: m.columns.brands, links: brandLinks },
    { key: "info", title: m.columns.info, links: m.infoLinks },
  ];

  return (
    <footer className="border-t border-border-subtle bg-bg-deeper">
      <div className="container-page pt-12">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
          <div>
            <Logo locale={locale} className="mb-3.5" />
            <p className="max-w-[240px] font-body text-[13px] leading-relaxed text-ink-ghost">
              {m.tagline}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              {siteConfig.social.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  rel="noopener noreferrer"
                  aria-label={s.key}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-white/[0.09] text-[11px] font-bold text-ink-dim transition-all hover:-translate-y-0.5"
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
              href={`tel:${siteConfig.phone}`}
              data-cta="phone"
              data-location="footer"
              onClick={() => trackEvent({ name: "phone_click", params: { location: "footer" } })}
              className="font-display text-base font-bold text-ink-dim transition-colors hover:text-ink"
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
          <span className="font-body text-[11px] text-ink-ghost">{m.copyright}</span>
          <div className="flex gap-5">
            <Link href={`/${locale}/privacy`} className="font-body text-[11px] text-ink-ghost transition-colors hover:text-ink-muted">
              {m.privacy}
            </Link>
            <Link href={`/${locale}/terms`} className="font-body text-[11px] text-ink-ghost transition-colors hover:text-ink-muted">
              {m.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
