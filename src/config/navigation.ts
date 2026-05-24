import type { NavItem } from "@/types";

export const navigation: ReadonlyArray<NavItem> = [
  {
    key: "bases",
    href: "/catalog/bases",
    sub: ["Атакуючі", "Захисні", "Універсальні"],
  },
  {
    key: "rubbers",
    href: "/catalog/rubbers",
    sub: ["Гладкі", "Шипи", "Довгі шипи"],
  },
  {
    key: "apparel",
    href: "/catalog/apparel",
    sub: ["Футболки", "Шорти", "Шкарпетки"],
  },
  {
    key: "balls",
    href: "/catalog/balls",
  },
  {
    key: "accessories",
    href: "/catalog/accessories",
    sub: ["Клеї", "Чохли", "Сумки", "Сітки"],
  },
  {
    key: "brands",
    href: "/brands",
    sub: ["Butterfly", "DHS", "Stiga", "Tibhar"],
  },
];
