// src/config/navigation.ts
import type { NavItem, NavSubLabel } from "@/types";
import type { Locale } from "@/i18n/config";

/** Локалізує мітку підпункту: бренди/латиниця лишаються як є, пари {ua,ru} — за локаллю. */
export function navSubLabel(label: NavSubLabel, locale: Locale): string {
  return typeof label === "string" ? label : label[locale];
}

// Пункты ведут на реальные SEO-URL каталога. Подпункты:
//  • где есть коллекция-хаб (data/catalog/hubs.ts, /osnovaniya/alc) — на её собственный URL:
//    это индексируемая страница со своим текстом, а меню на КАЖДОЙ странице — главный
//    источник внутренних ссылок на неё;
//  • где хаба нет (защитные основания — 1 модель, гладкие — почти вся категория, антиспин —
//    1 модель) — на категорию с фасет-параметром: canonical отбрасывает query, в индекс не идёт;
//  • «Колекції» (Butterfly) → хабы серий и групп основ.
export const navigation: ReadonlyArray<NavItem> = [
  {
    key: "rackets",
    href: "/rakety",
  },
  {
    key: "bases",
    href: "/osnovaniya",
    sub: [
      { label: { ua: "Основи ALC", ru: "Основания ALC" }, href: "/osnovaniya/alc" },
      { label: { ua: "Основи ZLC", ru: "Основания ZLC" }, href: "/osnovaniya/zlc" },
      { label: { ua: "Атакуючі", ru: "Атакующие" }, href: "/osnovaniya/atakuyuchi" },
      { label: { ua: "Захисні", ru: "Защитные" }, href: "/osnovaniya?bladeClass=def" },
      { label: { ua: "Універсальні", ru: "Универсальные" }, href: "/osnovaniya/universalni" },
    ],
  },
  {
    key: "rubbers",
    href: "/nakladki",
    sub: [
      { label: { ua: "Гладкі", ru: "Гладкие" }, href: "/nakladki?surfaceType=gladka" },
      { label: { ua: "Короткі шипи", ru: "Короткие шипы" }, href: "/nakladki/korotki-shypy" },
      { label: { ua: "Довгі шипи", ru: "Длинные шипы" }, href: "/nakladki/dovgi-shypy" },
      { label: { ua: "Антиспін", ru: "Антиспин" }, href: "/nakladki?surfaceType=antyspin" },
    ],
  },
  {
    key: "apparel",
    href: "/odyag",
    sub: [
      { label: { ua: "Футболки", ru: "Футболки" }, href: "/odyag/futbolky" },
      { label: { ua: "Шорти", ru: "Шорты" }, href: "/odyag/shorty" },
      { label: { ua: "Костюми", ru: "Костюмы" }, href: "/odyag/kostyumy" },
      { label: { ua: "Взуття", ru: "Обувь" }, href: "/obuv" },
    ],
  },
  {
    key: "balls",
    href: "/myachi",
  },
  {
    // Столи — найбільший попит ніші (~2800/міс). Без пункту в меню категорія не отримує
    // ані внутрішньої ваги, ані трафіку з навігації.
    key: "tables",
    href: "/stoly",
  },
  {
    key: "accessories",
    href: "/aksessuary",
    sub: [
      { label: { ua: "Клеї", ru: "Клеи" }, href: "/aksessuary/klei" },
      { label: { ua: "Рушники", ru: "Полотенца" }, href: "/aksessuary/rushnyky" },
      { label: { ua: "Чохли та сумки", ru: "Чехлы и сумки" }, href: "/chehly" },
      { label: { ua: "Сітки", ru: "Сетки" }, href: "/setki" },
    ],
  },
  {
    // Лейбл из messages.nav.brands = «Колекції». Подпункты → хабы серий и групп основ.
    key: "brands",
    href: "/butterfly",
    sub: [
      // Бренди/серії — мовно-нейтральні (латиниця), лишаються рядком.
      { label: "Tenergy", href: "/nakladki/tenergy" },
      { label: "Dignics", href: "/nakladki/dignics" },
      // ⚠️ Zyre і Glayzer ведуть на КАРТКИ, а не на хаби серій. Хаби в цих двох випадках
      // не індексуються (seriesIndexable у routing.ts): у Zyre всього 1 товар — хаб просто
      // дублює картку; у Glayzer slug серії збігається зі slug товару, тобто хаб і картка
      // бились за один запит. Меню ж рендериться на КОЖНІЙ сторінці — це було 684 посилання
      // (по 2 на сторінку: десктоп + мобільне) у сторінки, які не можуть ранжуватись.
      // Тепер той самий обсяг ваги йде на money-картки, обидві є в sitemap.
      { label: "Zyre", href: "/butterfly/nakladki/zyre-03" },
      { label: "Glayzer", href: "/butterfly/nakladki/glayzer" },
      { label: { ua: "Основи ALC", ru: "Основания ALC" }, href: "/osnovaniya/alc" },
      { label: { ua: "Основи ZLC", ru: "Основания ZLC" }, href: "/osnovaniya/zlc" },
    ],
  },
  {
    key: "blog",
    href: "/blog",
  },
];
