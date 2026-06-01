// src/config/admin-nav.ts
// Структура меню адмінки. Реальні розділи мають href; майбутні — status:"soon"
// (рендеряться як неактивні заглушки «скоро»). GA4 — зовнішнє посилання.

export type AdminNavItem = {
  label: string;
  /** Внутрішній маршрут (активний пункт). */
  href?: string;
  /** Зовнішнє посилання (відкривається в новій вкладці). */
  externalHref?: string;
  /** Заглушка майбутнього розділу. */
  status?: "soon";
};

export type AdminNavGroup = {
  /** Заголовок групи (відсутній — група без заголовка, напр. Дашборд). */
  title?: string;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    items: [{ label: "Дашборд", href: "/admin" }],
  },
  {
    title: "Продажі",
    items: [
      { label: "Заявки", href: "/admin/leads" },
      { label: "Замовлення", status: "soon" },
    ],
  },
  {
    title: "Каталог",
    items: [
      { label: "Товари", status: "soon" },
      { label: "Медіа / фото", href: "/admin/media" },
      { label: "Описи", status: "soon" },
    ],
  },
  {
    title: "Маркетинг",
    items: [
      { label: "SEO", status: "soon" },
      { label: "GA4", externalHref: "https://analytics.google.com/" },
    ],
  },
  {
    title: "Налаштування",
    items: [
      { label: "Лічильники", href: "/admin/settings" },
      { label: "Контакти", status: "soon" },
      { label: "Адміни", status: "soon" },
    ],
  },
];
