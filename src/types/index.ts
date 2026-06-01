export type ProductCategory = "base" | "rubber" | "ball" | "apparel";
export type ProductBadge = "hit" | "new" | "sale";

export type Product = {
  id: string;
  brand: string;
  model: string;
  category: ProductCategory;
  price: number;
  badge?: ProductBadge;
  accentColor: string;
  emoji: string;
  /** Resolved Cloudinary URL для мініатюри в кошику (необов'язково). */
  image?: string;
};

export type CartItem = Product & { qty: number };

export type CategoryKey = "bases" | "rubbers" | "apparel" | "balls";

export type Category = {
  key: CategoryKey;
  icon: string;
  count: string;
  accentColor: string;
};

export type Brand = {
  id: string;
  name: string;
  flag: string;
  productsCount: number;
};

export type NavItem = {
  key: string;
  href: string;
  subKey?: string;
  sub?: ReadonlyArray<string>;
};

export type AttributionData = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  msclkid?: string;
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
};
