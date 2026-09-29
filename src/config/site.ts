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
  email: "ttmax.ukraine@gmail.com",
  freeShippingThreshold: 5000,
  yearFounded: 2026,
  /**
   * Профілі магазину в соцмережах — задані власником 29.09.2026. ЄДИНЕ джерело для
   * підвалу, сторінки /contacts, `sameAs` розмітки Organization і файлів для ШІ.
   * Порядок тут = порядок іконок на сайті.
   *
   * Показується й іде в `sameAs` лише ВЛАСНИЙ профіль (зі шляхом) — див. `isOwnProfileUrl()`.
   * Порожній href = профілю немає, платформа прихована. Раніше тут стояли корені платформ
   * (instagram.com/) як заглушки — посилання «в нікуди» на кожній сторінці.
   *
   * Будь-яку адресу можна перебити в адмінці (Контакти → Соцмережі), не чіпаючи коду.
   * ⚠️ Нова платформа = рядок тут + ключ у CONTACT_KEYS (lib/contact/keys.ts) + іконка
   * в SocialIcon. TS не дасть забути ключ: ContactInfo.social будується з цього списку.
   */
  social: [
    { key: "instagram", name: "Instagram", color: "#E1306C", href: "https://www.instagram.com/ttmax_butterfly/" },
    { key: "facebook", name: "Facebook", color: "#1877F2", href: "https://www.facebook.com/profile.php?id=61594769786271" },
    // Колір X — чорний, на темному підвалі він зник би; беремо світлий колір тексту X.
    { key: "x", name: "X (Twitter)", color: "#E7E9EA", href: "https://x.com/ttmax_official" },
    { key: "linkedin", name: "LinkedIn", color: "#0A66C2", href: "https://www.linkedin.com/in/tt-max/" },
    { key: "reddit", name: "Reddit", color: "#FF4500", href: "https://www.reddit.com/user/ttmax_oficial/" },
    { key: "telegram", name: "Telegram", color: "#229ED9", href: "" },
    { key: "youtube", name: "YouTube", color: "#FF0000", href: "" },
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
  /**
   * Рік заснування й графік — задані власником 23.09.2026. ЄДИНЕ джерело: звідси їх
   * беруть і розмітка (Organization.foundingDate, Store.openingHoursSpecification),
   * і сторінка контактів, і файли для ШІ. Розійтися вони не можуть.
   *
   * ⚠️ Графік у розмітці має збігатися з видимим на сайті — Google звіряє. Тому рядок
   * на /contacts і цей обʼєкт правити ТІЛЬКИ разом.
   */
  foundingYear: "2026",
  hours: {
    opens: "09:00",
    closes: "20:00",
    /** Без вихідних. Дні в нотації schema.org. */
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    timeZone: "Europe/Kyiv",
    display: { ua: "щодня 9:00–20:00 (за Києвом)", ru: "ежедневно 9:00–20:00 (по Киеву)" },
  },
} as const;

export type SiteConfig = typeof siteConfig;

export type SocialKey = (typeof siteConfig.social)[number]["key"];
export type SocialProfile = { key: SocialKey; name: string; color: string; href: string };

/**
 * Профілі, які реально показуємо: код + перевизначення з адмінки, лише власні (зі шляхом).
 * Спільне для підвалу, /contacts, `sameAs` і llms — щоб ці місця не розійшлися.
 */
export function socialProfiles(overrides?: Partial<Record<SocialKey, string>>): SocialProfile[] {
  return siteConfig.social
    .map((s) => ({ key: s.key, name: s.name, color: s.color, href: overrides?.[s.key] || s.href }))
    .filter((s) => isOwnProfileUrl(s.href));
}

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
