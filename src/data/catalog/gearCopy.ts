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
//    лишились Sunika, Radial Cross, Trynex, Lezoline Sal, мʼячі S40+ і Master Quality,
//    Combi Cleaner, дрібні аксесуари без опису виробника (19.10.2026);
//  • однаковий товар в іншому обʼємі чи кольорі (клей 37/50/500 мл, Rifones сині/чорні) не
//    відкриваємо — це дублі основної картки; їхній попит забирає основна картка й хаб.
//
// Розміри взуття 38–46 — ті, що на картці (вибір розміру); інших не обіцяємо.
import type { CatalogProduct, Localized } from "@/types/catalog";

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
  { label: { ua: "Клей для накладок", ru: "Клей для накладок" }, href: "/aksessuary/klei" },
  { label: { ua: "Торцеві стрічки", ru: "Торцевые ленты" }, href: "/aksessuary/tortsevi-strichky" },
  { label: { ua: "Накладки Butterfly", ru: "Накладки Butterfly" }, href: "/nakladki" },
];
const L_CARE = [
  { label: { ua: "Догляд за накладками", ru: "Уход за накладками" }, href: "/aksessuary/doglyad" },
  { label: { ua: "Чохли для ракеток", ru: "Чехлы для ракеток" }, href: "/chehly/chokhly" },
];
const L_TAPE = [
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
};

/** Накладає власний копі на товар, якщо він є (інакше повертає той самий обʼєкт). */
export function withGearCopy(p: CatalogProduct): CatalogProduct {
  const c = COPY[p.slug];
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
