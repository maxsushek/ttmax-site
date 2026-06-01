import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

export function Logo({
  locale,
  size = "md",
  className,
  imageUrl,
}: {
  locale: Locale;
  size?: "sm" | "md";
  className?: string;
  imageUrl?: string;
}) {
  const tileSize = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
  const textSize = size === "sm" ? "text-[15px]" : "text-[17px]";
  const subSize = size === "sm" ? "text-[8px]" : "text-[9px]";

  // Brand visual is "BUTTERFLY.UA" with yellow accent on .UA + "by TTMAX" small sub
  // We split the main name on the brandSuffix so the suffix renders with accent color.
  // Example: name="Butterfly UA", brandSuffix="UA" → "BUTTERFLY" + accent ".UA"
  const fullName = siteConfig.name.toUpperCase();
  const suffix = siteConfig.brandSuffix.toUpperCase();
  const mainName = fullName.replace(new RegExp(`\\s*${suffix}$`), "");

  const imgHeight = size === "sm" ? "h-8" : "h-9";

  return (
    <Link
      href={`/${locale}`}
      className={cn("flex select-none items-center gap-2.5", className)}
      aria-label={`${siteConfig.name} home`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={siteConfig.name}
          className={cn("w-auto max-w-[180px] object-contain", imgHeight)}
        />
      ) : (
        <>
          <span
            aria-hidden
            className={cn(
              "inline-flex items-center justify-center rounded-[10px] bg-accent",
              tileSize,
            )}
          >
            {siteConfig.emoji}
          </span>
          <span className="flex flex-col leading-none">
            <span
              className={cn(
                "font-display font-black uppercase tracking-[0.04em] text-ink",
                textSize,
              )}
            >
              {mainName}
              <span className="text-accent">.{suffix}</span>
            </span>
            <span
              className={cn("mt-0.5 font-body uppercase tracking-[0.18em] text-ink-ghost", subSize)}
            >
              {siteConfig.subBrand}
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
