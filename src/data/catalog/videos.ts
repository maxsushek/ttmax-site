// src/data/catalog/videos.ts
// Відео з нашого YouTube-каналу на картках товарів: slug товару → список роликів.
// uploadDate — справжня дата публікації з YouTube (потрібна для VideoObject у JSON-LD), не вигадувати.
import type { Locale } from "@/i18n/config";

export interface ProductVideo {
  /** ID ролика YouTube (з посилання /shorts/<id> або ?v=<id>). */
  youtubeId: string;
  /** Shorts — вертикальний кадр 9:16; звичайне відео — 16:9. */
  vertical: boolean;
  /** Підпис над плеєром і назва в JSON-LD. */
  title: Record<Locale, string>;
  /** Короткий опис для JSON-LD (VideoObject.description). */
  description: Record<Locale, string>;
  /** ISO-дата публікації на YouTube. */
  uploadDate: string;
}

export const productVideos: Record<string, ProductVideo[]> = {
  "apolonia-zlc": [
    {
      youtubeId: "zYD7Nh3wHOQ",
      vertical: true,
      title: {
        ua: "Відеоогляд Apolonia ZLC + Zyre 03 + Tenergy 05 FX",
        ru: "Видеообзор Apolonia ZLC + Zyre 03 + Tenergy 05 FX",
      },
      description: {
        ua: "Збираємо ракетку Butterfly: основа Apolonia ZLC, Zyre 03 на форхенд і Tenergy 05 FX на бекхенд.",
        ru: "Собираем ракетку Butterfly: основание Apolonia ZLC, Zyre 03 на форхенд и Tenergy 05 FX на бэкхенд.",
      },
      uploadDate: "2026-10-30T13:13:31-07:00",
    },
  ],
};

export function getProductVideos(slug: string): ProductVideo[] {
  return productVideos[slug] ?? [];
}
