"use client";
// src/components/catalog/YouTubeFacade.tsx
// Спершу лише обкладинка з кнопкою; iframe YouTube (~1 МБ скриптів) вантажиться тільки після кліку,
// щоб відео не гальмувало картку товару. Плеєр — youtube-nocookie.com (без cookie до відтворення).
import { useState } from "react";

export function YouTubeFacade({
  youtubeId,
  title,
  vertical,
  playLabel,
}: {
  youtubeId: string;
  title: string;
  vertical: boolean;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const aspect = vertical ? "aspect-[9/16]" : "aspect-video";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[20px] border border-border-strong bg-black ${aspect}`}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${playLabel}: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- зовнішня обкладинка YouTube, оптимізатор вимкнено */}
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8FF47] text-black shadow-lg transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
