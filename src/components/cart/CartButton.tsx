"use client";

import { useCart } from "./CartProvider";
import type { Messages } from "@/i18n/messages/types";
import { cn } from "@/utils/cn";

export function CartButton({ label }: { label: Messages["nav"]["cart"] }) {
  const { count, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      data-cta="open-cart"
      data-location="header"
      aria-label={`${label} (${count})`}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-xl border border-border-strong",
        "bg-white/[0.07] px-3.5 py-2.5 transition-colors duration-200",
        "hover:bg-white/[0.12]",
      )}
    >
      <span aria-hidden className="text-lg leading-none">
        🛒
      </span>
      <span
        className={cn(
          "hidden font-display text-[13px] font-bold uppercase tracking-[0.06em] sm:inline whitespace-nowrap",
          count > 0 ? "text-accent" : "text-ink-muted",
        )}
      >
        {label}
        {count > 0 ? ` (${count})` : ""}
      </span>
      {count > 0 && (
        <span
          aria-hidden
          className={cn(
            "absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center",
            "rounded-[10px] border-2 border-bg-base bg-accent px-1",
            "font-display text-[10px] font-black text-bg-base animate-badge-pop",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
