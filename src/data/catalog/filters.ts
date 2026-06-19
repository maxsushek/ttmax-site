// src/data/catalog/filters.ts
import type { FilterDef } from "@/types/catalog";

// Словарь фильтров каталога накладок. UI рендерит фасеты отсюда.
// facetIndexable=true → допускается отдельный ЧПУ-срез (бренд×категория, серия). Остальные фасеты — noindex.
export const rubberFilters: FilterDef[] = [
  {
    key: "surfaceType",
    label: { ua: "Тип поверхні", ru: "Тип поверхности" },
    type: "single",
    facetIndexable: true,
    options: [
      { value: "gladka", label: { ua: "Гладка", ru: "Гладкая" } },
      { value: "korotki-shypy", label: { ua: "Короткі шипи", ru: "Короткие шипы" } },
      { value: "dovgi-shypy", label: { ua: "Довгі шипи", ru: "Длинные шипы" } },
      { value: "antyspin", label: { ua: "Антиспін", ru: "Антиспин" } },
    ],
  },
  {
    key: "playStyle",
    label: { ua: "Стиль", ru: "Стиль" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "tenzor", label: { ua: "Тензорна", ru: "Тензорная" } },
      { value: "gibrid", label: { ua: "Гібридна", ru: "Гибридная" } },
      { value: "lipka", label: { ua: "Липка (китайський стиль)", ru: "Липкая (китайский стиль)" } },
      { value: "klasyka", label: { ua: "Класична", ru: "Классическая" } },
    ],
  },
  {
    key: "series",
    label: { ua: "Серія", ru: "Серия" },
    type: "single",
    facetIndexable: true,
    options: [
      { value: "dignics", label: { ua: "Dignics", ru: "Dignics" } },
      { value: "tenergy", label: { ua: "Tenergy", ru: "Tenergy" } },
      { value: "glayzer", label: { ua: "Glayzer", ru: "Glayzer" } },
      { value: "rozena", label: { ua: "Rozena", ru: "Rozena" } },
      { value: "zyre", label: { ua: "Zyre", ru: "Zyre" } },
      { value: "sriver", label: { ua: "Sriver", ru: "Sriver" } },
      { value: "tackiness", label: { ua: "Tackiness", ru: "Tackiness" } },
      { value: "roundell", label: { ua: "Roundell", ru: "Roundell" } },
      { value: "bryce", label: { ua: "Bryce", ru: "Bryce" } },
      { value: "feint", label: { ua: "Feint", ru: "Feint" } },
      { value: "ilius", label: { ua: "Ilius", ru: "Ilius" } },
      { value: "impartial", label: { ua: "Impartial", ru: "Impartial" } },
    ],
  },
  {
    key: "thickness",
    label: { ua: "Товщина губки, мм", ru: "Толщина губки, мм" },
    type: "multi",
    facetIndexable: false,
    options: [
      { value: "OX", label: { ua: "OX (без губки)", ru: "OX (без губки)" } },
      { value: "1.1", label: { ua: "1.1", ru: "1.1" } },
      { value: "1.3", label: { ua: "1.3", ru: "1.3" } },
      { value: "1.5", label: { ua: "1.5", ru: "1.5" } },
      { value: "1.7", label: { ua: "1.7", ru: "1.7" } },
      { value: "1.9", label: { ua: "1.9", ru: "1.9" } },
      { value: "2.1", label: { ua: "2.1", ru: "2.1" } },
      { value: "2.5", label: { ua: "2.5", ru: "2.5" } },
      { value: "2.7", label: { ua: "2.7", ru: "2.7" } },
      { value: "MAX", label: { ua: "MAX", ru: "MAX" } },
    ],
  },
  {
    key: "hardnessBucket",
    label: { ua: "Жорсткість губки", ru: "Жёсткость губки" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "soft", label: { ua: "М'яка (≤32°)", ru: "Мягкая (≤32°)" } },
      { value: "medium", label: { ua: "Середня (33–39°)", ru: "Средняя (33–39°)" } },
      { value: "hard", label: { ua: "Жорстка (≥40°)", ru: "Жёсткая (≥40°)" } },
    ],
  },
  {
    key: "speedBucket",
    label: { ua: "Швидкість", ru: "Скорость" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "control", label: { ua: "Контроль", ru: "Контроль" } },
      { value: "medium", label: { ua: "Середня", ru: "Средняя" } },
      { value: "high", label: { ua: "Висока", ru: "Высокая" } },
      { value: "very-high", label: { ua: "Дуже висока", ru: "Очень высокая" } },
    ],
  },
  {
    key: "spinBucket",
    label: { ua: "Обертання", ru: "Вращение" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "control", label: { ua: "Контроль", ru: "Контроль" } },
      { value: "medium", label: { ua: "Середнє", ru: "Среднее" } },
      { value: "high", label: { ua: "Високе", ru: "Высокое" } },
      { value: "very-high", label: { ua: "Дуже високе", ru: "Очень высокое" } },
    ],
  },
  {
    key: "level",
    label: { ua: "Рівень гравця", ru: "Уровень игрока" },
    type: "single",
    facetIndexable: true,
    options: [
      { value: "beginner", label: { ua: "Початківець", ru: "Начинающий" } },
      { value: "amateur", label: { ua: "Любитель", ru: "Любитель" } },
      { value: "advanced", label: { ua: "Просунутий", ru: "Продвинутый" } },
      { value: "pro", label: { ua: "Професіонал", ru: "Профессионал" } },
      { value: "special", label: { ua: "Спеціальна (захист/шипи)", ru: "Специальная (защита/шипы)" } },
    ],
  },
  {
    key: "color",
    label: { ua: "Колір", ru: "Цвет" },
    type: "multi",
    facetIndexable: false,
    options: [
      { value: "black", label: { ua: "Чорна", ru: "Чёрная" } },
      { value: "red", label: { ua: "Червона", ru: "Красная" } },
    ],
  },
];

export default rubberFilters;
