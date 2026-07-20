"use client";

import { useState } from "react";
import Link from "next/link";
import { type Locale } from "@/i18n/config";

type SpaceKey = "room" | "garage" | "hall" | "outdoor";
type L = Record<Locale, string>;

const UI: Record<
  Locale,
  { kicker: string; heading: string; hint: string; pick: string; space: string; table: string; cta: string; reset: string }
> = {
  ua: {
    kicker: "Інтерактив",
    heading: "Який стіл підійде під твій простір?",
    hint: "Обери, де плануєш грати — підкажемо тип столу й скільки треба місця.",
    pick: "Рекомендація",
    space: "Потрібно місця",
    table: "Тип столу",
    cta: "Дивитись столи",
    reset: "Обрати ще раз",
  },
  ru: {
    kicker: "Интерактив",
    heading: "Какой стол подойдёт под твоё пространство?",
    hint: "Выбери, где планируешь играть — подскажем тип стола и сколько нужно места.",
    pick: "Рекомендация",
    space: "Нужно места",
    table: "Тип стола",
    cta: "Смотреть столы",
    reset: "Выбрать ещё раз",
  },
};

type SpaceDef = {
  key: SpaceKey;
  label: L;
  tagline: L;
  verdict: L;
  space: L;
  table: L;
  href: string;
};

const SPACES: SpaceDef[] = [
  {
    key: "room",
    label: { ua: "Кімната / квартира", ru: "Комната / квартира" },
    tagline: { ua: "Вдома, обмежене місце", ru: "Дома, ограниченное место" },
    verdict: {
      ua: "Повнорозмірний стіл стане, якщо є ~5,5×3 м. Для тіснішої кімнати бери складний стіл на коліщатах — прибрав до стіни після гри.",
      ru: "Полноразмерный стол поместится, если есть ~5,5×3 м. Для комнаты потеснее бери складной стол на колёсиках — убрал к стене после игры.",
    },
    space: { ua: "від 5,5×3 м", ru: "от 5,5×3 м" },
    table: { ua: "Складний indoor", ru: "Складной indoor" },
    href: "/stoly",
  },
  {
    key: "garage",
    label: { ua: "Гараж / підвал", ru: "Гараж / подвал" },
    tagline: { ua: "Технічне приміщення", ru: "Техническое помещение" },
    verdict: {
      ua: "Ідеальне місце для складного столу: розклав, пограв, склав. Стеж за вологістю — для сирого гаража краще всепогодня стільниця.",
      ru: "Идеальное место для складного стола: разложил, поиграл, сложил. Следи за влажностью — для сырого гаража лучше всепогодная столешница.",
    },
    space: { ua: "від 5×2,8 м", ru: "от 5×2,8 м" },
    table: { ua: "Складний / всепогодній", ru: "Складной / всепогодный" },
    href: "/stoly",
  },
  {
    key: "hall",
    label: { ua: "Спортзал / клуб", ru: "Спортзал / клуб" },
    tagline: { ua: "Регулярні тренування", ru: "Регулярные тренировки" },
    verdict: {
      ua: "Бери стаціонарний професійний стіл зі стільницею 22–25 мм — стабільний «живий» відскок і запас міцності під інтенсив.",
      ru: "Бери стационарный профессиональный стол со столешницей 22–25 мм — стабильный «живой» отскок и запас прочности под интенсив.",
    },
    space: { ua: "від 7×4 м", ru: "от 7×4 м" },
    table: { ua: "Професійний indoor 22–25 мм", ru: "Профессиональный indoor 22–25 мм" },
    href: "/stoly",
  },
  {
    key: "outdoor",
    label: { ua: "Двір / вулиця", ru: "Двор / улица" },
    tagline: { ua: "Просто неба", ru: "Под открытым небом" },
    verdict: {
      ua: "Потрібен всепогодній (outdoor) стіл із меламіну чи алюмінію — не боїться дощу й сонця. Indoor-стіл на вулиці розбухне.",
      ru: "Нужен всепогодный (outdoor) стол из меламина или алюминия — не боится дождя и солнца. Indoor-стол на улице разбухнет.",
    },
    space: { ua: "від 6×3,5 м", ru: "от 6×3,5 м" },
    table: { ua: "Всепогодній outdoor", ru: "Всепогодный outdoor" },
    href: "/stoly",
  },
];

export function TableSpaceQuiz({ locale }: { locale: Locale }) {
  const ui = UI[locale];
  const [picked, setPicked] = useState<SpaceKey | null>(null);
  const chosen = SPACES.find((s) => s.key === picked) ?? null;

  return (
    <section className="my-10 rounded-2xl border border-border-subtle bg-bg-raised p-5 sm:p-6">
      <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{ui.kicker}</p>
      <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-ink">{ui.heading}</h2>
      <p className="mb-4 font-body text-[13px] text-ink-muted">{ui.hint}</p>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {SPACES.map((s) => {
          const active = s.key === picked;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setPicked(active ? null : s.key)}
              aria-pressed={active}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <span className={`block font-display text-[15px] font-bold uppercase ${active ? "text-accent" : "text-ink"}`}>
                {s.label[locale]}
              </span>
              <span className="mt-0.5 block font-body text-[12px] leading-snug text-ink-muted">{s.tagline[locale]}</span>
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-ink-dim">
            {ui.pick}: <span className="text-accent">{chosen.label[locale]}</span>
          </p>
          <p className="mt-1.5 font-body text-[14px] leading-relaxed text-ink">{chosen.verdict[locale]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg border border-border-subtle px-3 py-1.5 font-body text-[12px] text-ink-muted">
              {ui.space}: <span className="font-bold text-ink">{chosen.space[locale]}</span>
            </span>
            <span className="rounded-lg border border-border-subtle px-3 py-1.5 font-body text-[12px] text-ink-muted">
              {ui.table}: <span className="font-bold text-ink">{chosen.table[locale]}</span>
            </span>
          </div>
          <Link
            href={`/${locale}${chosen.href}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-2 font-body text-[13px] font-bold text-accent hover:bg-accent/10"
          >
            {ui.cta} →
          </Link>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="mt-3 block font-body text-[12px] text-ink-dim underline hover:text-ink"
          >
            {ui.reset}
          </button>
        </div>
      )}
    </section>
  );
}
