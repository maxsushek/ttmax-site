// src/lib/contact/keys.ts
// Чисті константи + типи контактів/доставки БЕЗ серверних імпортів.
// Винесено окремо, щоб клієнтські компоненти (ContactsForm, Footer) могли імпортувати
// CONTACT_KEYS/ContactInfo, НЕ затягуючи next/headers (через settings → supabase/server) у клієнтський бандл.

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
