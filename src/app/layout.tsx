import type { ReactNode } from "react";
import { Oswald, Roboto } from "next/font/google";
import { headers } from "next/headers";
import { defaultLocale, isLocale, localeToLang } from "@/i18n/config";
import { cn } from "@/utils/cn";
import "./globals.css";

/**
 * ⚠️ ЧОМУ НЕ BARLOW. Раніше тут стояли Barlow Condensed і Barlow — і В НИХ НЕМАЄ КИРИЛИЦІ.
 * Перевірено рендером: замість «УКРАЇНА» шрифт малює квадрати з питаннями, а Google Fonts
 * узагалі не віддає для них кириличну підмножину (лише latin, latin-ext, vietnamese).
 * Наслідок: 100% тексту сайту — увесь укр. і рос. — малювався СИСТЕМНИМ шрифтом відвідувача.
 * Тобто заголовок виглядав по-різному на iPhone, Android і Windows, а в героя латиниця
 * і кирилиця були двома різними гарнітурами в одному рядку. Звідти ж наїзд крапок «Ї»
 * на рядок вище: щільність 0.9 розрахована на короткі виносні Barlow, а не на системний шрифт.
 *
 * ⚠️ ВАГА БЕЗ weight — ЦЕ НАВМИСНО. Без переліку ваг next/font бере ВАРІАТИВНИЙ файл:
 * один файл на підмножину покриває всі накреслення. Було 16 файлів і 190 КБ (більше за
 * весь JS сторінки) заради латиниці в назвах моделей і цифрах. Стало 4 файли.
 *
 * Підмножини — тільки latin і cyrillic. latin-ext, vietnamese і greek не потрібні:
 * у каталозі немає ані діакритики, ані грецької.
 *
 * ⚠️ Oswald має вісь ваги 200-700, тож tailwind-класи font-black (900) і font-extrabold (800)
 * браузер затискає до 700. Це навмисно краще за синтетичне жирніння — воно спотворює літери.
 */
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const headerLocale = h.get("x-locale");
  const locale = headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;
  return (
    <html
      lang={localeToLang[locale]}
      className={cn(oswald.variable, roboto.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-base text-ink">{children}</body>
    </html>
  );
}
