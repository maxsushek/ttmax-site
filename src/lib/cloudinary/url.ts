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
  /**
   * Колір полів для crop:"pad" — "auto" (Cloudinary бере колір із самої картинки)
   * або hex без решітки ("F5F5F5"). Ігнорується для інших режимів кадрування.
   *
   * ⚠️ Без нього Cloudinary заливає поля ЧОРНИМ, і світле фото товару отримує
   * дві чорні смуги. З "auto" поля зливаються з фоном фото — шва не видно.
   */
  bg?: "auto" | string;
  /** Водяний знак TTMAX. За замовчуванням ВИМКНЕНО — див. коментар до watermarkChain(). */
  wm?: boolean;
};

/** Public ID кутової плашки в Cloudinary (чорна плашка · TT лаймом · MAX білим). */
const WM_MARK = "_znak-TT-laymom_lafuns";

/**
 * Водяний знак: великий напівпрозорий TTMAX по центру + кутова плашка.
 *
 * ⚠️ ВМИКАЄТЬСЯ ТОЧКОВО, а не глобально. Знак потрібен лише там, де картинка велика:
 * галерея товару, Product JSON-LD і OG. На плитці каталогу (480px), мініатюрах (160),
 * крос-селі (96) і в АДМІНЦІ його бути не повинно — там він перетворюється на кашу,
 * а в адмінці власник має бачити справжній файл. Тому опція opt-in.
 *
 * ⚠️ ЧОМУ ДВА ТЕКСТОВІ ШАРИ, а не один з обводкою: у Cloudinary `bo_` малює РАМКУ
 * навколо блоку тексту, а не контур літер — виходить чорний прямокутник поперек фото
 * (перевірено). Тому темний шар зі зсувом 4px + білий поверх: на світлому тлі читається
 * темний, на чорній коробці — білий. Фото товарів мають і те, і те одночасно.
 *
 * Оригінал у Cloudinary НЕ змінюється — знак живе тільки в URL доставки. Вимкнути =
 * прибрати `wm: true` у викликача; попередні похідні лишаються в кеші, тож відкат миттєвий.
 */
function watermarkChain(w: number, h: number): string {
  // Кегль рахуємо від МЕНШОЇ сторони: на 1200×630 (OG) розрахунок по ширині дав би
  // напис, що вилазить за межі кадру по висоті.
  const ref = Math.min(w, h);
  const font = Math.round(ref * 0.244);
  const markW = Math.round(w * 0.208);
  // Кут СВІДОМО заведений на товар, а не в порожній кут: знак на тлі зрізається
  // звичайним кадруванням, знак поверх краю товару — ні.
  const x = Math.round(w * 0.09);
  const y = Math.round(h * 0.1);
  const text = `l_text:Barlow%20Condensed_${font}_bold:TTMAX`;
  return [
    `${text},co_rgb:080A0E,o_16,a_22,x_4,y_4`,
    `${text},co_white,o_22,a_22`,
    `l_${WM_MARK},w_${markW},g_south_east,x_${x},y_${y}`,
  ].join("/");
}

/** Строит оптимизированный URL по public_id. Пустая строка, если cloud name не задан. */
export function cldUrl(publicId: string, opts: CldOptions = {}): string {
  if (!CLOUD || !publicId) return "";
  const { w, h, crop = "fill", gravity = "auto", z, wm, bg } = opts;
  // g_auto/g_face валідні лише для кадрувальних режимів (fill, thumb).
  // Для fit/limit/pad gravity не застосовується — інакше Cloudinary повертає
  // помилку (саме через c_fit + g_auto ламались логотип / hero / favicon).
  const usesGravity = crop === "fill" || crop === "thumb";
  const t = [
    "f_auto",
    "q_auto",
    `c_${crop}`,
    usesGravity ? `g_${gravity}` : "",
    // Поля мають сенс лише там, де вони взагалі зʼявляються.
    crop === "pad" && bg ? (bg === "auto" ? "b_auto" : `b_rgb:${bg}`) : "",
    z ? `z_${z}` : "",
    w ? `w_${w}` : "",
    h ? `h_${h}` : "",
    "dpr_auto",
  ]
    .filter(Boolean)
    .join(",");
  // Знак накладається ПІСЛЯ ресайзу — інакше він масштабувався б разом із картинкою
  // і на кожному розмірі виглядав би по-різному. Без заданих w і h пропускаємо:
  // рахувати кегль і відступи немає від чого.
  const chain = wm && w && h ? `${t}/${watermarkChain(w, h)}` : t;
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${chain}/${encodeURI(publicId)}`;
}

export const isCloudinaryConfigured = (): boolean => Boolean(CLOUD);
