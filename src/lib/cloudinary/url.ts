// src/lib/cloudinary/url.ts
// Клиент-безопасный билдер URL картинок Cloudinary (cloud name — публичный).
// Cloudinary сам отдаёт avif/webp (f_auto) и сжимает (q_auto), поэтому next/image не обязателен.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export type CldOptions = {
  w?: number;
  h?: number;
  /** thumb — режим кадрування з фокусом (для аватарів облич разом з gravity:"face"). */
  crop?: "fill" | "fit" | "limit" | "pad" | "thumb";
  gravity?: "auto" | "center" | "face";
  /** Зум для thumb/fill (напр. 1.3 — тісніше до обличчя). */
  z?: number;
};

/** Строит оптимизированный URL по public_id. Пустая строка, если cloud name не задан. */
export function cldUrl(publicId: string, opts: CldOptions = {}): string {
  if (!CLOUD || !publicId) return "";
  const { w, h, crop = "fill", gravity = "auto", z } = opts;
  // g_auto/g_face валідні лише для кадрувальних режимів (fill, thumb).
  // Для fit/limit/pad gravity не застосовується — інакше Cloudinary повертає
  // помилку (саме через c_fit + g_auto ламались логотип / hero / favicon).
  const usesGravity = crop === "fill" || crop === "thumb";
  const t = [
    "f_auto",
    "q_auto",
    `c_${crop}`,
    usesGravity ? `g_${gravity}` : "",
    z ? `z_${z}` : "",
    w ? `w_${w}` : "",
    h ? `h_${h}` : "",
    "dpr_auto",
  ]
    .filter(Boolean)
    .join(",");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}/${encodeURI(publicId)}`;
}

export const isCloudinaryConfigured = (): boolean => Boolean(CLOUD);
