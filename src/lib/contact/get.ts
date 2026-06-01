// src/lib/contact/get.ts
// Контакти + доставка: код тримає дефолти (siteConfig), а site_settings — переопределення.
// Переиспользуємо існуючу таблицю site_settings (без нової міграції) і той самий кеш/тег.
import { getSettings, settingString, type SettingsMap } from "@/lib/settings/get";
import { siteConfig } from "@/config/site";

/** Ключі site_settings для контактів та доставки. */
export const CONTACT_KEYS = {
  phone: "contact_phone",
  phoneDisplay: "contact_phone_display",
  email: "contact_email",
  telegram: "social_telegram",
  youtube: "social_youtube",
  facebook: "social_facebook",
  addrStreet: "address_street",
  addrLocality: "address_locality",
  addrRegion: "address_region",
  addrPostal: "address_postal",
  freeThreshold: "delivery_free_threshold",
  shippingFee: "delivery_shipping_fee",
} as const;

export type ContactInfo = {
  phone: string;
  phoneDisplay: string;
  email: string;
  social: { telegram: string; youtube: string; facebook: string };
  address: { street: string; locality: string; region: string; postal: string; country: string };
  freeShippingThreshold: number;
  shippingFee: number;
};

function num(s: string, fallback: number): number {
  if (!s) return fallback;
  const n = Number(s);
  return isFinite(n) && n >= 0 ? n : fallback;
}

function socialDefault(key: string): string {
  const item = siteConfig.social.find((x) => x.key === key);
  return item && item.href !== "#" ? item.href : "";
}

/** Зливає налаштування з дефолтами коду. Порожнє значення → дефолт. */
export function resolveContact(m: SettingsMap): ContactInfo {
  return {
    phone: settingString(m, CONTACT_KEYS.phone) || siteConfig.phone,
    phoneDisplay: settingString(m, CONTACT_KEYS.phoneDisplay) || siteConfig.phoneDisplay,
    email: settingString(m, CONTACT_KEYS.email) || siteConfig.email,
    social: {
      telegram: settingString(m, CONTACT_KEYS.telegram) || socialDefault("telegram"),
      youtube: settingString(m, CONTACT_KEYS.youtube) || socialDefault("youtube"),
      facebook: settingString(m, CONTACT_KEYS.facebook) || socialDefault("facebook"),
    },
    address: {
      street: settingString(m, CONTACT_KEYS.addrStreet) || siteConfig.address.streetAddress,
      locality: settingString(m, CONTACT_KEYS.addrLocality) || siteConfig.address.addressLocality,
      region: settingString(m, CONTACT_KEYS.addrRegion) || siteConfig.address.addressRegion,
      postal: settingString(m, CONTACT_KEYS.addrPostal) || siteConfig.address.postalCode,
      country: siteConfig.address.addressCountry,
    },
    freeShippingThreshold: num(
      settingString(m, CONTACT_KEYS.freeThreshold),
      siteConfig.freeShippingThreshold,
    ),
    shippingFee: num(settingString(m, CONTACT_KEYS.shippingFee), 99),
  };
}

/** Кешований резолвер (через getSettings). Безпечно в серверних компонентах. */
export async function getContact(): Promise<ContactInfo> {
  const m = await getSettings();
  return resolveContact(m);
}
