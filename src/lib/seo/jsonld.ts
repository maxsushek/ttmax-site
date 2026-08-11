import { siteConfig, isOwnProfileUrl } from "@/config/site";
import { localeToLang, type Locale } from "@/i18n/config";
import type { ContactInfo } from "@/lib/contact/get";

export function organizationJsonLd(contact?: ContactInfo) {
  /**
   * ⚠️ У розмітку йде E.164 (phone), а НЕ phoneDisplay.
   *
   * Це поле читає машина, а не людина: Google звіряє його з номером у Business Profile і
   * використовує для дзвінка. «+38 (096) 672-61-36» з дужками й пробілами доводиться
   * нормалізувати здогадкою, «+380966726136» — однозначний.
   * Людський підпис лишається у видимому тексті (phoneDisplay у підвалі й на /contacts).
   */
  const telephone = contact?.phone ?? siteConfig.phone;
  const email = contact?.email ?? siteConfig.email;
  // ⚠️ У sameAs — ЛИШЕ власні профілі. Корені платформ (instagram.com/) — заглушки
  // в підвалі, і тут вони означали б, що TTMAX і є Instagram. Див. isOwnProfileUrl().
  const sameAs = (
    contact ? Object.values(contact.social) : siteConfig.social.map((s) => s.href)
  ).filter(isOwnProfileUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: siteConfig.logoUrl,
    sameAs,
    // PostalAddress реальної адреси магазину. Раніше адреси в JSON-LD не було ВЗАГАЛІ:
    // єдина функція з address (localBusinessJsonLd) ніде не викликалась.
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      addressLocality: siteConfig.address.addressLocality,
      addressRegion: siteConfig.address.addressRegion,
      addressCountry: siteConfig.address.addressCountry,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone,
        email,
        contactType: "customer service",
        areaServed: "UA",
        availableLanguage: ["uk", "ru"],
      },
    ],
    /**
     * ⚠️ Політика повернення ДУБЛЮЄТЬСЯ тут свідомо, хоча вона є і в кожному Offer.
     * Документація Google прямо радить давати ГЛОБАЛЬНУ політику магазину саме через
     * Organization, а не лише на рівні товару: «We recommend you provide a global return
     * policy for your business under Organization markup instead». Умови ті самі —
     * повертає той самий returnPolicyNode(), тож розійтися вони не можуть.
     */
    hasMerchantReturnPolicy: returnPolicyNode(),
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: `${siteConfig.url}/${locale}`,
    inLanguage: localeToLang[locale],
    // ⚠️ SearchAction тут НЕ оголошуємо, і повертати його не треба, поки на сайті
    // немає сторінки пошуку. Було: target на /{locale}/search?q=… — а /ua/search
    // віддає 404. Тобто розмітка на всіх 316 сторінках обіцяла Google пошук, який
    // веде в нікуди. Зʼявиться реальна сторінка пошуку — тоді й повернути,
    // ОДНОЧАСНО з нею, а не «про запас».
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteConfig.name,
    url: siteConfig.url,
    // E.164, не phoneDisplay — з тієї ж причини, що й в organizationJsonLd вище.
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.address,
    },
  };
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** Хлібні крихти. items: [{ name, path }], path без локалі ("/" = головна). */
export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>,
  locale: Locale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}/${locale}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

/**
 * Доставка й повернення для Offer — умови магазину в машиночитному вигляді.
 *
 * НАВІЩО: без цих двох блоків товар не має права на merchant listings у Google, тобто на
 * показ ціни, наявності й строків доставки прямо у видачі. Перевірено по живому топ-10 UA
 * за «tenergy 05»: з усіх конкурентів це є ЛИШЕ в одного (meryl), а сторінка на першому
 * місці взагалі не має Product-розмітки. Тобто це дешева перевага, а не наздоганяння.
 *
 * ⚠️ ВСІ ЦИФРИ ТУТ МУСЯТЬ ЗБІГАТИСЯ З ТЕКСТОМ НА /delivery і /returns. Розмітка, яка
 * суперечить видимому тексту, — це підстава для ручних санкцій, а не просто помилка.
 * Джерело правди: src/data/info.ts (delivery: відправка 1–2 робочих дні, доставка 1–3 дні;
 * returns: 14 днів за Законом «Про захист прав споживачів»).
 */
const SHIPPING_HANDLING_DAYS = { min: 1, max: 2 } as const; // збирання й відправка замовлення
const SHIPPING_TRANSIT_DAYS = { min: 1, max: 3 } as const; // перевізник по Україні
const RETURN_DAYS = 14; // ст. 9 ЗУ «Про захист прав споживачів»

