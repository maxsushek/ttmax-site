"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGallerySync } from "./GallerySync";
import { trackEvent } from "@/lib/analytics/events";

export type GalleryImage = {
  url: string;
  thumb: string;
  alt: string;
};

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  // Якщо картка обгорнута GallerySyncProvider (товар із розфарбуваннями) — активний
  // кадр живе там, спільно з селектором кольору. Інакше — власний стан, як було.
  const sync = useGallerySync();
  const [localActive, setLocalActive] = useState(0);
  const active = sync ? sync.index : localActive;
  const setActive = sync ? sync.setIndex : setLocalActive;
  const touchStartX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const count = images.length;

  // ⚠️ Рахуємо від `active`, а не через setState(prev => …): у режимі синхронізації
  // сеттер приходить ззовні й функціональної форми не приймає.
  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setActive(((next % count) + count) % count);
    },
    [count, setActive],
  );

  // Аналітика гортання: на стрілки галереї припадала більшість rage-кліків, тож бачимо,
  // чим саме гортають (стрілка / свайп / мініатюра / клавіатура) і до якого кадру доходять.
  const nav = (next: number, method: "arrow" | "swipe" | "thumb" | "key") => {
    if (count < 2) return;
    const to = ((next % count) + count) % count;
    go(to);
    trackEvent({ name: "gallery_navigate", params: { method, index: to + 1, count } });
  };

  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const current = count > 0 ? images[Math.min(active, count - 1)] : undefined;
  if (!current) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    const endX = e.changedTouches[0]?.clientX;
    if (startX === null || endX === undefined) return;
    const dx = endX - startX;
    if (Math.abs(dx) > 40) nav(dx < 0 ? active + 1 : active - 1, "swipe");
  };

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-3"
      tabIndex={0}
      aria-roledescription="carousel"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") nav(active - 1, "key");
        if (e.key === "ArrowRight") nav(active + 1, "key");
      }}
    >
      <div
        className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[28px] border border-border-strong bg-white/[0.03]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => (
          <Image
            key={img.url}
            src={img.url}
            alt={i === active ? current.alt : ""}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-cover transition-opacity duration-300 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Попереднє фото"
              onClick={() => nav(active - 1, "arrow")}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-ink backdrop-blur transition-all hover:border-accent/50 hover:bg-black/60 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Наступне фото"
              onClick={() => nav(active + 1, "arrow")}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-ink backdrop-blur transition-all hover:border-accent/50 hover:bg-black/60 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 font-display text-[11px] font-bold tabular-nums text-ink-muted backdrop-blur">
              {active + 1} / {count}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={thumbsRef}
          className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <button
              type="button"
              key={img.url}
              data-idx={i}
              onClick={() => nav(i, "thumb")}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border transition-all sm:w-[72px] ${
                i === active
                  ? "border-accent ring-1 ring-accent"
                  : "border-border-strong opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.thumb} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
