// src/data/catalog/filters.ts
import type { FilterDef } from "@/types/catalog";

// Словарь фильтров каталога накладок. UI рендерит фасеты отсюда.
// facetIndexable=true → допускается отдельный ЧПУ-срез (бренд×категория, серия). Остальные фасеты — noindex.
export const rubberFilters: FilterDef[] = [
  {
    key: "surfaceType",
    label: { uk: "Тип поверхні", ru: "Тип поверхности" },
    type: "single",
    facetIndexable: true,
    options: [
      { value: "gladka", label: { uk: "Гладка", ru: "Гладкая" } },
      { value: "korotki-shypy", label: { uk: "Короткі шипи", ru: "Короткие шипы" } },
      { value: "dovgi-shypy", label: { uk: "Довгі шипи", ru: "Длинные шипы" } },
      { value: "antyspin", label: { uk: "Антиспін", ru: "Антиспин" } },
    ],
  },
  {
    key: "playStyle",
    label: { uk: "Стиль", ru: "Стиль" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "tenzor", label: { uk: "Тензорна", ru: "Тензорная" } },
      { value: "gibrid", label: { uk: "Гібридна", ru: "Гибридная" } },
      { value: "lipka", label: { uk: "Липка (китайський стиль)", ru: "Липкая (китайский стиль)" } },
      { value: "klasyka", label: { uk: "Класична", ru: "Классическая" } },
    ],
  },
  {
    key: "series",
    label: { uk: "Серія", ru: "Серия" },
    type: "single",
    facetIndexable: true,
    options: [
      { value: "dignics", label: { uk: "Dignics", ru: "Dignics" } },
      { value: "tenergy", label: { uk: "Tenergy", ru: "Tenergy" } },
      { value: "glayzer", label: { uk: "Glayzer", ru: "Glayzer" } },
      { value: "rozena", label: { uk: "Rozena", ru: "Rozena" } },
      { value: "zyre", label: { uk: "Zyre", ru: "Zyre" } },
      { value: "sriver", label: { uk: "Sriver", ru: "Sriver" } },
      { value: "tackiness", label: { uk: "Tackiness", ru: "Tackiness" } },
      { value: "roundell", label: { uk: "Roundell", ru: "Roundell" } },
      { value: "bryce", label: { uk: "Bryce", ru: "Bryce" } },
      { value: "feint", label: { uk: "Feint", ru: "Feint" } },
      { value: "ilius", label: { uk: "Ilius", ru: "Ilius" } },
      { value: "impartial", label: { uk: "Impartial", ru: "Impartial" } },
    ],
  },
  {
    key: "thickness",
    label: { uk: "Товщина губки, мм", ru: "Толщина губки, мм" },
    type: "multi",
    facetIndexable: false,
    options: [
      { value: "OX", label: { uk: "OX (без губки)", ru: "OX (без губки)" } },
      { value: "1.1", label: { uk: "1.1", ru: "1.1" } },
      { value: "1.3", label: { uk: "1.3", ru: "1.3" } },
      { value: "1.5", label: { uk: "1.5", ru: "1.5" } },
      { value: "1.7", label: { uk: "1.7", ru: "1.7" } },
      { value: "1.9", label: { uk: "1.9", ru: "1.9" } },
      { value: "2.1", label: { uk: "2.1", ru: "2.1" } },
      { value: "2.5", label: { uk: "2.5", ru: "2.5" } },
      { value: "2.7", label: { uk: "2.7", ru: "2.7" } },
      { value: "MAX", label: { uk: "MAX", ru: "MAX" } },
    ],
  },
  {
    key: "hardnessBucket",
    label: { uk: "Жорсткість губки", ru: "Жёсткость губки" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "soft", label: { uk: "М'яка (≤32°)", ru: "Мягкая (≤32°)" } },
      { value: "medium", label: { uk: "Середня (33–39°)", ru: "Средняя (33–39°)" } },
      { value: "hard", label: { uk: "Жорстка (≥40°)", ru: "Жёсткая (≥40°)" } },
    ],
  },
  {
    key: "speedBucket",
    label: { uk: "Швидкість", ru: "Скорость" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "control", label: { uk: "Контроль", ru: "Контроль" } },
      { value: "medium", label: { uk: "Середня", ru: "Средняя" } },
      { value: "high", label: { uk: "Висока", ru: "Высокая" } },
      { value: "very-high", label: { uk: "Дуже висока", ru: "Очень высокая" } },
    ],
  },
  {
    key: "spinBucket",
    label: { uk: "Обертання", ru: "Вращение" },
    type: "single",
    facetIndexable: false,
    options: [
      { value: "control", label: { uk: "Контроль", ru: "Контроль" } },
      { value: "medium", label: { uk: "Середнє", ru: "Среднее" } },
      { value: "high", label: { uk: "Високе", ru: "Высокое" } },
      { value: "very-high", label: { uk: "Дуже високе", ru: "Очень высокое" } },
    ],
  },
  {
    key: "level",
    label: { uk: "Рівень гравця", ru: "Уровень игрока" },
    type: "single",
    facetIndexable: true,
    options: [
      { value: "beginner", label: { uk: "Початківець", ru: "Начинающий" } },
      { value: "amateur", label: { uk: "Любитель", ru: "Любитель" } },
      { value: "advanced", label: { uk: "Просунутий", ru: "Продвинутый" } },
      { value: "pro", label: { uk: "Професіонал", ru: "Профессионал" } },
      { value: "special", label: { uk: "Спеціальна (захист/шипи)", ru: "Специальная (защита/шипы)" } },
    ],
  },
  {
    key: "color",
    label: { uk: "Колір", ru: "Цвет" },
    type: "multi",
    facetIndexable: false,
    options: [
      { value: "black", label: { uk: "Чорна", ru: "Чёрная" } },
      { value: "red", label: { uk: "Червона", ru: "Красная" } },
    ],
  },
];

export default rubberFilters;
