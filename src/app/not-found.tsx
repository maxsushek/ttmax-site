import Link from "next/link";
import { defaultLocale } from "@/i18n/config";

/**
 * ГЛОБАЛЬНИЙ 404 — для адрес, що не потрапили в жодну групу маршрутів. Основний, «сайтовий»
 * 404 живе в app/(site)/[locale]/not-found.tsx і має повний layout із шапкою й підвалом.
 *
 * ⚠️ СТИЛІ ТУТ ВЛАСНІ Й НАВМИСНО НЕ ЧЕРЕЗ globals.css — не міняти на import.
 *
 * Після видалення кореневого app/layout.tsx цей файл не обгортається нічим: Next малює його
 * у службовій оболонці <html id="__next_error__">, куди не потрапляє ні CSS, ні класи <body>.
 * Спокуса — просто зробити import "./globals.css". Так було, і це коштувало дорого: Next
 * вкладає межу not-found у RSC-payload КОЖНОЇ сторінки, тож увесь бандл Tailwind (62 КБ)
 * лежав у payload двічі — виміряно на /ua/terms: два байт-ідентичні чанки по 62017 Б.
 * По дроту brotli це дедуплікує майже безкоштовно, але +64 КБ на кожен payload розбирає
 * RSC-парсер, і рівно стільки ж додається до КОЖНОГО prefetch.
 *
 * Тому тут кілька рядків власного CSS. Токени збігаються з globals.css вручну:
 * bg-base #080A0E, ink #F0F0F0, ink-muted #9AA0A6, accent #D9FF3D.
 */
export default function NotFound() {
  return (
    <>
      <style>{`
        .nf-root{min-height:100vh;display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:8px;padding:96px 24px;text-align:center;
          background:#080A0E;color:#F0F0F0;
          font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
        .nf-code{margin:0;font-size:72px;line-height:1;font-weight:900;letter-spacing:-.02em;
          color:#D9FF3D;font-family:var(--font-display),ui-sans-serif,system-ui,sans-serif}
        .nf-title{margin:8px 0 0;font-size:24px;font-weight:900;text-transform:uppercase;
          letter-spacing:-.01em;font-family:var(--font-display),ui-sans-serif,system-ui,sans-serif}
        .nf-text{margin:12px 0 32px;font-size:16px;color:#9AA0A6}
        .nf-link{display:inline-flex;align-items:center;justify-content:center;height:44px;
          padding:0 24px;border-radius:12px;background:#D9FF3D;color:#080A0E;
          font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
          text-decoration:none;
          font-family:var(--font-display),ui-sans-serif,system-ui,sans-serif}
      `}</style>
      <div className="nf-root">
        <p className="nf-code">404</p>
        <h1 className="nf-title">Сторінку не знайдено</h1>
        <p className="nf-text">Page not found</p>
        <Link href={`/${defaultLocale}`} className="nf-link">
          На головну
        </Link>
      </div>
    </>
  );
}
