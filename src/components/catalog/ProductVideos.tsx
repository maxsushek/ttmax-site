// src/components/catalog/ProductVideos.tsx
// Блок «Відео» на картці товару + VideoObject у JSON-LD (дані — src/data/catalog/videos.ts).
import type { Locale } from "@/i18n/config";
import type { ProductVideo } from "@/data/catalog/videos";
import { YouTubeFacade } from "./YouTubeFacade";

const HEADING: Record<Locale, string> = { ua: "Відео", ru: "Видео" };
const PLAY: Record<Locale, string> = { ua: "Відтворити відео", ru: "Воспроизвести видео" };
const WATCH: Record<Locale, string> = { ua: "Дивитися на YouTube", ru: "Смотреть на YouTube" };

function watchUrl(v: ProductVideo) {
  return v.vertical
    ? `https://www.youtube.com/shorts/${v.youtubeId}`
    : `https://www.youtube.com/watch?v=${v.youtubeId}`;
}

export function ProductVideos({ videos, locale }: { videos: ProductVideo[]; locale: Locale }) {
  if (videos.length === 0) return null;

  const ld = videos.map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title[locale],
    description: v.description[locale],
    thumbnailUrl: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
    uploadDate: v.uploadDate,
    embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
    contentUrl: watchUrl(v),
    inLanguage: locale === "ua" ? "uk" : "ru",
  }));

  return (
    <section>
      <h2 className="mb-5 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">
        {HEADING[locale]}
      </h2>
      <div className="flex flex-wrap gap-6">
        {videos.map((v) => (
          <figure key={v.youtubeId} className={v.vertical ? "w-full max-w-[300px]" : "w-full max-w-[720px]"}>
            <YouTubeFacade
              youtubeId={v.youtubeId}
              title={v.title[locale]}
              vertical={v.vertical}
              playLabel={PLAY[locale]}
            />
            <figcaption className="mt-3 text-sm font-semibold text-ink">{v.title[locale]}</figcaption>
            <a
              href={watchUrl(v)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {WATCH[locale]} ↗
            </a>
          </figure>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}