function shippingDetailsNode(shippingFee: number, currency: string) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: shippingFee, currency },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "UA" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: SHIPPING_HANDLING_DAYS.min,
        maxValue: SHIPPING_HANDLING_DAYS.max,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: SHIPPING_TRANSIT_DAYS.min,
        maxValue: SHIPPING_TRANSIT_DAYS.max,
        unitCode: "DAY",
      },
    },
  };
}

/**
 * ⚠️ returnFees свідомо CustomerResponsibility — тобто зворотну пересилку оплачує покупець.
 * Це стандарт для товару НАЛЕЖНОЇ якості за українським законом і збігається з тим, що
 * описано на /returns. Якщо власник вирішить возити повернення за свій рахунок — міняти
 * тут на FreeReturn і ОДНОЧАСНО правити текст на /returns, інакше розмітка почне брехати.
 */
// Використовується і в Offer, і в Organization (див. hasMerchantReturnPolicy вище).
// Оголошення функції піднімається, тож виклик вище за визначення тут коректний.
function returnPolicyNode() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "UA",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: RETURN_DAYS,
    returnMethod: "https://schema.org/ReturnByMail",
    // ⚠️ Саме ReturnFeesCustomerResponsibility, а НЕ ReturnShippingFees: друге значення
    // вимагає ще й returnShippingFeesAmount із конкретною сумою, а в нас пересилка йде
    // за тарифом перевізника й фіксованої суми немає. Вказати ReturnShippingFees без суми =
    // невалідна розмітка.
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  };
}

/** Schema.org Product для сторінки товару. Якщо ціни немає — блок offers не додається. */
export function productJsonLd(opts: {
  name: string;
  description: string;
  /** Абсолютний URL сторінки товару. */
  url: string;
  brand: string;
  /** Абсолютні URL зображень (поки порожньо — додамо з Cloudinary). */
  images?: string[];
  sku?: string;
  /** Ціна "від" (для одиничного Offer). */
  price?: number;
  /** Діапазон цін варіантів — для AggregateOffer (коли варіанти мають різні ціни). */
  lowPrice?: number;
  highPrice?: number;
  offerCount?: number;
  /** YYYY-MM-DD; автообчислюється на стороні виклику (вручну не задається). */
  priceValidUntil?: string;
  /**
   * YYYY-MM-DD — з якого числа діє поточна ціна.
   *
   * ⚠️ Пара до priceValidUntil, і Google просить саме її: без validFrom строк дії ціни
   * закритий лише з одного боку («діє до», але невідомо з якого числа). Джерело дати —
   * product_overrides.updated_at, якщо ціну перекрито з адмінки, інакше
   * PRICE_LIST_EFFECTIVE_DATE. Вигадувати дату НЕ можна: це заявлений строк дії ціни.
   */
  priceValidFrom?: string;
  /** Напр. "UAH". */
  currency?: string;
  inStock?: boolean;
  /**
   * Поріг безкоштовної доставки, грн (site_settings → delivery_free_threshold).
   *
   * ⚠️ Якщо ціна товару досягає порогу, доставка ДІЙСНО безкоштовна, і тоді в розмітку
   * йде єдина ставка 0 — саме так Google очікує «безкоштовну доставку» (freeShippingThreshold
   * у специфікації немає, потрібен shippingRate зі значенням 0).
   *
   * ⚠️ Для дешевших товарів нуль писати НЕ МОЖНА: доставка платна, і це була б неправда
   * у сніпеті — рівно той клас тверджень, який ми з сайту прибирали.
   */
  freeShippingThreshold?: number;
  /**
   * Тарифи доставки, грн — по одному на перевізника (Нова Пошта, Укрпошта). Беруться
   * з site_settings через resolveContact, тобто ті самі числа, що покупець бачить на
   * чекауті. Якщо не передати, блоки shippingDetails і hasMerchantReturnPolicy не
   * додаються взагалі: краще без розмітки, ніж із вигаданою цифрою.
   *
   * ⚠️ Було одне число на весь сайт, поки доставка коштувала однаково в усіх. Щойно
   * в Укрпошти зʼявився свій тариф (80 проти 90), розмітка почала занижувати вибір
   * покупця до однієї ставки. Тепер перелічуємо всі — Google показує найдешевшу.
   */
  shippingFees?: number[];
}) {
  const {
    name,
    description,
    url,
    brand,
    images,
    sku,
    price,
    lowPrice,
    highPrice,
    offerCount,
    priceValidUntil,
    priceValidFrom,
    currency = "UAH",
    inStock,
    shippingFees,
    freeShippingThreshold,
  } = opts;

  // Доставку й повернення чіпляємо лише коли тарифи реально відомі.
  // Дублікати прибираємо: якщо перевізники беруть однаково, двічі писати те саме нема сенсу.
  // Ціна, за якою вирішуємо, чи дотягує товар до безкоштовної доставки: для діапазону
  // беремо НИЖНЮ межу — інакше дешевший варіант отримав би обіцянку не за своєю ціною.
  const cheapest = typeof price === "number" ? price : lowPrice;
  const shipsFree =
    typeof freeShippingThreshold === "number" &&
    typeof cheapest === "number" &&
    cheapest >= freeShippingThreshold;

  const rates = shipsFree
    ? [0]
    : Array.from(
        new Set((shippingFees ?? []).filter((f) => typeof f === "number" && f >= 0)),
      ).sort((a, b) => a - b);
  const offerExtras =
    rates.length > 0
      ? {
          shippingDetails: (() => {
            const nodes = rates.map((f) => shippingDetailsNode(f, currency));
            // Один тариф — обʼєкт, кілька — масив: обидві форми валідні, але з одним
            // перевізником масив на один елемент виглядає як недороблена розмітка.
            return nodes.length === 1 ? nodes[0] : nodes;
          })(),
          hasMerchantReturnPolicy: returnPolicyNode(),
        }
      : {};

  // ⚠️ Без offers / review / aggregateRating вузол Product НЕ дає права на розширений
  // сніпет узагалі — Google вимагає хоча б одне з трьох. Тобто для товару без ціни
  // («Ціна за запитом») ми віддавали розмітку, якою пошуковик скористатись не може,
  // і отримували за неї попередження «Missing field offers» у Search Console.
  // Порожній вузол не приносить нічого, а шум у звіті ховає справжні проблеми.
  // Зʼявиться ціна — розмітка повернеться сама.
  const hasOffer =
    (typeof price === "number" && price > 0) ||
    (typeof lowPrice === "number" && typeof highPrice === "number");
  if (!hasOffer) return null;

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    brand: { "@type": "Brand", name: brand },
  };
  if (images && images.length > 0) node.image = images;
  if (sku) node.sku = sku;

  const availability = inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const itemCondition = "https://schema.org/NewCondition";

  if (
    typeof lowPrice === "number" &&
    typeof highPrice === "number" &&
    highPrice > lowPrice &&
    (offerCount ?? 0) > 1
  ) {
    node.offers = {
      "@type": "AggregateOffer",
      url,
      lowPrice,
      highPrice,
      offerCount,
      priceCurrency: currency,
      availability,
      itemCondition,
      ...(priceValidFrom ? { validFrom: priceValidFrom } : {}),
      ...(priceValidUntil ? { priceValidUntil } : {}),
      ...offerExtras,
    };
  } else if (typeof price === "number" && price > 0) {
    node.offers = {
      "@type": "Offer",
      url,
      price,
      priceCurrency: currency,
      availability,
      itemCondition,
      ...(priceValidFrom ? { validFrom: priceValidFrom } : {}),
      ...(priceValidUntil ? { priceValidUntil } : {}),
      ...offerExtras,
    };
  }
  return node;
}

