// src/config/navigation.ts
import type { NavItem } from "@/types";

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
      { label: "Основи ALC", href: "/osnovaniya/alc" },
      { label: "Основи ZLC", href: "/osnovaniya/zlc" },
      { label: "Атакуючі", href: "/osnovaniya?bladeClass=off,off-plus" },
      { label: "Захисні", href: "/osnovaniya?bladeClass=def" },
      { label: "Універсальні", href: "/osnovaniya?bladeClass=all,all-plus,off-minus" },
    ],
  },
  {
    key: "rubbers",
    href: "/nakladki",
    sub: [
      { label: "Гладкі", href: "/nakladki?surfaceType=gladka" },
      { label: "Шипи", href: "/nakladki?surfaceType=korotki-shypy" },
      { label: "Довгі шипи", href: "/nakladki?surfaceType=dovgi-shypy" },
      { label: "Антиспін", href: "/nakladki?surfaceType=antyspin" },
    ],
  },
  {
    key: "apparel",
    href: "/odyag",
    sub: [
      { label: "Футболки", href: "/odyag?gearType=tshirt" },
      { label: "Шорти", href: "/odyag?gearType=shorts" },
      { label: "Взуття", href: "/obuv" },
    ],
  },
  {
    key: "balls",
    href: "/myachi",
  },
  {
    key: "accessories",
    href: "/aksessuary",
    sub: [
      { label: "Клеї", href: "/aksessuary?gearType=glue" },
      { label: "Чохли та сумки", href: "/chehly" },
      { label: "Сітки", href: "/setki" },
    ],
  },
  {
    // Лейбл из messages.nav.brands = «Колекції». Подпункты → хабы серий и групп основ.
    key: "brands",
    href: "/butterfly",
    sub: [
      { label: "Tenergy", href: "/nakladki/tenergy" },
      { label: "Dignics", href: "/nakladki/dignics" },
      { label: "Zyre", href: "/nakladki/zyre" },
      { label: "Glayzer", href: "/nakladki/glayzer" },
      { label: "Основи ALC", href: "/osnovaniya/alc" },
      { label: "Основи ZLC", href: "/osnovaniya/zlc" },
    ],
  },
  {
    key: "blog",
    href: "/blog",
  },
];
