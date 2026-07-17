// src/data/authors.ts
// Автори статей блогу. Джерело правди — код (як blog.ts). E-E-A-T: реальна людина,
// підтверджена зовнішніми профілями (sameAs) — саме вони корроборують Person для Google.
// ⚠️ sameAs без реальних URL знецінює Person — не додавати порожні/«#».
import type { Locale } from "@/i18n/config";

type L = Record<Locale, string>;

/** Слаг автора → сегмент /author/<slug>. Юніон, щоб blog.ts посилався тільки на наявних. */
export type AuthorSlug = "artem-maksymchuk";

export type AuthorStat = { label: L; value: string };

export type Author = {
  slug: AuthorSlug;
  /** Ім'я (для byline, картки, Person.name). */
  name: L;
  /** Посада (Person.jobTitle). */
  jobTitle: L;
  /** Короткий bio для картки автора під статтею. */
  bio: L;
  /** Розгорнутий опис для сторінки /author + Person.description. */
  description: L;
  /** Cloudinary publicId фото автора; undefined — рендер fallback-ініціалів. */
  photoPublicId?: string;
  /** Теми експертизи (Person.knowsAbout). */
  knowsAbout: L[];
  /** Зовнішні профілі (Person.sameAs) — підтвердження особи. Тільки реальні URL. */
  sameAs: string[];
  /** Показники для картки автора (турніри/перемоги/рейтинг). */
  stats: AuthorStat[];
};

export const authors = {
  "artem-maksymchuk": {
    slug: "artem-maksymchuk",
    name: { ua: "Артем Максимчук", ru: "Артём Максимчук" },
    jobTitle: {
      ua: "Гравець настільного тенісу (1 розряд), тренер",
      ru: "Игрок настольного тенниса (1 разряд), тренер",
    },
    bio: {
      ua: "Гравець настільного тенісу (1 розряд) і тренер. Серед вихованок — чемпіонка України серед мінікадетів.",
      ru: "Игрок настольного тенниса (1 разряд) и тренер. Среди воспитанниц — чемпионка Украины среди микрокадетов.",
    },
    description: {
      ua: "Артем Максимчук — гравець настільного тенісу (1 розряд) і тренер із Харкова. Понад 140 зіграних турнірів. Серед вихованок — чемпіонка України серед мінікадетів. У статтях блогу TTMAX ділиться практичним досвідом гри та підбору інвентарю.",
      ru: "Артём Максимчук — игрок настольного тенниса (1 разряд) и тренер из Харькова. Более 140 сыгранных турниров. Среди воспитанниц — чемпионка Украины среди микрокадетов. В статьях блога TTMAX делится практическим опытом игры и подбора инвентаря.",
    },
    photoPublicId: "максимчук_umylar",
    knowsAbout: [
      { ua: "настільний теніс", ru: "настольный теннис" },
      { ua: "ракетки для настільного тенісу", ru: "ракетки для настольного тенниса" },
      { ua: "накладки Butterfly", ru: "накладки Butterfly" },
      { ua: "основи для ракеток", ru: "основания для ракеток" },
      { ua: "техніка гри", ru: "техника игры" },
    ],
    sameAs: [
      "https://www.uttf.com.ua/player/ura9i23",
      "https://ttwrating.com/ru/player/31b892a",
      "https://www.tt-kharkiv.com/ru/players/maksimcuk-artem-sergeevic-2001",
    ],
    stats: [
      { label: { ua: "Турнірів зіграно", ru: "Турниров сыграно" }, value: "140+" },
      { label: { ua: "Перемог", ru: "Побед" }, value: "66%" },
      { label: { ua: "Рейтинг", ru: "Рейтинг" }, value: "661" },
    ],
  },
} satisfies Record<AuthorSlug, Author>;

export function getAuthor(slug: AuthorSlug): Author {
  return authors[slug];
}

export const allAuthors: Author[] = Object.values(authors);
