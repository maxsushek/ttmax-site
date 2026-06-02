// src/config/navigation.ts
import type { NavItem } from "@/types";

// Пункты ведут на реальные SEO-URL каталога. Подпункты теперь имеют свои адреса:
//  • основания/накладки → категория с фасет-параметром (CatalogFilters применяет фильтр);
//  • «Колекції» (Butterfly) → хабы серий /{категория}/{серія};
//  • одяг/аксесуари → пока на родительскую категорию (фасеты появятся позже).
// Параметры фасетов соответствуют реальным значениям данных (bladeClass, surfaceType).
export const navigation: ReadonlyArray<NavItem> = [
  {
    key: "bases",
    href: "/osnovaniya",
    sub: [
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
    // Лейбл из messages.nav.brands = «Колекції». Только Butterfly. Подпункты → хабы серий.
    key: "brands",
    href: "/butterfly",
    sub: [
      { label: "Tenergy", href: "/nakladki/tenergy" },
      { label: "Dignics", href: "/nakladki/dignics" },
      { label: "Rozena", href: "/nakladki/rozena" },
      { label: "Glayzer", href: "/nakladki/glayzer" },
      { label: "Zyre", href: "/nakladki/zyre" },
    ],
  },
];
