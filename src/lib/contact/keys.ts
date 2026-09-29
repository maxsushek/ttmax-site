// src/lib/contact/keys.ts
// Чисті константи + типи контактів/доставки БЕЗ серверних імпортів.
// Винесено окремо, щоб клієнтські компоненти (ContactsForm, Footer) могли імпортувати
// CONTACT_KEYS/ContactInfo, НЕ затягуючи next/headers (через settings → supabase/server) у клієнтський бандл.

import type { SocialKey } from "@/config/site";

/** Ключі site_settings для контактів та доставки. */
export const CONTACT_KEYS = {
  phone: "contact_phone",
  phoneDisplay: "contact_phone_display",
  email: "contact_email",
  // Соцмережі: назва властивості = SocialKey з config/site.ts (перевіряється нижче).
  telegram: "social_telegram",
  instagram: "social_instagram",
  youtube: "social_youtube",
  facebook: "social_facebook",
  x: "social_x",
  linkedin: "social_linkedin",
  reddit: "social_reddit",
  addrStreet: "address_street",
  addrLocality: "address_locality",
  addrRegion: "address_region",
  addrPostal: "address_postal",
  freeThreshold: "delivery_free_threshold",
  // ⚠️ Тариф у КОЖНОГО перевізника свій, і одного числа тут замало.
  // delivery_shipping_fee — це Нова Пошта (історична назва ключа; не перейменовуємо,
  // бо значення вже лежить у site_settings на проді й перейменування його загубить).
  shippingFee: "delivery_shipping_fee",
  ukrposhtaFee: "delivery_ukrposhta_fee",
} as const;

// Компілятор перевіряє, що в CONTACT_KEYS є ключ для КОЖНОЇ платформи зі siteConfig.social:
// додали платформу в конфіг і забули ключ адмінки — збірка впаде тут, а не мовчки.
const _everySocialHasKey: Record<SocialKey, string> = CONTACT_KEYS;
void _everySocialHasKey;

export type ContactInfo = {
  phone: string;
  phoneDisplay: string;
  email: string;
  /** Адреса профілю по кожній платформі; "" — профілю немає. */
  social: Record<SocialKey, string>;
  address: { street: string; locality: string; region: string; postal: string; country: string };
  freeShippingThreshold: number;
  /** Тариф Нової Пошти, грн. */
  shippingFee: number;
  /** Тариф Укрпошти, грн. Зазвичай дешевший за НП — тому окреме число, а не те саме. */
  ukrposhtaFee: number;
};
