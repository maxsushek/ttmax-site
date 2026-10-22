// Багатий контент підкатегорій-хабів (/nakladki/dovgi-shypy, /osnovaniya/atakuyuchi, …).
// getRichContent(slug) у categoryContent.ts віддає його замість короткого seoText із hubs.ts.
//
// Принципи (SEO + GEO — щоб сторінку цитували ШІ-асистенти):
//  • відповідь першою: «Коротко» з 3–6 тез одразу під вступом;
//  • лише факти з офіційних даних Butterfly (і правил ITTF) — з видимими «Джерелами»;
//  • таблиця порівняння моделей хабу з посиланнями на картки (хаб передає вагу карткам,
//    а не конкурує з ними: тут — «як обрати», на картці — сама модель);
//  • FAQ з короткими відповідями (→ FAQPage) і дата «Оновлено».
import type { RichContent } from "../categoryContent";
import { RUBBER_HUBS } from "./rubbers";
import { BLADE_HUBS } from "./blades";
import { ACCESSORY_HUBS } from "./accessories";
import { BAG_HUBS } from "./bags";
import { WEAR_HUBS } from "./wear";

export const HUB_CONTENT: Record<string, RichContent> = {
  ...RUBBER_HUBS,
  ...BLADE_HUBS,
  ...ACCESSORY_HUBS,
  ...BAG_HUBS,
  ...WEAR_HUBS,
};
