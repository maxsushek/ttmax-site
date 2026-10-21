// src/data/catalog/gearCopy.ts
// Картки екіпірування: виправлена назва, meta-опис і «Дивіться також» (UA+RU).
// Основний текст картки (вердикт, опис, переваги, кому підійде, порівняння, FAQ) — у
// gearExpert.ts; саме наявність експертного запису відкриває картку для індексу
// (productIndexable → getExpert). Нічого вмикати вручну не треба.
//
// ⚠️ ПРАВИЛА:
//  • лише факти виробника (butterfly-global.com, офіційний дистрибʼютор Butterfly Adria,
//    фірмові картки Butterfly у ритейлерів) і нашого каталогу. Технології (B-Absorber,
//    Wingrip…) пишемо тільки тим моделям, у яких їх називає виробник;
//  • якщо даних про модель немає — копі НЕ пишемо, картка лишається закритою. Так свідомо
//    лишились мʼячі S40+, тубус, бавовняна губка (у дилера — замшева, суперечить назві),
//    шльопанці (у дилера інша модель), рушники Germany/Yao/Stripe, Black Line, BG Case, пляшка 22 й дрібні аксесуари
//    без опису виробника (19.10.2026);
//  • однаковий товар в іншому обʼємі чи кольорі (клей 37/50/500 мл, Rifones сині/чорні) не
//    відкриваємо — це дублі основної картки; їхній попит забирає основна картка й хаб.
//
// Розміри взуття 38–46 — ті, що на картці (вибір розміру); інших не обіцяємо.
import type { CatalogProduct, Localized } from "@/types/catalog";
import { wearCopy } from "./gearExpertWear";

type Copy = {
  /**
   * Точна назва моделі, якщо в прайсі вона записана неповно чи криво («VILIGHT» замість
   * «Lezoline Vilight», «R40 + 3 * (3шт в уп)»). Йде в H1, title, кошик, фід і розмітку.
   */
  name?: Localized;
  /** meta description, 110–158 символів. */
  description: Localized;
  /**
   * «Дивіться також»: підкатегорія-хаб і суміжні розділи під експертним блоком.
   * Самі тексти картки (вердикт, опис, FAQ, порівняння) — у gearExpert.ts.
   */
  links?: { label: Localized; href: string }[];
};

/* ---------- Спільні лінки (перелінковка на хаби й категорії) ---------- */
const L_SHOES = [
  { label: { ua: "Усе взуття Butterfly", ru: "Вся обувь Butterfly" }, href: "/obuv" },
  { label: { ua: "Шкарпетки Butterfly", ru: "Носки Butterfly" }, href: "/odyag/shkarpetky" },
];
const L_BALLS = [
  { label: { ua: "Усі мʼячі Butterfly", ru: "Все мячи Butterfly" }, href: "/myachi" },
  { label: { ua: "Сітки для столу", ru: "Сетки для стола" }, href: "/setki" },
];
const L_GLUE = [
  { label: { ua: "Як наклеїти накладку — інструкція", ru: "Как наклеить накладку — инструкция" }, href: "/blog/yak-nakleity-nakladku" },
  { label: { ua: "Клей для накладок", ru: "Клей для накладок" }, href: "/aksessuary/klei" },
  { label: { ua: "Торцеві стрічки", ru: "Торцевые ленты" }, href: "/aksessuary/tortsevi-strichky" },
  { label: { ua: "Накладки Butterfly", ru: "Накладки Butterfly" }, href: "/nakladki" },
];
const L_CARE = [
  { label: { ua: "Догляд за накладками", ru: "Уход за накладками" }, href: "/aksessuary/doglyad" },
  { label: { ua: "Чохли для ракеток", ru: "Чехлы для ракеток" }, href: "/chehly/chokhly" },
];
const L_TAPE = [
  { label: { ua: "Як наклеїти накладку — інструкція", ru: "Как наклеить накладку — инструкция" }, href: "/blog/yak-nakleity-nakladku" },
  { label: { ua: "Усі торцеві стрічки", ru: "Все торцевые ленты" }, href: "/aksessuary/tortsevi-strichky" },
  { label: { ua: "Клей для накладок", ru: "Клей для накладок" }, href: "/aksessuary/klei" },
];
const L_NETS = [
  { label: { ua: "Усі сітки Butterfly", ru: "Все сетки Butterfly" }, href: "/setki" },
  { label: { ua: "Тенісні столи", ru: "Теннисные столы" }, href: "/stoly" },
  { label: { ua: "Мʼячі Butterfly", ru: "Мячи Butterfly" }, href: "/myachi" },
];
const L_BAGS = [
  { label: { ua: "Спортивні сумки", ru: "Спортивные сумки" }, href: "/chehly/sumky" },
  { label: { ua: "Чохли для ракеток", ru: "Чехлы для ракеток" }, href: "/chehly/chokhly" },
  { label: { ua: "Рюкзаки", ru: "Рюкзаки" }, href: "/chehly/ryukzaky" },
];
const L_PACKS = [
  { label: { ua: "Рюкзаки", ru: "Рюкзаки" }, href: "/chehly/ryukzaky" },
  { label: { ua: "Спортивні сумки", ru: "Спортивные сумки" }, href: "/chehly/sumky" },
  { label: { ua: "Чохли для ракеток", ru: "Чехлы для ракеток" }, href: "/chehly/chokhly" },
];
const L_CASES = [
  { label: { ua: "Чохли для ракеток", ru: "Чехлы для ракеток" }, href: "/chehly/chokhly" },
  { label: { ua: "Догляд за накладками", ru: "Уход за накладками" }, href: "/aksessuary/doglyad" },
  { label: { ua: "Спортивні сумки", ru: "Спортивные сумки" }, href: "/chehly/sumky" },
];
const L_TOWELS = [
  { label: { ua: "Усі рушники", ru: "Все полотенца" }, href: "/aksessuary/rushnyky" },
  { label: { ua: "Спортивні сумки", ru: "Спортивные сумки" }, href: "/chehly/sumky" },
];
const shoe = (slug: string, ua: string, ru: string) => ({
  label: { ua, ru },
  href: `/butterfly/obuv/${slug}`,
});

