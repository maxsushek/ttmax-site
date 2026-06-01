// src/lib/cloudinary/url.ts
// Клиент-безопасный билдер URL картинок Cloudinary (cloud name — публичный).
// Cloudinary сам отдаёт avif/webp (f_auto) и сжимает (q_auto), поэтому next/image не обязателен.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export type CldOptions = {
  w?: number;
  h?: number;
  crop?: "fill" | "fit" | "limit" | "pad";
  gravity?: "auto" | "center";
};

/** Строит оптимизированный URL по public_id. Пустая строка, если cloud name не задан. */
export function cldUrl(publicId: string, opts: CldOptions = {}): string {
  if (!CLOUD || !publicId) return "";
  const { w, h, crop = "fill", gravity = "auto" } = opts;
  const t = [
    "f_auto",
    "q_auto",
    `c_${crop}`,
    `g_${gravity}`,
    w ? `w_${w}` : "",
    h ? `h_${h}` : "",
    "dpr_auto",
  ]
    .filter(Boolean)
    .join(",");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}/${encodeURI(publicId)}`;
}

export const isCloudinaryConfigured = (): boolean => Boolean(CLOUD);
