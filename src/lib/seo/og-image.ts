// src/lib/seo/og-image.ts
// Прев'ю-картинка посилання для Telegram, Viber, Facebook, Twitter/X.
import type { Locale } from "@/i18n/config";

/**
 * ⚠️ БЕЗ og:image месенджер показує голий текст — без картинки посилання виглядає
 * як спам і його гірше відкривають. Категорії й картки товару свою картинку мали
 * (фото товару), а от головна, блог і всі інфосторінки — ні. Саме головну шлють
 * найчастіше, тож дірка була рівно там, де найбільше боляче.
 *
 * Картинку не заливаємо файлом, а збираємо трансформацією з логотипа, який уже
 * лежить у Cloudinary. Чому так:
 *   • не треба вантажити ассет (у мене немає доступу на запис у Cloudinary);
 *   • змінився логотип — автоматично зміниться й прев'ю;
 *   • Cloudinary віддає її з CDN і кешує, тож ваги сторінці це не додає.
 */

/** Public id логотипа в Cloudinary — той самий, що в siteConfig.logoUrl. */
const LOGO_ID = "ttmax/category/site-logo/hndfad14fgl7vipsxont";

/**
 * ⚠️ c_lpad, а НЕ c_pad. c_pad розтягує картинку до цільового розміру й тим самим
 * зжирає місце, залишене під підпис — логотип наповзав на текст. c_lpad лише
 * додає поля й ніколи не збільшує.
 *
 * ⚠️ b_rgb:0E0F11 — це піксель кутка самого логотипа (заміряно, не на око). Будь-який
 * інший відтінок дає видимий шов по краю квадрата логотипа.
 *
 * ⚠️ Шрифт Roboto, бо в ньому є кирилиця. Barlow Condensed, яким зроблено водяний
 * знак на фото товару, кирилиці НЕ має — український підпис вийде квадратиками.
 */
const TRANSFORM = [
  "f_auto,q_auto,c_fit,h_390",
  "c_lpad,w_1200,h_630,b_rgb:0E0F11,g_north,y_25",
].join("/");

/** Підпис під логотипом. Латиниця + кирилиця, обидві є в Roboto. */
const TAGLINE: Record<Locale, string> = {
  ua: "Офіційний Butterfly в Україні",
  ru: "Официальный Butterfly в Украине",
};

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** URL прев'ю-картинки 1200×630 для вказаної мови. */
export function ogImageUrl(locale: Locale): string {
  // encodeURIComponent, а не encodeURI: у тексті є пробіли, і Cloudinary чекає на %20.
  const text = encodeURIComponent(TAGLINE[locale]);
  const overlay = `l_text:Roboto_46:${text},co_white,g_south,y_85`;
  return `https://res.cloudinary.com/dh6vuxjko/image/upload/${TRANSFORM}/${overlay}/${LOGO_ID}`;
}

/** Готовий блок для openGraph.images / twitter.images у Metadata. */
export function ogImages(locale: Locale) {
  return [
    {
      url: ogImageUrl(locale),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: TAGLINE[locale],
    },
  ];
}
