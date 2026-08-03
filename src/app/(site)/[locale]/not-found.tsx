import Link from "next/link";
import { defaultLocale } from "@/i18n/config";

/**
 * 404 ВСЕРЕДИНІ САЙТУ — саме сюди потрапляє notFound() із каталогу:
 * знятий з продажу товар (WITHDRAWN_SLUGS у lib/catalog/hidden.ts), нерозібраний сегмент,
 * неіснуюча категорія.
 *
 * ⚠️ НАВІЩО ОКРЕМИЙ ФАЙЛ: після переїзду в групи маршрутів кореневий app/layout.tsx видалено,
 * тому app/not-found.tsx лишився взагалі без layout — Next малює його у власній службовій
 * оболонці <html id="__next_error__"> без жодного CSS. Виходив білий аркуш системним шрифтом.
 * Цей файл лежить усередині групи (site), тож отримує її кореневий layout: тему, шрифти,
 * шапку, футер і кошик.
 *
 * Текст двомовний свідомо: not-found.tsx не отримує params, тому локаль тут невідома.
 * Шапка й футер при цьому вже локалізовані — їх малює layout, який локаль знає.
 */
export default function LocaleNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-4 font-display text-[64px] font-black leading-none tracking-tight text-accent sm:text-[88px]">
        404
      </p>
      <h1 className="mb-3 font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
        Сторінку не знайдено
      </h1>
      <p className="mb-10 max-w-md font-body text-base text-ink-muted">
        Можливо, товар знято з продажу або адреса змінилася.
        <span className="mt-1 block text-sm text-ink-ghost">
          Страница не найдена — возможно, товар снят с продажи.
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/${defaultLocale}/nakladki`}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 font-display text-sm font-bold uppercase tracking-[0.08em] text-bg-base transition-colors hover:bg-accent/90"
        >
          Накладки
        </Link>
        <Link
          href={`/${defaultLocale}/osnovaniya`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong px-6 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-border hover:bg-bg-elevated"
        >
          Основи
        </Link>
        <Link
          href={`/${defaultLocale}`}
          className="inline-flex h-11 items-center justify-center px-4 font-body text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}