const COPY: Record<string, Copy> = {
  /* =========================== Взуття =========================== */
  "krosivky-butterfly-vilight": {
    name: { ua: "Кросівки Butterfly Lezoline Vilight", ru: "Кроссовки Butterfly Lezoline Vilight" },
    description: {
      ua: "Кросівки Butterfly Lezoline Vilight — легка модель для швидкої й точної роботи ніг: чіпка гумова підошва, гнучка проміжна підошва з EVA. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Vilight — лёгкая модель для быстрой и точной работы ног: цепкая резиновая подмётка, гибкая подошва EVA. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-vilata", "Lezoline Vilata — ширша версія", "Lezoline Vilata — широкая версия"), ...L_SHOES],
  },
  "krosivky-butterfly-vilata": {
    name: { ua: "Кросівки Butterfly Lezoline Vilata", ru: "Кроссовки Butterfly Lezoline Vilata" },
    description: {
      ua: "Кросівки Butterfly Lezoline Vilata — легка модель із ширшою колодкою для широкої стопи й високого підйому. Чіпка підошва, верх із сітки. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Vilata — лёгкая модель с широкой колодкой для широкой стопы и высокого подъёма. Цепкая подошва, верх из сетки. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-vilight", "Lezoline Vilight — стандартна колодка", "Lezoline Vilight — стандартная колодка"), ...L_SHOES],
  },
  "krosivky-butterfly-mach": {
    name: { ua: "Кросівки Butterfly Lezoline Mach", ru: "Кроссовки Butterfly Lezoline Mach" },
    description: {
      ua: "Кросівки Butterfly Lezoline Mach — легка й гнучка модель для топ-гравців: амортизація B-Absorber, підошва Wingrip, B-Ridge і B-Shank. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Mach — лёгкая и гибкая модель для топ-игроков: амортизация B-Absorber, подошва Wingrip, B-Ridge и B-Shank. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-levalis", "Lezoline Levalis — флагман", "Lezoline Levalis — флагман"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-zero": {
    description: {
      ua: "Кросівки Butterfly Lezoline Zero — легкі й гнучкі, з чіпкою підошвою та сітчастим верхом, що тримає стопу сухою. Для гравців легкої й середньої ваги.",
      ru: "Кроссовки Butterfly Lezoline Zero — лёгкие и гибкие, с цепкой подошвой и сетчатым верхом, который держит стопу сухой. Для игроков лёгкого и среднего веса.",
    },
    links: [shoe("krosivky-butterfly-lezoline-unizes-2", "Lezoline Unizes II", "Lezoline Unizes II"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-unizes-2": {
    name: { ua: "Кросівки Butterfly Lezoline Unizes II", ru: "Кроссовки Butterfly Lezoline Unizes II" },
    description: {
      ua: "Кросівки Butterfly Lezoline Unizes II — універсальна модель для перших тенісних кросівок: зчеплення, амортизація п'яти EVA, дихаючий сітчастий верх.",
      ru: "Кроссовки Butterfly Lezoline Unizes II — универсальная модель для первых теннисных кроссовок: сцепление, амортизация пятки EVA, дышащий сетчатый верх.",
    },
    links: [shoe("krosivky-butterfly-lezoline-unizes", "Lezoline Unizes (перша версія)", "Lezoline Unizes (первая версия)"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-unizes": {
    description: {
      ua: "Кросівки Butterfly Lezoline Unizes — легкі, з дихаючим сітчастим верхом і щільною амортизацією пʼяти EVA. Стабільність для гравців середньої ваги.",
      ru: "Кроссовки Butterfly Lezoline Unizes — лёгкие, с дышащим сетчатым верхом и плотной амортизацией пятки EVA. Стабильность для игроков среднего веса.",
    },
    links: [shoe("krosivky-butterfly-lezoline-unizes-2", "Lezoline Unizes II — новіша версія", "Lezoline Unizes II — новая версия"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-rifones": {
    description: {
      ua: "Кросівки Butterfly Lezoline Rifones — модель для гри високого рівня: B-Armor, B-Absorber, Wingrip, B-Ridge, B-Shank і односторонній язик. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Rifones — модель для игры высокого уровня: B-Armor, B-Absorber, Wingrip, B-Ridge, B-Shank и односторонний язык. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-nine", "Lezoline Nine", "Lezoline Nine"), shoe("krosivky-butterfly-lezoline-levalis", "Lezoline Levalis", "Lezoline Levalis"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-nine": {
    description: {
      ua: "Кросівки Butterfly Lezoline Nine — топ-модель серії: B-Shank, B-Armor, B-Absorber, зносостійка чіпка підошва Wingrip і легкий сітчастий верх. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Nine — топ-модель серии: B-Shank, B-Armor, B-Absorber, цепкая подошва Wingrip и лёгкий сетчатый верх. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-rifones", "Lezoline Rifones", "Lezoline Rifones"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-levalis": {
    description: {
      ua: "Кросівки Butterfly Lezoline Levalis — флагман серії: верх як шкарпетка, високий задник для фіксації щиколотки, B-Absorber, Wingrip, B-Ridge, B-Shank.",
      ru: "Кроссовки Butterfly Lezoline Levalis — флагман серии: верх как носок, высокий задник для фиксации щиколотки, B-Absorber, Wingrip, B-Ridge, B-Shank.",
    },
    links: [shoe("krosivky-butterfly-lezoline-rifones", "Lezoline Rifones", "Lezoline Rifones"), shoe("krosivky-butterfly-mach", "Lezoline Mach", "Lezoline Mach"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-groovy-rozhevi": {
    description: {
      ua: "Кросівки Butterfly Lezoline Groovy (рожеві) — для топ-гравців: тонка проміжна підошва з відчуттям босої ноги й підметка, що не дає ковзати вбік.",
      ru: "Кроссовки Butterfly Lezoline Groovy (розовые) — для топ-игроков: тонкая промежуточная подошва с ощущением босой ноги и подмётка, что не даёт скользить вбок.",
    },
    links: [shoe("krosivky-butterfly-lezoline-gigu", "Lezoline Gigu — найтовща підошва", "Lezoline Gigu — самая толстая подошва"), ...L_SHOES],
  },
  "krosivky-butterfly-lezoline-gigu": {
    description: {
      ua: "Кросівки Butterfly Lezoline Gigu — найтовща підошва в серії Lezoline: амортизація B-Absorber, підошва Wingrip, захист B-Shank, стійкий до стирання низ.",
      ru: "Кроссовки Butterfly Lezoline Gigu — самая толстая подошва в серии Lezoline: амортизация B-Absorber, подошва Wingrip, защита B-Shank, стойкий к истиранию низ.",
    },
    links: [shoe("krosivky-butterfly-lezoline-groovy-rozhevi", "Lezoline Groovy — тонка підошва", "Lezoline Groovy — тонкая подошва"), ...L_SHOES],
  },

  /* =========================== Мʼячі =========================== */
  "m-iachi-butterfly-training-ball-40-6sht-v-up": {
    name: { ua: "М'ячі Butterfly Training Ball 40+ (6 шт)", ru: "Мячи Butterfly Training Ball 40+ (6 шт)" },
    description: {
      ua: "Мʼячі Butterfly Training Ball 40+, 6 шт — тренувальний пластиковий мʼяч якістю близький до тризіркового: висока округлість, стабільність і довговічність.",
      ru: "Мячи Butterfly Training Ball 40+, 6 шт — тренировочный мяч по качеству близкий к трёхзвёздочному: высокая округлость, стабильность и долговечность.",
    },
    links: [
      { label: { ua: "Training Ball 40+, 120 шт", ru: "Training Ball 40+, 120 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-training-ball-40-120sht-v-up" },
      ...L_BALLS,
    ],
  },
  "m-iachi-butterfly-training-ball-40-120sht-v-up": {
    name: { ua: "М'ячі Butterfly Training Ball 40+ (120 шт)", ru: "Мячи Butterfly Training Ball 40+ (120 шт)" },
    description: {
      ua: "Мʼячі Butterfly Training Ball 40+, 120 шт — коробка для клубів, багатокулькових тренувань і роботів. Якість, близька до тризіркового мʼяча.",
      ru: "Мячи Butterfly Training Ball 40+, 120 шт — коробка для клубов, многомячевых тренировок и роботов. Качество, близкое к трёхзвёздочному мячу.",
    },
    links: [
      { label: { ua: "Training Ball 40+, 6 шт", ru: "Training Ball 40+, 6 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-training-ball-40-6sht-v-up" },
      ...L_BALLS,
    ],
  },
  "m-iachi-butterfly-r40-3-3sht-v-up": {
    name: { ua: "М'ячі Butterfly R40+ 3* (3 шт)", ru: "Мячи Butterfly R40+ 3* (3 шт)" },
    description: {
      ua: "Мʼячі Butterfly R40+ 3*, 3 шт — тризірковий мʼяч зі схваленням ITTF: висока точність, стабільний відскік і передбачувана траєкторія. Третє покоління.",
      ru: "Мячи Butterfly R40+ 3*, 3 шт — трёхзвёздочный мяч с одобрением ITTF: высокая точность, стабильный отскок и предсказуемая траектория. Третье поколение.",
    },
    links: [
      { label: { ua: "R40+ 3*, 12 шт", ru: "R40+ 3*, 12 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-r40-3-12sht-v-up" },
      ...L_BALLS,
    ],
  },
  "m-iachi-butterfly-r40-3-12sht-v-up": {
    name: { ua: "М'ячі Butterfly R40+ 3* (12 шт)", ru: "Мячи Butterfly R40+ 3* (12 шт)" },
    description: {
      ua: "Мʼячі Butterfly R40+ 3*, 12 шт — тризірковий мʼяч ITTF третього покоління для клубів і турнірів: точність, стабільний відскік, надійна траєкторія.",
      ru: "Мячи Butterfly R40+ 3*, 12 шт — трёхзвёздочный мяч ITTF третьего поколения для клубов и турниров: точность, стабильный отскок, надёжная траектория.",
    },
    links: [
      { label: { ua: "R40+ 3*, 3 шт", ru: "R40+ 3*, 3 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-r40-3-3sht-v-up" },
      ...L_BALLS,
    ],
  },
  "m-iachi-butterfly-easy-ball-40-6-sht": {
    description: {
      ua: "Мʼячі Butterfly Easy Ball 40+, 6 шт — недорогий пластиковий тренувальний мʼяч для аматорської гри, шкільних занять і тренувальних роботів.",
      ru: "Мячи Butterfly Easy Ball 40+, 6 шт — недорогой пластиковый тренировочный мяч для любительской игры, школьных занятий и тренировочных роботов.",
    },
    links: [
      { label: { ua: "Easy Ball 40+, 120 шт", ru: "Easy Ball 40+, 120 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-easy-ball-40-120-sht" },
      { label: { ua: "Training Ball 40+", ru: "Training Ball 40+" }, href: "/butterfly/myachi/m-iachi-butterfly-training-ball-40-6sht-v-up" },
      ...L_BALLS,
    ],
  },
  "m-iachi-butterfly-easy-ball-40-120-sht": {
    description: {
      ua: "Мʼячі Butterfly Easy Ball 40+, 120 шт — велика коробка тренувальних мʼячів для шкіл, секцій, роботів і багатокулькових вправ. Пластик 40+.",
      ru: "Мячи Butterfly Easy Ball 40+, 120 шт — большая коробка тренировочных мячей для школ, секций, роботов и многомячевых упражнений. Пластик 40+.",
    },
    links: [
      { label: { ua: "Easy Ball 40+, 6 шт", ru: "Easy Ball 40+, 6 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-easy-ball-40-6-sht" },
      { label: { ua: "Training Ball 40+, 120 шт", ru: "Training Ball 40+, 120 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-training-ball-40-120sht-v-up" },
      ...L_BALLS,
    ],
  },

  /* =========================== Клей =========================== */
  "klei-butterfly-free-chack-90-ml": {
    name: { ua: "Клей Butterfly Free Chack 90 мл", ru: "Клей Butterfly Free Chack 90 мл" },
    description: {
      ua: "Клей Butterfly Free Chack 90 мл — водний клей без летких розчинників для накладок: міцне зʼєднання й легке зняття. Дозволений правилами ITTF.",
      ru: "Клей Butterfly Free Chack 90 мл — водный клей без летучих растворителей для накладок: прочное соединение и лёгкое снятие. Разрешён правилами ITTF.",
    },
    links: [
      { label: { ua: "FreeChack Pro II", ru: "FreeChack Pro II" }, href: "/butterfly/aksessuary/klei-butterfly-freechack-pro-ii-90ml" },
      ...L_GLUE,
    ],
  },
  "klei-butterfly-freechack-pro-ii-90ml": {
    name: { ua: "Клей Butterfly FreeChack Pro II 90 мл", ru: "Клей Butterfly FreeChack Pro II 90 мл" },
    description: {
      ua: "Клей Butterfly FreeChack Pro II 90 мл — водний латексний клей зі скороченим часом висихання: ракетка готова до гри одразу після збирання.",
      ru: "Клей Butterfly FreeChack Pro II 90 мл — водный латексный клей с сокращённым временем высыхания: ракетка готова к игре сразу после сборки.",
    },
    links: [
      { label: { ua: "Free Chack (класичний)", ru: "Free Chack (классический)" }, href: "/butterfly/aksessuary/klei-butterfly-free-chack-90-ml" },
      ...L_GLUE,
    ],
  },

  /* =========================== Догляд =========================== */
  "vidnovnyk-obertannia-butterfly-spin-refresh": {
    name: { ua: "Очищувач для накладок Butterfly Spin Refresh", ru: "Очиститель для накладок Butterfly Spin Refresh" },
    description: {
      ua: "Butterfly Spin Refresh — пінний очищувач для гладких накладок без газу й органічних розчинників, 150 мл. Знімає бруд і повертає поверхні зчеплення.",
      ru: "Butterfly Spin Refresh — пенный очиститель для гладких накладок без газа и органических растворителей, 150 мл. Снимает грязь и возвращает сцепление.",
    },
    links: [
      { label: { ua: "Губка Rubber Care", ru: "Губка Rubber Care" }, href: "/butterfly/aksessuary/hubka-butterfly-rubber-care" },
      ...L_CARE,
    ],
  },
  "ochyshchuvach-dlia-nakladok-butterfly-cure-water": {
    description: {
      ua: "Butterfly Cure Water — очищувач-спрей для накладок на основі очищеної іонізованої води, без органічних розчинників. 150 мл, для гладких накладок і шипів.",
      ru: "Butterfly Cure Water — очиститель-спрей для накладок на основе очищенной ионизированной воды, без органических растворителей. 150 мл, для гладких и шипов.",
    },
    links: [
      { label: { ua: "Spin Refresh", ru: "Spin Refresh" }, href: "/butterfly/aksessuary/vidnovnyk-obertannia-butterfly-spin-refresh" },
      ...L_CARE,
    ],
  },
  "ochyshchuvach-dlia-nakladok-butterfly-rubber-cleaner": {
    description: {
      ua: "Butterfly Rubber Cleaner — рідкий очищувач для накладок: знімає бруд, пил і жир, допомагає зберегти зчеплення поверхні й продовжує життя накладки.",
      ru: "Butterfly Rubber Cleaner — жидкий очиститель для накладок: снимает грязь, пыль и жир, помогает сохранить сцепление поверхности и продлевает жизнь накладки.",
    },
    links: [
      { label: { ua: "Губка Rubber Care", ru: "Губка Rubber Care" }, href: "/butterfly/aksessuary/hubka-butterfly-rubber-care" },
      ...L_CARE,
    ],
  },
  "ochyshchuvach-dlia-stolu-butterfly-table-cleaner": {
    description: {
      ua: "Butterfly Table Cleaner — спрей для ігрової поверхні тенісного столу, 500 мл: знімає пил, піт, бруд, жир і відбитки пальців. Без летких розчинників.",
      ru: "Butterfly Table Cleaner — спрей для игровой поверхности теннисного стола, 500 мл: снимает пыль, пот, грязь, жир и отпечатки. Без летучих растворителей.",
    },
    links: [
      { label: { ua: "Тенісні столи", ru: "Теннисные столы" }, href: "/stoly" },
      { label: { ua: "Сітки для столу", ru: "Сетки для стола" }, href: "/setki" },
      ...L_CARE,
    ],
  },
  "hubka-butterfly-rubber-care": {
    description: {
      ua: "Губка Butterfly Rubber Care — для чищення гладких накладок: поєднує тверду й мʼяку губки. Виробництво Японія. Працює в парі з очищувачами Butterfly.",
      ru: "Губка Butterfly Rubber Care — для чистки гладких накладок: сочетает жёсткую и мягкую губки. Производство Япония. Работает в паре с очистителями Butterfly.",
    },
    links: [
      { label: { ua: "Spin Refresh", ru: "Spin Refresh" }, href: "/butterfly/aksessuary/vidnovnyk-obertannia-butterfly-spin-refresh" },
      ...L_CARE,
    ],
  },

  /* =========================== Торцеві стрічки =========================== */
  "tortseva-strichka-butterfly-logo-12mm-1m": {
    name: { ua: "Торцева стрічка Butterfly Logo 12 мм × 1 м", ru: "Торцевая лента Butterfly Logo 12 мм × 1 м" },
    description: {
      ua: "Торцева стрічка Butterfly Logo 12 мм × 1 м — на одну ракетку: захищає торець основи від сколів і закриває краї накладок. Ширина 12 мм.",
      ru: "Торцевая лента Butterfly Logo 12 мм × 1 м — на одну ракетку: защищает торец основания от сколов и закрывает края накладок. Ширина 12 мм.",
    },
    links: [
      { label: { ua: "Рулон Logo 12 мм × 10 м", ru: "Рулон Logo 12 мм × 10 м" }, href: "/butterfly/aksessuary/tortseva-strichka-butterfly-logo-12mm-10m" },
      ...L_TAPE,
    ],
  },
  "tortseva-strichka-butterfly-logo-12mm-10m": {
    name: { ua: "Торцева стрічка Butterfly Logo 12 мм × 10 м", ru: "Торцевая лента Butterfly Logo 12 мм × 10 м" },
    description: {
      ua: "Торцева стрічка Butterfly Logo 12 мм × 10 м — рулон для частих переклеювань і кількох ракеток: захист торця основи й країв накладок.",
      ru: "Торцевая лента Butterfly Logo 12 мм × 10 м — рулон для частых переклеек и нескольких ракеток: защита торца основания и краёв накладок.",
    },
    links: [
      { label: { ua: "Рулон Logo 12 мм × 50 м", ru: "Рулон Logo 12 мм × 50 м" }, href: "/butterfly/aksessuary/tortseva-strichka-butterfly-logo-12mm-50m" },
      ...L_TAPE,
    ],
  },
  "tortseva-strichka-butterfly-logo-12mm-50m": {
    name: { ua: "Торцева стрічка Butterfly Logo 12 мм × 50 м", ru: "Торцевая лента Butterfly Logo 12 мм × 50 м" },
    description: {
      ua: "Торцева стрічка Butterfly Logo 12 мм × 50 м — клубний рулон для майстерні й секції: стрічка під рукою для кожного збирання ракетки.",
      ru: "Торцевая лента Butterfly Logo 12 мм × 50 м — клубный рулон для мастерской и секции: лента под рукой для каждой сборки ракетки.",
    },
    links: [
      { label: { ua: "Logo 12 мм × 1 м", ru: "Logo 12 мм × 1 м" }, href: "/butterfly/aksessuary/tortseva-strichka-butterfly-logo-12mm-1m" },
      ...L_TAPE,
    ],
  },
  "tortseva-strichka-butterfly-logo-6mm-10m": {
    name: { ua: "Торцева стрічка Butterfly Logo 6 мм × 10 м", ru: "Торцевая лента Butterfly Logo 6 мм × 10 м" },
    description: {
      ua: "Торцева стрічка Butterfly Logo 6 мм × 10 м — вузька стрічка для захисту торця основи: менше ваги на голові ракетки. Рулон 10 м.",
      ru: "Торцевая лента Butterfly Logo 6 мм × 10 м — узкая лента для защиты торца основания: меньше веса на голове ракетки. Рулон 10 м.",
    },
    links: [
      { label: { ua: "Logo 12 мм × 10 м", ru: "Logo 12 мм × 10 м" }, href: "/butterfly/aksessuary/tortseva-strichka-butterfly-logo-12mm-10m" },
      ...L_TAPE,
    ],
  },
  "tortseva-strichka-butterfly-dignics": {
    description: {
      ua: "Торцева стрічка Butterfly Dignics — захисна стрічка для ракетки в дизайні серії Dignics: бере на себе удари об стіл і закриває краї накладок.",
      ru: "Торцевая лента Butterfly Dignics — защитная лента для ракетки в дизайне серии Dignics: принимает удары о стол и закрывает края накладок.",
    },
    links: [
      { label: { ua: "Накладки Dignics", ru: "Накладки Dignics" }, href: "/nakladki/dignics" },
      { label: { ua: "Стрічка Glayzer", ru: "Лента Glayzer" }, href: "/butterfly/aksessuary/tortseva-strichka-butterfly-glayzer" },
      ...L_TAPE,
    ],
  },
  "tortseva-strichka-butterfly-glayzer": {
    description: {
      ua: "Торцева стрічка Butterfly Glayzer — захисна стрічка для ракетки в дизайні серії Glayzer: захищає торець основи від сколів і тримає краї накладок.",
      ru: "Торцевая лента Butterfly Glayzer — защитная лента для ракетки в дизайне серии Glayzer: защищает торец основания от сколов и держит края накладок.",
    },
    links: [
      { label: { ua: "Накладка Glayzer", ru: "Накладка Glayzer" }, href: "/butterfly/nakladki/glayzer" },
      { label: { ua: "Стрічка Dignics", ru: "Лента Dignics" }, href: "/butterfly/aksessuary/tortseva-strichka-butterfly-dignics" },
      ...L_TAPE,
    ],
  },

  /* =========================== Сітки =========================== */
  "sitka-butterfly-europa": {
    description: {
      ua: "Сітка Butterfly Europa — схвалений ITTF металевий комплект із великими гвинтами-ручками для надійного кріплення. Чорна текстильна сітка.",
      ru: "Сетка Butterfly Europa — одобренный ITTF металлический комплект с большими винтами-ручками для надёжного крепления. Чёрная текстильная сетка.",
    },
    links: [
      { label: { ua: "Сітка National League", ru: "Сетка National League" }, href: "/butterfly/setki/sitka-butterfly-national-league" },
      ...L_NETS,
    ],
  },
  "sitka-butterfly-elite-clip": {
    description: {
      ua: "Сітка Butterfly Elite Clip — доступний металевий комплект із пружинним затискачем: ставиться й знімається за секунди. Чорна текстильна сітка.",
      ru: "Сетка Butterfly Elite Clip — доступный металлический комплект с пружинным зажимом: ставится и снимается за секунды. Чёрная текстильная сетка.",
    },
    links: [
      { label: { ua: "Сітка Europa (ITTF)", ru: "Сетка Europa (ITTF)" }, href: "/butterfly/setki/sitka-butterfly-europa" },
      ...L_NETS,
    ],
  },
  "sitka-butterfly-national-league": {
    description: {
      ua: "Сітка Butterfly National League — металеві стійки з гвинтовим затискачем і гумовими накладками, натяжник і регулювання висоти. Для матчів і клубів.",
      ru: "Сетка Butterfly National League — металлические стойки с винтовым зажимом и резиновыми накладками, натяжитель и регулировка высоты. Для матчей и клубов.",
    },
    links: [
      { label: { ua: "Сітка Europa", ru: "Сетка Europa" }, href: "/butterfly/setki/sitka-butterfly-europa" },
      ...L_NETS,
    ],
  },

  /* =========================== Сумки, рюкзаки, чохли, рушники (партія 2) =========================== */
  "sumka-butterfly-kitami-sportbag": {
    description: {
      ua: "Сумка Butterfly Kitami SportBag — 59 л, 60 × 31 × 32 см, поліестер 900D: дві бічні й передня кишені, мішок для мокрих речей. Для тренувань і турнірів.",
      ru: "Сумка Butterfly Kitami SportBag — 59 л, 60 × 31 × 32 см, полиэстер 900D: два боковых и передний карман, мешок для мокрых вещей. Для тренировок и турниров.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-kitami-midi": {
    description: {
      ua: "Сумка Butterfly Kitami Midi — 36 л, 50 × 36 × 20 см, поліестер 900D. Компактна сумка на тренування: чохол, рушник, форма, взуття й аксесуари.",
      ru: "Сумка Butterfly Kitami Midi — 36 л, 50 × 36 × 20 см, полиэстер 900D. Компактная сумка на тренировку: чехол, полотенце, форма, обувь и аксессуары.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-kashiwa-sportbag": {
    description: {
      ua: "Сумка Butterfly Kashiwa SportBag — 60 л, 70 × 31 × 26 см, щільний поліестер 1680D: багато кишень, мішок для білизни чи взуття. Для турнірів.",
      ru: "Сумка Butterfly Kashiwa SportBag — 60 л, 70 × 31 × 26 см, плотный полиэстер 1680D: много карманов, мешок для белья или обуви. Для турниров.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-kashiwa-midi": {
    description: {
      ua: "Сумка Butterfly Kashiwa Midi — 49 л, 57 × 26 × 28 см, поліестер 1680D: металеві блискавки, зовнішня кишеня, мішок для взуття й мокрого одягу.",
      ru: "Сумка Butterfly Kashiwa Midi — 49 л, 57 × 26 × 28 см, полиэстер 1680D: металлические молнии, внешний карман, мешок для обуви и мокрой одежды.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-tokai-midi": {
    description: {
      ua: "Сумка Butterfly Tokai Midi — 38 л, 50 × 30 × 25 см, поліестер 900D. Сумка на щоденні тренування: місце для чохла, рушника, форми й взуття.",
      ru: "Сумка Butterfly Tokai Midi — 38 л, 50 × 30 × 25 см, полиэстер 900D. Сумка на ежедневные тренировки: место для чехла, полотенца, формы и обуви.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-black-line-maxibag": {
    description: {
      ua: "Сумка Butterfly Black Line Maxibag — 100 л на колесах із висувною ручкою й захищеним нижнім відділенням. Для поїздок і довгих турнірів.",
      ru: "Сумка Butterfly Black Line Maxibag — 100 л на колёсах с выдвижной ручкой и защищённым нижним отделением. Для поездок и долгих турниров.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-yasyo-maxi-bag": {
    description: {
      ua: "Сумка Butterfly Yasyo Maxi Bag на колесах із телескопічною ручкою: велике основне й окреме нижнє відділення, близько 80 × 39 × 39 см.",
      ru: "Сумка Butterfly Yasyo Maxi Bag на колёсах с телескопической ручкой: большое основное и отдельное нижнее отделение, около 80 × 39 × 39 см.",
    },
    links: L_BAGS,
  },
  "valiza-butterfly-tabi": {
    description: {
      ua: "Валіза Butterfly Tabi — твердий корпус, 4 поворотні колеса, замок TSA, розмір ручної поклажі 49 × 36 × 23 см. Для перельотів на турніри.",
      ru: "Чемодан Butterfly Tabi — жёсткий корпус, 4 поворотных колеса, замок TSA, размер ручной клади 49 × 36 × 23 см. Для перелётов на турниры.",
    },
    links: L_BAGS,
  },
  "riukzak-butterfly-kitami": {
    description: {
      ua: "Рюкзак Butterfly Kitami — 25 л, 48 × 34 × 16 см, поліестер 900D: відділення, зовнішні кишені, регульовані лямки. Для тренувань і поїздок.",
      ru: "Рюкзак Butterfly Kitami — 25 л, 48 × 34 × 16 см, полиэстер 900D: отделения, внешние карманы, регулируемые лямки. Для тренировок и поездок.",
    },
    links: L_PACKS,
  },
  "riukzak-butterfly-tokai": {
    description: {
      ua: "Рюкзак Butterfly Tokai — 25 л, 48 × 32 × 16 см, поліестер 900D: практичні відділення, зовнішні кишені, регульовані лямки й ручка.",
      ru: "Рюкзак Butterfly Tokai — 25 л, 48 × 32 × 16 см, полиэстер 900D: практичные отделения, внешние карманы, регулируемые лямки и ручка.",
    },
    links: L_PACKS,
  },
  "riukzak-butterfly-kashiwa": {
    description: {
      ua: "Рюкзак Butterfly Kashiwa — 35 л, 48 × 32 × 16 см, поліестер 1680D: відділення з перегородками, металеві блискавки, регульовані лямки.",
      ru: "Рюкзак Butterfly Kashiwa — 35 л, 48 × 32 × 16 см, полиэстер 1680D: отделение с перегородками, металлические молнии, регулируемые лямки.",
    },
    links: L_PACKS,
  },
  "riukzak-butterfly-sendai-rolltop": {
    description: {
      ua: "Рюкзак Butterfly Sendai Rolltop — курʼєрське закривання roll-top, поліестер 420D, 38 × 57 × 13 см, внутрішні відділення. Для залу й міста.",
      ru: "Рюкзак Butterfly Sendai Rolltop — курьерское закрытие roll-top, полиэстер 420D, 38 × 57 × 13 см, внутренние отделения. Для зала и города.",
    },
    links: L_PACKS,
  },
  "odynarnyi-chokhol-butterfly-kitami": {
    description: {
      ua: "Одинарний чохол Butterfly Kitami — поліестер 1680D, 30 × 4 × 21 см, захист від зламу, металева блискавка й ручка. Для однієї ракетки.",
      ru: "Одинарный чехол Butterfly Kitami — полиэстер 1680D, 30 × 4 × 21 см, защита от излома, металлическая молния и ручка. Для одной ракетки.",
    },
    links: L_CASES,
  },
  "podviinyi-chokhol-butterfly-kitami": {
    description: {
      ua: "Подвійний чохол Butterfly Kitami — два відділення для двох ракеток і аксесуарів, захист від зламу, металеві блискавки, 1680D, 30 × 7 × 21 см.",
      ru: "Двойной чехол Butterfly Kitami — два отделения для двух ракеток и аксессуаров, защита от излома, металлические молнии, 1680D, 30 × 7 × 21 см.",
    },
    links: L_CASES,
  },
  "odynarnyi-chokhol-butterfly-kashiwa": {
    description: {
      ua: "Одинарний чохол Butterfly Kashiwa для однієї ракетки: захист від зламу, міцні металеві блискавки й ручка. Пасує до сумок Kashiwa.",
      ru: "Одинарный чехол Butterfly Kashiwa для одной ракетки: защита от излома, прочные металлические молнии и ручка. Подходит к сумкам Kashiwa.",
    },
    links: L_CASES,
  },
  "podviinyi-chokhol-butterfly-kashiwa": {
    description: {
      ua: "Подвійний чохол Butterfly Kashiwa — два окремі відділення для двох ракеток і аксесуарів, захист від зламу, металеві блискавки й ручка.",
      ru: "Двойной чехол Butterfly Kashiwa — два отдельных отделения для двух ракеток и аксессуаров, защита от излома, металлические молнии и ручка.",
    },
    links: L_CASES,
  },
  "chokhol-butterfly-easy-case": {
    description: {
      ua: "Чохол Butterfly Easy Case для ракетки з окремим відділенням для мʼячів, поліестер 900D. Ракетка й мʼячі завжди разом і в безпеці.",
      ru: "Чехол Butterfly Easy Case для ракетки с отдельным отделением для мячей, полиэстер 900D. Ракетка и мячи всегда вместе и в безопасности.",
    },
    links: L_CASES,
  },
  "odynarnyi-chokhol-butterfly-logo-2019": {
    description: {
      ua: "Одинарний чохол Butterfly Logo 2019 для однієї ракетки — плаский прямокутний, простий захист накладок від пилу й подряпин у сумці.",
      ru: "Одинарный чехол Butterfly Logo 2019 для одной ракетки — плоский прямоугольный, простая защита накладок от пыли и царапин в сумке.",
    },
    links: L_CASES,
  },
  "odynarnyi-chokhol-butterfly-logo-2019-oval": {
    description: {
      ua: "Круглий чохол Butterfly Logo 2019 за формою ракетки — компактний захист однієї ракетки від пилу й подряпин за доступною ціною.",
      ru: "Круглый чехол Butterfly Logo 2019 по форме ракетки — компактная защита одной ракетки от пыли и царапин по доступной цене.",
    },
    links: L_CASES,
  },
  "podviinyi-chokhol-butterfly-logo-2019": {
    description: {
      ua: "Чохол Butterfly Logo 2019 для ракетки з додатковим відділенням для аксесуарів — мʼячів, захисної плівки, торцевої стрічки.",
      ru: "Чехол Butterfly Logo 2019 для ракетки с дополнительным отделением для аксессуаров — мячей, защитной плёнки, торцевой ленты.",
    },
    links: L_CASES,
  },
  "rushnyk-butterfly-taoru": {
    description: {
      ua: "Рушник Butterfly Taoru — 100% бавовна, 50 × 100 см: ігровий формат, щоб витиратися в паузах біля корту. Є велика версія Big Taoru.",
      ru: "Полотенце Butterfly Taoru — 100% хлопок, 50 × 100 см: игровой формат, чтобы вытираться в паузах у корта. Есть большая версия Big Taoru.",
    },
    links: L_TOWELS,
  },
  "rushnyk-butterfly-big-taoru": {
    description: {
      ua: "Рушник Butterfly Big Taoru — великий, 70 × 140 см, 100% бавовна. Для душу після тренування; пара до ігрового рушника Taoru.",
      ru: "Полотенце Butterfly Big Taoru — большое, 70 × 140 см, 100% хлопок. Для душа после тренировки; пара к игровому полотенцу Taoru.",
    },
    links: L_TOWELS,
  },
  "rushnyk-butterfly-handa": {
    description: {
      ua: "Рушник Butterfly Handa — 100% бавовна, 50 × 100 см. Ігровий формат для корту й сумки, щоб витиратися в паузах, дозволених правилами.",
      ru: "Полотенце Butterfly Handa — 100% хлопок, 50 × 100 см. Игровой формат для корта и сумки, чтобы вытираться в паузах, разрешённых правилами.",
    },
    links: L_TOWELS,
  },
  "rushnyk-butterfly-dignics": {
    description: {
      ua: "Рушник Butterfly Dignics у фірмовому дизайні серії — 100% бавовна, 50 × 100 см. Для гравців на Dignics і як подарунок тенісисту.",
      ru: "Полотенце Butterfly Dignics в фирменном дизайне серии — 100% хлопок, 50 × 100 см. Для игроков на Dignics и как подарок теннисисту.",
    },
    links: L_TOWELS,
  },
  "rushnyk-butterfly-borussia": {
    description: {
      ua: "Рушник Butterfly Borussia у дизайні клубу — 100% бавовна, 50 × 100 см. Ігровий формат для корту, а ще подарунок уболівальнику.",
      ru: "Полотенце Butterfly Borussia в дизайне клуба — 100% хлопок, 50 × 100 см. Игровой формат для корта, а ещё подарок болельщику.",
    },
    links: L_TOWELS,
  },

  /* =========================== Партія 3: Otomo, Kanoy, Kaban, Yasyo, Sendai, кейси, рушники =========================== */
  "sumka-butterfly-otomo-sportbag": {
    description: {
      ua: "Сумка Butterfly Otomo SportBag — 60 л, 60 × 31 × 32 см: кілька відділень, внутрішній мішок для мокрого, повністю розкривається. Для турнірів.",
      ru: "Сумка Butterfly Otomo SportBag — 60 л, 60 × 31 × 32 см: несколько отделений, внутренний мешок для мокрого, полностью раскрывается. Для турниров.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-otomo-midi": {
    description: {
      ua: "Сумка Butterfly Otomo Midi — 40 л, 50 × 36 × 20 см: відділення з роздільниками, мішок для мокрого, знімний плечовий ремінь. На тренування.",
      ru: "Сумка Butterfly Otomo Midi — 40 л, 50 × 36 × 20 см: отделения с разделителями, мешок для мокрого, съёмный плечевой ремень. На тренировку.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-sportbag-wheels": {
    name: { ua: "Сумка Butterfly Otomo на колесах", ru: "Сумка Butterfly Otomo на колёсах" },
    description: {
      ua: "Сумка Butterfly Otomo на колесах — 70 л, 70 × 31 × 32 см: два основні відділення, мішок для мокрого, торцеві кишені. Для турнірів і виїздів.",
      ru: "Сумка Butterfly Otomo на колёсах — 70 л, 70 × 31 × 32 см: два основных отделения, мешок для мокрого, торцевые карманы. Для турниров и выездов.",
    },
    links: L_BAGS,
  },
  "riukzak-butterfly-otomo": {
    description: {
      ua: "Рюкзак Butterfly Otomo — 35 л: окремі відділення, зовнішні кишені й повністю регульовані лямки. Міцний рюкзак у спортивному дизайні.",
      ru: "Рюкзак Butterfly Otomo — 35 л: отдельные отделения, внешние карманы и полностью регулируемые лямки. Прочный рюкзак в спортивном дизайне.",
    },
    links: L_PACKS,
  },
  "odynarnyi-chokhol-butterfly-otomo": {
    description: {
      ua: "Одинарний чохол Butterfly Otomo — захищає ракетку від зламу й пошкоджень, ремінь для перенесення, чистий спортивний дизайн колекції Otomo.",
      ru: "Одинарный чехол Butterfly Otomo — защищает ракетку от излома и повреждений, ремень для переноски, чистый спортивный дизайн коллекции Otomo.",
    },
    links: L_CASES,
  },
  "podviinyi-chokhol-butterfly-otomo": {
    description: {
      ua: "Подвійний чохол Butterfly Otomo — два окремі відділення для ракеток і аксесуарів, захист від зламу в обох, ремінь для перенесення.",
      ru: "Двойной чехол Butterfly Otomo — два отдельных отделения для ракеток и аксессуаров, защита от излома в обоих, ремень для переноски.",
    },
    links: L_CASES,
  },
  "sumka-butterfly-kanoy-sportbag": {
    description: {
      ua: "Сумка Butterfly Kanoy SportBag — дуже велике основне відділення, кишені всередині й зовні, регульовані ремені й мішок для взуття та форми.",
      ru: "Сумка Butterfly Kanoy SportBag — очень большое основное отделение, карманы внутри и снаружи, регулируемые ремни и мешок для обуви и формы.",
    },
    links: L_BAGS,
  },
  "sumka-riukzak-butterfly-kanoy": {
    name: { ua: "Сумка Butterfly Kanoy Duffle", ru: "Сумка Butterfly Kanoy Duffle" },
    description: {
      ua: "Сумка Butterfly Kanoy Duffle — 40 л для основної форми й аксесуарів: металева блискавка, регульовані ремені, знімний мішок для взуття.",
      ru: "Сумка Butterfly Kanoy Duffle — 40 л для основной формы и аксессуаров: металлическая молния, регулируемые ремни, съёмный мешок для обуви.",
    },
    links: L_BAGS,
  },
  "riukzak-butterfly-kanoy": {
    description: {
      ua: "Рюкзак Butterfly Kanoy для основного спорядження — кілька зовнішніх кишень, металева блискавка й зручні лямки. На щоденні тренування.",
      ru: "Рюкзак Butterfly Kanoy для основного снаряжения — несколько внешних карманов, металлическая молния и удобные лямки. На ежедневные тренировки.",
    },
    links: L_PACKS,
  },
  "odynarnyi-chokhol-butterfly-kanoy": {
    description: {
      ua: "Одинарний чохол Butterfly Kanoy — протектор від зламу, металеві блискавки й петля для перенесення. Надійний захист однієї ракетки.",
      ru: "Одинарный чехол Butterfly Kanoy — протектор от излома, металлические молнии и петля для переноски. Надёжная защита одной ракетки.",
    },
    links: L_CASES,
  },
  "podviinyi-chokhol-butterfly-kanoy": {
    description: {
      ua: "Подвійний чохол Butterfly Kanoy — два відділення для двох ракеток і аксесуарів, протектор від зламу, металеві блискавки й петля.",
      ru: "Двойной чехол Butterfly Kanoy — два отделения для двух ракеток и аксессуаров, протектор от излома, металлические молнии и петля.",
    },
    links: L_CASES,
  },
  "sumka-butterfly-kaban-sportbag": {
    description: {
      ua: "Сумка Butterfly Kaban SportBag — 80 л, 70 × 31 × 32 см: дві торцеві кишені й велике відділення. Для щоденних тренувань і багатоденних турнірів.",
      ru: "Сумка Butterfly Kaban SportBag — 80 л, 70 × 31 × 32 см: два торцевых кармана и большое отделение. Для ежедневных тренировок и многодневных турниров.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-kaban-midi": {
    description: {
      ua: "Сумка Butterfly Kaban Midi — 37 л, 55 × 25 × 28 см: вміщує взуття, чохол із ракеткою, рушник, одяг і пляшку води. Сумка на тренування.",
      ru: "Сумка Butterfly Kaban Midi — 37 л, 55 × 25 × 28 см: вмещает обувь, чехол с ракеткой, полотенце, одежду и бутылку воды. Сумка на тренировку.",
    },
    links: L_BAGS,
  },
  "chokhol-odynarnyi-butterfly-kaban": {
    description: {
      ua: "Одинарний чохол Butterfly Kaban — просторий, із протектором від зламу й петлею для перенесення. Пасує до сумок колекції Kaban.",
      ru: "Одинарный чехол Butterfly Kaban — просторный, с протектором от излома и петлёй для переноски. Подходит к сумкам коллекции Kaban.",
    },
    links: L_CASES,
  },
  "chokhol-podviinyi-butterfly-kaban": {
    description: {
      ua: "Подвійний чохол Butterfly Kaban — просторий, на дві ракетки, з протектором, кишенею для аксесуарів і петлею для перенесення.",
      ru: "Двойной чехол Butterfly Kaban — просторный, на две ракетки, с протектором, карманом для аксессуаров и петлёй для переноски.",
    },
    links: L_CASES,
  },
  "sumka-butterfly-yasyo-sportbag": {
    description: {
      ua: "Сумка Butterfly Yasyo SportBag — 70 × 31 × 32 см: відділення всередині й зовні для всього тенісного, металеві блискавки, регульовані ремені.",
      ru: "Сумка Butterfly Yasyo SportBag — 70 × 31 × 32 см: отделения внутри и снаружи для всего теннисного, металлические молнии, регулируемые ремни.",
    },
    links: L_BAGS,
  },
  "sumka-butterfly-yasyo-midi": {
    description: {
      ua: "Сумка Butterfly Yasyo Midi — 35 л, 55 × 25 × 28 см: просторе відділення для взуття, чохла й рушників, зовнішні кишені, регульовані ремені.",
      ru: "Сумка Butterfly Yasyo Midi — 35 л, 55 × 25 × 28 см: просторное отделение для обуви, чехла и полотенец, внешние карманы, регулируемые ремни.",
    },
    links: L_BAGS,
  },
  "valiza-butterfly-yasyo-trolley": {
    description: {
      ua: "Сумка Butterfly Yasyo Trolley — 40 л на колесах у форматі ручної поклажі, 55 × 36 × 20 см: велике відділення, зовнішні кишені, висувна ручка.",
      ru: "Сумка Butterfly Yasyo Trolley — 40 л на колёсах в формате ручной клади, 55 × 36 × 20 см: большое отделение, внешние карманы, выдвижная ручка.",
    },
    links: L_BAGS,
  },
  "riukzak-butterfly-yasyo": {
    description: {
      ua: "Рюкзак Butterfly Yasyo — 34 л, 45 × 36 × 26 см, з окремим відділенням для взуття внизу, просторими відділеннями й зручними лямками.",
      ru: "Рюкзак Butterfly Yasyo — 34 л, 45 × 36 × 26 см, с отдельным отделением для обуви внизу, просторными отделениями и удобными лямками.",
    },
    links: L_PACKS,
  },
  "chokhol-odynarnyi-butterfly-yasyo": {
    description: {
      ua: "Одинарний чохол Butterfly Yasyo — міцний поліестер, протектор від зламу, металева блискавка й петля, 30 × 4 × 21 см. Для однієї ракетки.",
      ru: "Одинарный чехол Butterfly Yasyo — прочный полиэстер, протектор от излома, металлическая молния и петля, 30 × 4 × 21 см. Для одной ракетки.",
    },
    links: L_CASES,
  },
  "chokhol-podviinyi-butterfly-yasyo": {
    description: {
      ua: "Подвійний чохол Butterfly Yasyo — просторий, на дві ракетки: протектор від зламу, металева блискавка, петля, 30 × 7 × 21 см.",
      ru: "Двойной чехол Butterfly Yasyo — просторный, на две ракетки: протектор от излома, металлическая молния, петля, 30 × 7 × 21 см.",
    },
    links: L_CASES,
  },
  "sumka-butterfly-sendai-dufflebag": {
    description: {
      ua: "Сумка Butterfly Sendai Duffle — 39 л, 50 × 28 × 28 см: дві торцеві кишені на блискавці, а порожню сумку легко скласти для зберігання.",
      ru: "Сумка Butterfly Sendai Duffle — 39 л, 50 × 28 × 28 см: два торцевых кармана на молнии, а пустую сумку легко сложить для хранения.",
    },
    links: L_BAGS,
  },
  "chokhol-butterfly-full-hard-case": {
    description: {
      ua: "Твердий чохол Butterfly Full Hard Case — повний захист однієї ракетки від ударів і стискання, посилений поліестер. Для щоденного носіння в сумці.",
      ru: "Жёсткий чехол Butterfly Full Hard Case — полная защита одной ракетки от ударов и сдавливания, усиленный полиэстер. Для ежедневной носки в сумке.",
    },
    links: L_CASES,
  },
  "chokhol-keis-butterfly-kibako": {
    description: {
      ua: "Кейс Butterfly Kibako з деревʼяного матеріалу — магнітна застібка, металеві петлі, посилений вкладиш, усередині 27 × 15,8 см. Стиль і захист.",
      ru: "Кейс Butterfly Kibako из деревянного материала — магнитная застёжка, металлические петли, усиленный вкладыш, внутри 27 × 15,8 см. Стиль и защита.",
    },
    links: L_CASES,
  },
  "chokhol-butterfly-1950": {
    description: {
      ua: "Кейс Butterfly 1950 — лімітована серія з натурального корку: водостійкий, із лазерним гравіюванням на кришці, 30 × 5 × 19 см. Ідея подарунка.",
      ru: "Кейс Butterfly 1950 — лимитированная серия из натуральной пробки: водостойкий, с лазерной гравировкой на крышке, 30 × 5 × 19 см. Идея подарка.",
    },
    links: L_CASES,
  },
  "rushnyk-butterfly-streak": {
    description: {
      ua: "Рушник Butterfly Streak з магнітною смужкою — кріпиться до металу, наприклад до краю тенісного столу. 100% бавовна, 50 × 100 см.",
      ru: "Полотенце Butterfly Streak с магнитной полоской — крепится к металлу, например к краю теннисного стола. 100% хлопок, 50 × 100 см.",
    },
    links: L_TOWELS,
  },
  "rushnyk-butterfly-big-streak": {
    description: {
      ua: "Рушник Butterfly Big Streak — великий, 70 × 140 см, 100% бавовна. Для душу після тренування; пара до ігрового рушника Streak з магнітом.",
      ru: "Полотенце Butterfly Big Streak — большое, 70 × 140 см, 100% хлопок. Для душа после тренировки; пара к игровому полотенцу Streak с магнитом.",
    },
    links: L_TOWELS,
  },
  "rushnyk-butterfly-sign": {
    description: {
      ua: "Рушник Butterfly Sign — 100% бавовна, 50 × 100 см. Компактний ігровий формат, щоб витиратися в паузах біля корту й носити в сумці.",
      ru: "Полотенце Butterfly Sign — 100% хлопок, 50 × 100 см. Компактный игровой формат, чтобы вытираться в паузах у корта и носить в сумке.",
    },
    links: L_TOWELS,
  },

  /* =========== Партія 4: взуття, мʼячі, дрібні аксесуари =========== */
  "klei-butterfly-freechack-pro-37ml": {
    name: { ua: "Клей Butterfly Free Chack Pro 37 мл", ru: "Клей Butterfly Free Chack Pro 37 мл" },
    description: {
      ua: "Клей Butterfly Free Chack Pro, 37 мл: еластичніший за Free Chack — довший контакт мʼяча з ракеткою й більше обертання. Затискачі й губки в комплекті.",
      ru: "Клей Butterfly Free Chack Pro, 37 мл: эластичнее Free Chack — дольше контакт мяча с ракеткой и больше вращения. Зажимы и губки в комплекте.",
    },
    links: [{ label: { ua: "FreeChack Pro II", ru: "FreeChack Pro II" }, href: "/butterfly/aksessuary/klei-butterfly-freechack-pro-ii-90ml" }, ...L_GLUE],
  },
  "bavovniana-hubka-butterfly": {
    name: { ua: "Бавовняна губка Butterfly (Cotton Sponge)", ru: "Хлопковая губка Butterfly (Cotton Sponge)" },
    description: {
      ua: "Бавовняна губка Butterfly (Cotton Sponge) для делікатного чищення накладок разом з очищувачами Butterfly — Spin Refresh, Cure Water, Rubber Cleaner.",
      ru: "Хлопковая губка Butterfly (Cotton Sponge) для деликатной чистки накладок вместе с очистителями Butterfly — Spin Refresh, Cure Water, Rubber Cleaner.",
    },
    links: [{ label: { ua: "Spin Refresh — очищувач", ru: "Spin Refresh — очиститель" }, href: "/butterfly/aksessuary/vidnovnyk-obertannia-butterfly-spin-refresh" }, ...L_CARE],
  },
  "tubus-dlia-m-iachiv-butterfly": {
    name: { ua: "Тубус-ролик Butterfly для м'ячів (Roller/Ball Box)", ru: "Тубус-ролик Butterfly для мячей (Roller/Ball Box)" },
    description: {
      ua: "Тубус Butterfly Roller/Ball Box: тверда пластикова туба на 6 мʼячів, що працює й як ролик для прикочування накладки до основи під час поклейки.",
      ru: "Тубус Butterfly Roller/Ball Box: жёсткая пластиковая туба на 6 мячей, работающая и как ролик для прикатывания накладки к основанию при поклейке.",
    },
    links: [{ label: { ua: "Клей для накладок", ru: "Клей для накладок" }, href: "/aksessuary/klei" }, ...L_BALLS],
  },
  "rushnyk-butterfly-germany": {
    description: {
      ua: "Рушник Butterfly Germany: мʼяка тканина добре вбирає вологу, легкий і міцний — для тренувань, ліги й турнірів. Рожево-чорний дизайн з логотипом.",
      ru: "Полотенце Butterfly Germany: мягкая ткань хорошо впитывает влагу, лёгкое и прочное — для тренировок, лиги и турниров. Розово-чёрный дизайн с логотипом.",
    },
    links: L_TOWELS,
  },
  "valiza-butterfly-black-line": {
    name: { ua: "Валіза Butterfly Black Line Trolley", ru: "Чемодан Butterfly Black Line Trolley" },
    description: {
      ua: "Валіза Butterfly Black Line Trolley ≈ 55 × 36 × 20 см для коротких поїздок: просторе відділення, зовнішня кишеня, висувна ручка, міцні колеса.",
      ru: "Чемодан Butterfly Black Line Trolley ≈ 55 × 36 × 20 см для коротких поездок: просторное отделение, внешний карман, выдвижная ручка, прочные колёса.",
    },
    links: [{ label: { ua: "Black Line Maxibag", ru: "Black Line Maxibag" }, href: "/butterfly/chehly/sumka-butterfly-black-line-maxibag" }, ...L_BAGS],
  },
  "m-iachi-butterfly-s40-3-ittf-3-sht-v-up": {
    name: { ua: "М'ячі Butterfly S40+ 3* (3 шт)", ru: "Мячи Butterfly S40+ 3* (3 шт)" },
    description: {
      ua: "Мʼячі Butterfly S40+ 3*, 3 шт — схвалені ITTF, ABS-пластик: шорсткіша поверхня допомагає закрутити мʼяч, рівна округлість дає стабільний відскік.",
      ru: "Мячи Butterfly S40+ 3*, 3 шт — одобрены ITTF, ABS-пластик: шероховатая поверхность помогает закрутить мяч, ровная округлость даёт стабильный отскок.",
    },
    links: [{ label: { ua: "Мʼячі R40+ 3*", ru: "Мячи R40+ 3*" }, href: "/butterfly/myachi/m-iachi-butterfly-r40-3-3sht-v-up" }, ...L_BALLS],
  },
  "pliashka-butterfly-22": {
    name: { ua: "Пляшка Butterfly '22", ru: "Бутылка Butterfly '22" },
    description: {
      ua: "Пляшка Butterfly '22 на 700 мл з біорозкладного пластику на основі рослинного полімеру — екологічна пляшка для води на тренування.",
      ru: "Бутылка Butterfly '22 на 700 мл из биоразлагаемого пластика на основе растительного полимера — экологичная бутылка для воды на тренировку.",
    },
    links: [{ label: { ua: "Пляшка Butterfly 750 мл", ru: "Бутылка Butterfly 750 мл" }, href: "/butterfly/aksessuary/pliashka-butterfly" }, ...L_TOWELS],
  },
  "rushnyk-butterfly-stripe": {
    description: {
      ua: "Рушник Butterfly Stripe зі 100% бавовни з вбудованим магнітом — кріпиться до краю тенісного столу. 50 × 100 см; чорний, синій чи червоний.",
      ru: "Полотенце Butterfly Stripe из 100% хлопка со встроенным магнитом — крепится к краю теннисного стола. 50 × 100 см; чёрное, синее или красное.",
    },
    links: [{ label: { ua: "Футболка Stripe", ru: "Футболка Stripe" }, href: "/butterfly/odyag/futbolka-butterfly-stripe" }, ...L_TOWELS],
  },
  "rushnyk-butterfly-yao-midi": {
    description: {
      ua: "Компактний рушник Butterfly Yao Midi зі 100% бавовни, 30 × 50 см: витерти руки й обличчя між розіграшами, займає мало місця в сумці.",
      ru: "Компактное полотенце Butterfly Yao Midi из 100% хлопка, 30 × 50 см: вытереть руки и лицо между розыгрышами, занимает мало места в сумке.",
    },
    links: [{ label: { ua: "Рушник Yao Big", ru: "Полотенце Yao Big" }, href: "/butterfly/aksessuary/rushnyk-butterfly-big-yao" }, ...L_TOWELS],
  },
  "rushnyk-butterfly-big-yao": {
    name: { ua: "Рушник Butterfly Yao Big", ru: "Полотенце Butterfly Yao Big" },
    description: {
      ua: "Рушник Butterfly Yao Big зі 100% бавовни з діагональною смугою колекції Yao — ігровий рушник біля корту; менший варіант — Yao Midi 30 × 50 см.",
      ru: "Полотенце Butterfly Yao Big из 100% хлопка с диагональной полосой коллекции Yao — игровое полотенце у корта; меньший вариант — Yao Midi 30 × 50 см.",
    },
    links: [{ label: { ua: "Рушник Yao Midi", ru: "Полотенце Yao Midi" }, href: "/butterfly/aksessuary/rushnyk-butterfly-yao-midi" }, ...L_TOWELS],
  },
  "ochysnyk-dlia-nakladok-butterfly-combi-cleaner": {
    description: {
      ua: "Очищувач Butterfly Combi Cleaner, 100 мл: засіб і губка в одній упаковці — знімає бруд із накладок, повертає обертання. Наносити після тренування.",
      ru: "Очиститель Butterfly Combi Cleaner, 100 мл: средство и губка в одной упаковке — снимает грязь с накладок, возвращает вращение. Наносить после тренировки.",
    },
    links: [
      { label: { ua: "Захисна плівка Rubber Film IV", ru: "Защитная плёнка Rubber Film IV" }, href: "/butterfly/aksessuary/zakhysna-plivka-butterfly" },
      ...L_CARE,
    ],
  },
  "chokhol-butterfly-bg-case": {
    name: { ua: "Чохол Butterfly BG Case", ru: "Чехол Butterfly BG Case" },
    description: {
      ua: "Чохол Butterfly BG Case — новинка 2026: ракетка, 2 мʼячі й засоби догляду на внутрішньому лотку. Поліестер 320D, 21 × 29 × 5 см.",
      ru: "Чехол Butterfly BG Case — новинка 2026: ракетка, 2 мяча и средства ухода на внутреннем лотке. Полиэстер 320D, 21 × 29 × 5 см.",
    },
    links: [{ label: { ua: "Засоби догляду", ru: "Средства ухода" }, href: "/aksessuary/doglyad" }, ...L_CASES],
  },
  "chokhol-butterfly-cell-case-1": {
    name: { ua: "Чохол Butterfly Cell Case I", ru: "Чехол Butterfly Cell Case I" },
    description: {
      ua: "Чохол Butterfly Cell Case I незвичної округлої форми з нейлону 600D: одна ракетка й до 4 мʼячів в окремому відділенні, петля для підвішування.",
      ru: "Чехол Butterfly Cell Case I необычной округлой формы из нейлона 600D: одна ракетка и до 4 мячей в отдельном отделении, петля для подвешивания.",
    },
    links: [{ label: { ua: "Cell Case II — шестикутний", ru: "Cell Case II — шестиугольный" }, href: "/butterfly/chehly/chokhol-butterfly-cell-case-2" }, ...L_CASES],
  },
  "chokhol-butterfly-cell-case-2": {
    name: { ua: "Чохол Butterfly Cell Case II", ru: "Чехол Butterfly Cell Case II" },
    description: {
      ua: "Чохол Butterfly Cell Case II незвичної шестикутної форми з нейлону 600D: окреме відділення для мʼячів і петля для підвішування. Захист ракетки.",
      ru: "Чехол Butterfly Cell Case II необычной шестиугольной формы из нейлона 600D: отдельное отделение для мячей и петля для подвешивания. Защита ракетки.",
    },
    links: [{ label: { ua: "Cell Case I — до 4 мʼячів", ru: "Cell Case I — до 4 мячей" }, href: "/butterfly/chehly/chokhol-butterfly-cell-case-1" }, ...L_CASES],
  },
  "krosivky-butterfly-lezoline-trynex": {
    description: {
      ua: "Кросівки Butterfly Lezoline Trynex — наступник Utop: сучасний спортивний дизайн, зручна посадка й чіпка підошва. 270 г у розмірі 43. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Trynex — преемник Utop: современный спортивный дизайн, удобная посадка и цепкая подошва. 270 г в размере 43. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-zero", "Lezoline Zero", "Lezoline Zero"), shoe("krosivky-butterfly-lezoline-gigu", "Lezoline Gigu — більше амортизації", "Lezoline Gigu — больше амортизации"), ...L_SHOES],
  },
  "zakhysna-plivka-butterfly": {
    name: { ua: "Захисна плівка Butterfly Rubber Film IV", ru: "Защитная плёнка Butterfly Rubber Film IV" },
    description: {
      ua: "Захисна плівка Butterfly Rubber Film IV — неклейка, Японія. Накладають на очищену й просохлу накладку, щоб зберегти поверхню до наступного тренування.",
      ru: "Защитная плёнка Butterfly Rubber Film IV — неклеящаяся, Япония. Накладывают на очищенную и просохшую накладку, чтобы сохранить поверхность до тренировки.",
    },
    links: [
      { label: { ua: "Spin Refresh — очищувач", ru: "Spin Refresh — очиститель" }, href: "/butterfly/aksessuary/vidnovnyk-obertannia-butterfly-spin-refresh" },
      ...L_CARE,
    ],
  },
  "krosivky-butterfly-lezoline-sal": {
    description: {
      ua: "Кросівки Butterfly Lezoline Sal — тенісне взуття турнірного рівня: сітчастий верх, легка амортизація. Для гравців легкої й середньої ваги. Розміри 38–46.",
      ru: "Кроссовки Butterfly Lezoline Sal — теннисная обувь турнирного уровня: сетчатый верх, лёгкая амортизация. Для игроков лёгкого и среднего веса. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-zero", "Lezoline Zero", "Lezoline Zero"), shoe("krosivky-butterfly-lezoline-gigu", "Lezoline Gigu — більше амортизації", "Lezoline Gigu — больше амортизации"), ...L_SHOES],
  },
  "krosivky-butterfly-radial-cross": {
    description: {
      ua: "Кросівки Butterfly Radial Cross — для тренерів і спортсменів: тренування, розминка, біг. Дихаючий верх, підошва без слідів, для залу й вулиці. Розміри 38–46.",
      ru: "Кроссовки Butterfly Radial Cross — для тренеров и спортсменов: тренировки, разминка, бег. Дышащий верх, подошва без следов, для зала и улицы. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-unizes-2", "Lezoline Unizes II — для гри", "Lezoline Unizes II — для игры"), ...L_SHOES],
  },
  "krosivky-butterfly-sunika": {
    description: {
      ua: "Кросівки Butterfly Sunika — повсякденна модель з мʼякою амортизованою підошвою: комфорт на щодень і модний вигляд. Не для гри. Розміри 38–46.",
      ru: "Кроссовки Butterfly Sunika — повседневная модель с мягкой амортизированной подошвой: комфорт на каждый день и модный вид. Не для игры. Размеры 38–46.",
    },
    links: [shoe("krosivky-butterfly-lezoline-zero", "Lezoline Zero — для гри", "Lezoline Zero — для игры"), ...L_SHOES],
  },
  "m-iachi-butterfly-master-quality-ball-40-72-sht": {
    name: { ua: "М'ячі Butterfly Master Quality G40+ (72 шт)", ru: "Мячи Butterfly Master Quality G40+ (72 шт)" },
    description: {
      ua: "Мʼячі Butterfly Master Quality G40+, 72 шт — тренувальні мʼячі для підготовки до змагань найвищого рівня без втрати якості й довговічності.",
      ru: "Мячи Butterfly Master Quality G40+, 72 шт — тренировочные мячи для подготовки к соревнованиям высшего уровня без потери качества и долговечности.",
    },
    links: [
      { label: { ua: "Training Ball 40+, 120 шт", ru: "Training Ball 40+, 120 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-training-ball-40-120sht-v-up" },
      { label: { ua: "Сумка для мʼячів", ru: "Сумка для мячей" }, href: "/butterfly/aksessuary/sumka-dlia-m-iachiv-butterfly" },
      ...L_BALLS,
    ],
  },
  "zapasni-ustilky-butterfly": {
    description: {
      ua: "Запасні устілки Butterfly — стабілізуючі, з пластиковою вставкою для підтримки стопи. Підходять до всіх моделей взуття Butterfly. Розміри S–XL.",
      ru: "Запасные стельки Butterfly — стабилизирующие, с пластиковой вставкой для поддержки стопы. Подходят ко всем моделям обуви Butterfly. Размеры S–XL.",
    },
    links: L_SHOES,
  },
  "obmotka-na-ruchku-raketky-butterfly-overgrip": {
    description: {
      ua: "Обмотка Butterfly Overgrip на ручку ракетки для настільного тенісу — висока чутливість і надійний хват: ракетка не ковзає в долоні. Чорна.",
      ru: "Обмотка Butterfly Overgrip на ручку ракетки для настольного тенниса — высокая чувствительность и надёжный хват: ракетка не скользит в ладони. Чёрная.",
    },
    links: [
      { label: { ua: "Основи Butterfly", ru: "Основания Butterfly" }, href: "/osnovaniya" },
      { label: { ua: "Торцеві стрічки", ru: "Торцевые ленты" }, href: "/aksessuary/tortsevi-strichky" },
      { label: { ua: "Чохли для ракеток", ru: "Чехлы для ракеток" }, href: "/chehly/chokhly" },
    ],
  },
  "sumka-dlia-vzuttia-butterfly": {
    description: {
      ua: "Сумка для взуття Butterfly — простий тканинний мішечок із логотипом, щоб ігрові кросівки не забруднювали форму й речі в сумці. Чорна.",
      ru: "Сумка для обуви Butterfly — простой тканевый мешочек с логотипом, чтобы игровые кроссовки не пачкали форму и вещи в сумке. Чёрная.",
    },
    links: [...L_SHOES, { label: { ua: "Спортивні сумки", ru: "Спортивные сумки" }, href: "/chehly/sumky" }],
  },
  "sumka-dlia-m-iachiv-butterfly": {
    name: { ua: "Сумка для м'ячів Butterfly", ru: "Сумка для мячей Butterfly" },
    description: {
      ua: "Сумка для мʼячів Butterfly — циліндрична, з блискавкою й плечовим ременем; за даними дистрибʼютора вміщує 144 мʼячі. Для тренера й клубу.",
      ru: "Сумка для мячей Butterfly — цилиндрическая, с молнией и плечевым ремнём; по данным дистрибьютора вмещает 144 мяча. Для тренера и клуба.",
    },
    links: [
      { label: { ua: "Мʼячі Training Ball, 120 шт", ru: "Мячи Training Ball, 120 шт" }, href: "/butterfly/myachi/m-iachi-butterfly-training-ball-40-120sht-v-up" },
      ...L_BALLS,
    ],
  },
  "pliashka-butterfly-tenergy": {
    description: {
      ua: "Пляшка Butterfly Tenergy для води на тренування — до 750 мл, закручувальна кришка, логотип легендарних накладок Tenergy. Чорна.",
      ru: "Бутылка Butterfly Tenergy для воды на тренировку — до 750 мл, закручивающаяся крышка, логотип легендарных накладок Tenergy. Чёрная.",
    },
    links: [{ label: { ua: "Пляшка Butterfly 750 мл", ru: "Бутылка Butterfly 750 мл" }, href: "/butterfly/aksessuary/pliashka-butterfly" }, ...L_TOWELS],
  },
  "pliashka-butterfly": {
    description: {
      ua: "Пляшка Butterfly для води на тренування — пластикова, 750 мл, із закручувальною кришкою й логотипом Butterfly: не протікає в сумці.",
      ru: "Бутылка Butterfly для воды на тренировку — пластиковая, 750 мл, с закручивающейся крышкой и логотипом Butterfly: не протекает в сумке.",
    },
    links: [{ label: { ua: "Пляшка Butterfly Tenergy", ru: "Бутылка Butterfly Tenergy" }, href: "/butterfly/aksessuary/pliashka-butterfly-tenergy" }, ...L_TOWELS],
  },
};

/** Накладає власний копі на товар, якщо він є (інакше повертає той самий обʼєкт). */
export function withGearCopy(p: CatalogProduct): CatalogProduct {
  const c = COPY[p.slug] ?? wearCopy[p.slug];
  if (!c) return p;
  return {
    ...p,
    ...(c.name
      ? {
          name: c.name,
          // title будуємо з виправленої назви тим самим шаблоном, що й решта карток;
          // routeTitle сам скоротить, якщо вийде довше 60 символів.
          title: {
            ua: `${c.name.ua} — купити в Україні | TTMAX`,
            ru: `${c.name.ru} — купить в Украине | TTMAX`,
          },
        }
      : {}),
    description: c.description,
    related: c.links,
  };
}

/** Для перевірок: які slug мають копі (scripts, аудит). */
export const GEAR_COPY_SLUGS = Object.keys(COPY);
