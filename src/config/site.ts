export const siteConfig = {
  /** Main brand displayed in Logo/Header/Footer */
  name: "Butterfly UA",
  /** Yellow-accented part of the brand name in Logo */
  brandSuffix: "UA",
  /** Sub-brand line shown under main logo */
  subBrand: "by TTMAX",
  /** Used in legal footer copyright */
  operator: "TTMAX",
  // Рішення власника (2026-07-21): основний домен — ttmax.com.ua.
  // ⚠️ Фактичний URL у canonical/og/hreflang/sitemap бере NEXT_PUBLIC_SITE_URL (на Vercel зараз
  // vercel-піддомен). Перемикати змінну ТІЛЬКИ ПІСЛЯ того, як домен підключено й відкривається,
  // інакше canonical показуватиме на домен, який не віддає сайт.
  domain: "ttmax.com.ua",
  // ⚠️ ФОЛБЕК НАВМИСНО НА ЖИВИЙ vercel-хост, а НЕ на ttmax.com.ua.
  // canonical/og/hreflang/sitemap будуються з цього значення. Якщо фолбек вказує на домен,
  // який ще не віддає сайт (а ttmax.com.ua поки не зареєстровано), то будь-який деплой без
  // заданої змінної (preview/branch — вони не бачать Production env) віддасть 916 canonical
  // на мертвий хост. Фолбек має бути fail-safe: гірший випадок — canonical на vercel, а не в нікуди.
  // На запуску задати NEXT_PUBLIC_SITE_URL=https://ttmax.com.ua у Vercel ПІСЛЯ підключення домену.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ttmax-site-z2za.vercel.app",
  /** Логотип для JSON-LD publisher/Organization (Cloudinary, ≥112px для rich results). */
  logoUrl:
    "https://res.cloudinary.com/dh6vuxjko/image/upload/f_auto,q_auto,c_fit,h_200/ttmax/category/site-logo/hndfad14fgl7vipsxont",
  /** false → весь сайт noindex + robots блокує все (до офіційного запуску). Вмикається NEXT_PUBLIC_SITE_LAUNCHED="true". */
  launched: process.env.NEXT_PUBLIC_SITE_LAUNCHED === "true",
  emoji: "🦋",
  /** Featured brand on the storefront (used in Hero, FAQ, JSON-LD) */
  featuredBrand: "Butterfly",
  // Реальний номер магазину, заданий власником 04.08.2026 (був плейсхолдер +380000000000).
  // phone — строго E.164 без пробілів: іде в tel: і в ContactPoint.telephone (JSON-LD).
  // phoneDisplay — те, що бачить людина; ЄДИНЕ джерело підпису в шапці, підвалі й на /contacts.
  // ⚠️ Обидва можна перебити з адмінки (site_settings → contact_phone / contact_phone_display),
  // ці значення лише фолбек коду.
  phone: "+380966726136",
  phoneDisplay: "+38 (096) 672-61-36",
  // Фолбек: реальна пошта задається в /admin (contacts) і перебиває це значення.
  email: "hello@ttmax.com.ua",
  freeShippingThreshold: 5000,
  yearFounded: 2026,
  /**
   * Соцмережі в підвалі.
   *
   * ⚠️ Зараз тут КОРЕНІ платформ — тимчасові заглушки, поки в магазину немає
   * власних профілів. Вони свідомо НЕ потрапляють у `sameAs` розмітки Organization:
   * `sameAs` означає «ця сама організація також живе за цією адресою», тож
   * "https://www.instagram.com/" там заявив би, що TTMAX — це і є Instagram.
   *
   * Правило розрізнення — `isOwnProfileUrl()` нижче: у профілю Є шлях
   * (instagram.com/ttmax_ua), у кореня платформи його немає. Тому щойно власник
   * впише реальний профіль — він потрапить у `sameAs` САМ, без правок коду.
   *
   * Реальні адреси зручніше вписувати в адмінці (Контакти), а не тут.
   */
  social: [
    { key: "instagram", label: "IG", color: "#E1306C", href: "https://www.instagram.com/" },
    { key: "telegram", label: "TG", color: "#229ED9", href: "https://t.me/" },
    { key: "youtube", label: "YT", color: "#FF0000", href: "https://www.youtube.com/" },
    { key: "facebook", label: "FB", color: "#1877F2", href: "https://www.facebook.com/" },
  ],
  // Schema.org address (PostalAddress) — реальна адреса магазину, задана власником 25.07.2026.
  // Пишемо українською: для українського бізнесу локальна форма коректніша за транслітерацію
  // і збігається з тим, як адресу вводять у Google Business / картах.
  // postalCode свідомо порожній — не вигадуємо індекс; поле необовʼязкове для PostalAddress.
  address: {
    streetAddress: "вул. Ньютона, 143Б",
    addressLocality: "Харків",
    addressRegion: "Харківська область",
    postalCode: "",
    addressCountry: "UA",
  },
  /** Готовий рядок адреси для видимого тексту (контакти, футер). */
  addressDisplay: {
    ua: "вул. Ньютона, 143Б, Харків",
    ru: "ул. Ньютона, 143Б, Харьков",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Чи це ВЛАСНИЙ профіль магазину, а не корінь платформи-заглушки.
 *
 * ⚠️ Від цього залежить `sameAs` у розмітці Organization. Туди можна писати лише
 * сторінки, які справді представляють ЦЮ організацію: "instagram.com/ttmax_ua" —
 * можна, "instagram.com/" — ні, бо це заявка на те, що магазин і є Instagram.
 *
 * Критерій навмисно структурний, а не список винятків: у профілю є шлях, у кореня
 * платформи — немає. Тож нова платформа не вимагатиме правки цієї функції, а щойно
 * власник впише реальний профіль — той потрапить у `sameAs` автоматично.
 */
export function isOwnProfileUrl(href: string | undefined): boolean {
  if (!href || href === "#") return false;
  try {
    return new URL(href).pathname.replace(/\/+$/, "").length > 0;
  } catch {
    return false;
  }
}