/** Schema.org Person — автор статті. sameAs (зовнішні профілі) корроборує особу для E-E-A-T. */
export function personJsonLd(opts: {
  name: string;
  /** Абсолютний URL сторінки автора (/author/slug). */
  url: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  knowsAbout?: string[];
  sameAs?: string[];
}) {
  const { name, url, jobTitle, description, image, knowsAbout, sameAs } = opts;
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
  };
  if (jobTitle) node.jobTitle = jobTitle;
  if (description) node.description = description;
  if (image) node.image = image;
  if (knowsAbout && knowsAbout.length > 0) node.knowsAbout = knowsAbout;
  if (sameAs && sameAs.length > 0) node.sameAs = sameAs;
  return node;
}

/** Schema.org BlogPosting. Дати — ISO 8601, приходять З ДАНИХ статті (не new Date()). */
export function blogPostingJsonLd(opts: {
  /** Абсолютний canonical URL статті. */
  url: string;
  headline: string;
  description: string;
  images?: string[];
  datePublished: string;
  dateModified: string;
  authorName: string;
  /** Абсолютний URL автора (/author/slug). */
  authorUrl: string;
  /** BCP-47: uk | ru. */
  inLanguage: string;
}) {
  const {
    url,
    headline,
    description,
    images,
    datePublished,
    dateModified,
    authorName,
    authorUrl,
    inLanguage,
  } = opts;
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished,
    dateModified,
    inLanguage,
    author: { "@type": "Person", name: authorName, url: authorUrl },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: siteConfig.logoUrl },
    },
  };
  if (images && images.length > 0) node.image = images;
  return node;
}
