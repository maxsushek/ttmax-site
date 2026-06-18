"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type GalleryImage = {
  url: string;
  thumb: string;
  alt: string;
};

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const count = images.length;

  const go = useCallback(
    (next: number) => setActive((prev) => (count ? (next + count) % count : prev)),
    [count],
  );

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
    if (Math.abs(dx) > 40) go(dx < 0 ? active + 1 : active - 1);
  };

  return (
    <div
      className="flex flex-col gap-3"
      tabIndex={0}
      aria-roledescription="carousel"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(active - 1);
        if (e.key === "ArrowRight") go(active + 1);
      }}
    >
      <div
        className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-border-strong bg-white/[0.03]"
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
              onClick={() => go(active - 1)}
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
              onClick={() => go(active + 1)}
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
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <button
              type="button"
              key={img.url}
              data-idx={i}
              onClick={() => setActive(i)}
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
