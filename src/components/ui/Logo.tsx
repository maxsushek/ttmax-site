import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

export function Logo({
  locale,
  size = "md",
  className,
}: {
  locale: Locale;
  size?: "sm" | "md";
  className?: string;
}) {
  const tileSize = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
  const textSize = size === "sm" ? "text-lg" : "text-xl";
  return (
    <Link
      href={`/${locale}`}
      className={cn("flex items-center gap-2.5 select-none", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center rounded-[10px] bg-accent",
          tileSize,
        )}
      >
        {siteConfig.emoji}
      </span>
      <span
        className={cn(
          "font-display font-black uppercase tracking-[0.06em] text-ink",
          textSize,
        )}
      >
        TT<span className="text-accent">{siteConfig.brandSuffix}</span>
      </span>
    </Link>
  );
}
