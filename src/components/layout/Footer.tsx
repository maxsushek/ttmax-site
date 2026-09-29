"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { siteConfig, socialProfiles } from "@/config/site";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { trackEvent } from "@/lib/analytics/events";
import type { ContactInfo } from "@/lib/contact/keys";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

type FootLink = { label: string; href: string };
type FootColumn = {
  key: string;
  title: string;
  links: ReadonlyArray<FootLink>;
  /**
   * Розкласти посилання у дві колонки на десктопі. Потрібне «Каталогу»: у ньому 10 пунктів
   * проти 1 у «Колекціях», і в один стовпчик він розтягував підвал удвічі вище за потрібне,
   * лишаючи поруч порожнечу.
   */
  split?: boolean;
};

function FooterColumn({ column }: { column: FootColumn }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-subtle lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between bg-transparent py-3.5 lg:pointer-events-none"
      >
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {column.title}
        </span>
        <span
          aria-hidden
          className={cn(
            "text-lg text-accent transition-transform duration-300 lg:hidden",
            open && "rotate-45",
          )}
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
          "lg:grid-rows-[1fr]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "pb-2",
              // columns-2, а не grid: CSS-колонки заповнюються ЗВЕРХУ ВНИЗ, тож список
              // читається двома стовпчиками поспіль. Grid розкладав би 1-2 / 3-4 упоперек,
              // і порядок пунктів меню розсипався б.
              column.split ? "lg:columns-2 lg:gap-x-6" : "flex flex-col gap-0.5",
            )}
          >
            {column.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                /**
                 * ⚠️ prefetch={false} — підвал дублює всю навігацію шапки.
                 *
                 * На SSG префетч тягне повний payload сторінки (~26 КБ gzip), а не заглушку
                 * ~200 Б, як було на динамічному main. Заміряно в браузері на /ua/nakladki:
                 * 18 префетч-запитів на 231 КБ при завантаженні — це рівно ті самі 9 адрес,
                 * запитаних двічі, бо шапка й підвал ведуть в одні й ті самі розділи.
                 *
                 * Префетч лишається в ШАПЦІ — там перехід має бути миттєвим. Підвал же
                 * долистують свідомо, зайва секунда там нічого не варта, а половина трафіку
                 * на мобільному — варта.
                 */
                prefetch={false}
                className="block py-1.5 font-body text-[13px] text-ink-muted transition-all hover:pl-1 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer({
  locale,
  messages,
  logoUrl,
  contact,
}: {
  locale: Locale;
  messages: Messages;
  logoUrl?: string;
  contact?: ContactInfo;
}) {
  const m = messages.footer;
  const phoneHref = contact?.phone ?? siteConfig.phone;
  /**
   * ⚠️ Підпис телефона беремо з ТОГО САМОГО джерела, що й посилання.
   *
   * Раніше href брався з site_settings, а видимий текст — із словника (messages.footer.phone),
   * де номер був зашитий рядком. Тобто зміна номера в адмінці правила tel:, але людина
   * бачила старий номер. Класична тиха розбіжність: обидва місця «працюють», а разом брешуть.
   * Тепер обидва йдуть з contact (фолбек — siteConfig), а ключ footer.phone зі словників прибрано.
   */
  const phoneLabel = contact?.phoneDisplay || siteConfig.phoneDisplay;
  const socials = socialProfiles(contact?.social);

  // Каталожні пункти футера → реальні URL категорій.
  // Слаги зіставляємо ЗА ІНДЕКСОМ (як infoSlugs нижче), а не за перекладеним label:
  // m.catalogLinks локалізований (RU: «Основания», «Мячи»…), тож ключ-по-мітці збігався
  // лише для «Накладки», і решта RU-пунктів падала у фолбек /nakladki (биті лінки на кожній RU-сторінці).
  // ⚠️ ПОРЯДОК має збігатися з m.catalogLinks (зіставлення за індексом!).
  // /rakety стоїть першим свідомо: це найбільший запит сайту (RU 2000 + UA 1000), а в футері
  // його не було взагалі — при тому що хвостові /odyag і /myachi мали по 3 розміщення.
  // Додані також obuv, chehly, setki — раніше їх у футері не було.
  const catalogSlugs = [
    "rakety",
    "osnovaniya",
    "nakladki",
    "myachi",
    "stoly",
    "odyag",
    "obuv",
    "chehly",
    "setki",
    "aksessuary",
  ];
  const catalogLinks: FootLink[] = m.catalogLinks.map((label, i) => ({
    label,
    href: catalogSlugs[i] ? `/${locale}/${catalogSlugs[i]}` : `/${locale}/nakladki`,
  }));
  // Только Butterfly.
  const brandLinks: FootLink[] = [{ label: "Butterfly", href: `/${locale}/butterfly` }];
  // Інфо-сторінки в тому ж порядку, що m.infoLinks: Про нас, Доставка, Оплата, Повернення, Контакти.
  // ⚠️ ПОРЯДОК = m.infoLinks. «Блог» доданий другим: статей уже 5, вони збирають інфо-трафік
  // і ведуть на money-картки, а в футері блогу не було зовсім (лише в хедері).
  const infoSlugs = ["about", "blog", "delivery", "payment", "returns", "contacts"];
  const infoLinks: FootLink[] = m.infoLinks.map((label, i) => ({
    label,
    href: infoSlugs[i] ? `/${locale}/${infoSlugs[i]}` : "#",
  }));

  const columns: FootColumn[] = [
    // split: у каталозі 10 пунктів проти 1 у «Колекціях» — без розбивки підвал виходив
    // удвічі вищим, ніж потрібно, з великою порожнечею праворуч.
    { key: "catalog", title: m.columns.catalog, links: catalogLinks, split: true },
    { key: "brands", title: m.columns.brands, links: brandLinks },
    { key: "info", title: m.columns.info, links: infoLinks },
  ];

  return (
    <footer className="border-t border-border-subtle bg-bg-deeper">
      <div className="container-page pt-12">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border-subtle pb-7">
          <div>
            <Logo locale={locale} imageUrl={logoUrl} className="mb-3.5" />
            <p className="max-w-[240px] font-body text-[13px] leading-relaxed text-ink-muted">
              {m.tagline}
            </p>
          </div>
          {/* На телефоні блок переноситься під лого, тож рівняємо ліворуч, як і лого; праворуч — з sm. */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {/*
              Лише власні профілі магазину (socialProfiles): платформа без профілю не
              показується зовсім — раніше тут були корені платформ як заглушки, тобто
              посилання в нікуди на кожній сторінці. Ті самі адреси йдуть у sameAs.
              rel="me" — стандартна позначка «це мій профіль»: за нею платформи й
              асистенти звʼязують акаунт із сайтом.
              Фірмовий колір — через CSS-змінну, а не JS-обробники: так підсвічування
              працює і для клавіатури (focus-visible), а не лише для мишки.
            */}
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-2 sm:justify-end">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="me noopener noreferrer"
                      aria-label={`${siteConfig.operator} — ${s.name}`}
                      title={s.name}
                      style={{ "--brand": s.color } as CSSProperties}
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-white/[0.12] text-ink-muted transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] hover:text-[var(--brand)] focus-visible:border-[var(--brand)] focus-visible:text-[var(--brand)]"
                    >
                      <SocialIcon name={s.key} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={`tel:${phoneHref}`}
              data-cta="phone"
              data-location="footer"
              onClick={() => trackEvent({ name: "phone_click", params: { location: "footer" } })}
              className="font-display text-base font-bold text-ink-muted transition-colors hover:text-ink"
            >
              {phoneLabel}
            </a>
            {/* Реальна адреса магазину — на кожній сторінці (trust-сигнал + локальний SEO
                під «настільний теніс Харків»). Джерело одне: siteConfig.addressDisplay. */}
            <address className="max-w-[240px] text-left font-body sm:text-right text-[13px] not-italic leading-relaxed text-ink-muted">
              {siteConfig.addressDisplay[locale]}
            </address>
          </div>
        </div>

        {/**
         * ⚠️ Не три рівні третини. У «Каталозі» 10 пунктів, у «Колекціях» — один, тож
         * рівні колонки давали і зайву висоту, і величезну порожнечу праворуч від
         * єдиного посилання. Каталог займає дві частки з чотирьох і всередині ділиться
         * на два стовпчики; решта тримається зліва, а не розтягується на всю ширину.
         */}
        <div className="grid grid-cols-1 gap-x-8 py-5 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.key} className={cn(col.split && "lg:col-span-2")}>
              <FooterColumn column={col} />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border-subtle">
        <div className="container-page flex flex-wrap items-center justify-between gap-2.5 py-4">
          <span className="font-body text-[11px] text-ink-muted">{m.copyright}</span>
          <div className="flex gap-5">
            <Link
              href={`/${locale}/privacy`}
              className="font-body text-[11px] text-ink-muted transition-colors hover:text-ink"
            >
              {m.privacy}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="font-body text-[11px] text-ink-muted transition-colors hover:text-ink"
            >
              {m.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
