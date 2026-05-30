// src/config/navigation.ts
import type { NavItem } from "@/types";

// Пункты ведут на реальные SEO-URL каталога (категории в корне, Butterfly как /butterfly).
// Подпункты — это подсказки; пока все ведут на родительскую категорию (фасеты подключим позже).
export const navigation: ReadonlyArray<NavItem> = [
  {
    key: "bases",
    href: "/osnovaniya",
    sub: ["Атакуючі", "Захисні", "Універсальні"],
  },
  {
    key: "rubbers",
    href: "/nakladki",
    sub: ["Гладкі", "Шипи", "Довгі шипи", "Антиспін"],
  },
  {
    key: "apparel",
    href: "/odyag",
    sub: ["Футболки", "Шорти", "Взуття"],
  },
  {
    key: "balls",
    href: "/myachi",
  },
  {
    key: "accessories",
    href: "/aksessuary",
    sub: ["Клеї", "Чохли", "Сітки"],
  },
  {
    // Лейбл из messages.nav.brands = «Колекції». Только Butterfly.
    key: "brands",
    href: "/butterfly",
    sub: ["Tenergy", "Dignics", "Rozena", "Glayzer", "Zyre"],
  },
];
