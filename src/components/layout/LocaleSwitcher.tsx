"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeLabels, localeToLang, type Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

export function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname() ?? `/${currentLocale}`;
  const stripped = pathname.replace(/^\/(ua|ru)/, "") || "";

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${stripped}`}
          hrefLang={localeToLang[l]}
          aria-current={l === currentLocale ? "true" : undefined}
          className={cn(
            "rounded-md px-2 py-1 font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors",
            l === currentLocale
              ? "bg-accent/15 text-accent"
              : "text-ink-dim hover:text-ink",
          )}
        >
          {localeLabels[l]}
        </Link>
      ))}
    </div>
  );
}
