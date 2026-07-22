// src/config/navigation.ts
import type { NavItem, NavSubLabel } from "@/types";
import type { Locale } from "@/i18n/config";

/** Локалізує мітку підпункту: бренди/латиниця лишаються як є, пари {ua,ru} — за локаллю. */
export function navSubLabel(label: NavSubLabel, locale: Locale): string {
  return typeof label === "string" ? label : label[locale];
}

// Пункты ведут на реальные SEO-URL каталога. Подпункты имеют свои адреса:
//  • основания: группы ALC/ZLC → собственные страницы-коллекции /osnovaniya/{alc|zlc};
//    стили (атака/защита/универсал) → категория с фасет-параметром (CatalogFilters применяет фильтр);
//  • накладки → категория с фасет-параметром;
//  • «Колекції» (Butterfly) → хабы серий и групп основ;
//  • одяг/аксесуари → пока на родительскую категорию (фасеты появятся позже).
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
      { label: { ua: "Атакуючі", ru: "Атакующие" }, href: "/osnovaniya?bladeClass=off,off-plus" },
      { label: { ua: "Захисні", ru: "Защитные" }, href: "/osnovaniya?bladeClass=def" },
      {
        label: { ua: "Універсальні", ru: "Универсальные" },
        href: "/osnovaniya?bladeClass=all,all-plus,off-minus",
      },
    ],
  },
  {
    key: "rubbers",
    href: "/nakladki",
    sub: [
      { label: { ua: "Гладкі", ru: "Гладкие" }, href: "/nakladki?surfaceType=gladka" },
      { label: { ua: "Шипи", ru: "Шипы" }, href: "/nakladki?surfaceType=korotki-shypy" },
      { label: { ua: "Довгі шипи", ru: "Длинные шипы" }, href: "/nakladki?surfaceType=dovgi-shypy" },
      { label: { ua: "Антиспін", ru: "Антиспин" }, href: "/nakladki?surfaceType=antyspin" },
    ],
  },
  {
    key: "apparel",
    href: "/odyag",
    sub: [
      { label: { ua: "Футболки", ru: "Футболки" }, href: "/odyag?gearType=tshirt" },
      { label: { ua: "Шорти", ru: "Шорты" }, href: "/odyag?gearType=shorts" },
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
      { label: { ua: "Клеї", ru: "Клеи" }, href: "/aksessuary?gearType=glue" },
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
      { label: "Zyre", href: "/nakladki/zyre" },
      { label: "Glayzer", href: "/nakladki/glayzer" },
      { label: { ua: "Основи ALC", ru: "Основания ALC" }, href: "/osnovaniya/alc" },
      { label: { ua: "Основи ZLC", ru: "Основания ZLC" }, href: "/osnovaniya/zlc" },
    ],
  },
  {
    key: "blog",
    href: "/blog",
  },
];
