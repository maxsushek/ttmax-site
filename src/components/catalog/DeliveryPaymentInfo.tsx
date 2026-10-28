"use client";

// Коротко про доставку й оплату під кнопками покупки на картці товару.
//
// НАВІЩО: на картці не було жодного слова про доставку й оплату — покупець дізнавався про
// вартість і «оплату при отриманні» лише на 2-му кроці оформлення. За дослідженнями Baymard
// неочікувані витрати й неясні умови — головна причина покинутих кошиків.
//
// ⚠️ Жодних чисел руками: терміни — з config/delivery.ts, вартість і поріг безкоштовної
// доставки — з кошика (ті самі site_settings, якими рахує чекаут і /api/orders). Інакше
// картка обіцятиме одне, а рахунок покаже інше.
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { DELIVERY_DAYS, daysLabel } from "@/config/delivery";
import { trackEvent } from "@/lib/analytics/events";
import { formatPrice } from "@/utils/format";
import type { Locale } from "@/i18n/config";

const T = {
  ua: {
    np: "Нова пошта",
    free: "безкоштовно від",
    cod: "Оплата при отриманні — без передоплати",
    more: "Детальніше про доставку й оплату",
    less: "Згорнути",
    handling: "Відправляємо протягом",
    handlingDays: "(пн–пт)",
    ukrposhta: "Укрпошта",
    pickup: "Самовивіз у Харкові — за домовленістю, оплата готівкою або карткою",
    returns: "Повернення та обмін — 14 днів",
    links: { delivery: "Доставка", payment: "Оплата", returns: "Повернення" },
  },
  ru: {
    np: "Новая почта",
    free: "бесплатно от",
    cod: "Оплата при получении — без предоплаты",
    more: "Подробнее о доставке и оплате",
    less: "Свернуть",
    handling: "Отправляем в течение",
    handlingDays: "(пн–пт)",
    ukrposhta: "Укрпочта",
    pickup: "Самовывоз в Харькове — по договорённости, оплата наличными или картой",
    returns: "Возврат и обмен — 14 дней",
    links: { delivery: "Доставка", payment: "Оплата", returns: "Возврат" },
  },
} as const;

export function DeliveryPaymentInfo({ locale }: { locale: Locale }) {
  const t = T[locale];
  const cart = useCart();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) trackEvent({ name: "info_expand", params: { block: "delivery_payment" } });
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.02] px-3.5 py-3 font-body text-[13px] leading-snug text-ink-muted">
      <ul className="space-y-1.5">
        <li className="flex gap-2">
          <span aria-hidden>🚚</span>
          <span>
            {t.np} · {daysLabel(DELIVERY_DAYS.np, locale)} · {formatPrice(cart.shippingFee)},{" "}
            <span className="text-ink">
              {t.free} {formatPrice(cart.freeShippingThreshold)}
            </span>
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden>💵</span>
          <span className="text-ink">{t.cod}</span>
        </li>
      </ul>

      {open && (
        <ul className="mt-2.5 space-y-1.5 border-t border-border-subtle pt-2.5 text-[12px]">
          <li>
            {t.handling} {daysLabel(DELIVERY_DAYS.handling, locale, true)} {t.handlingDays}
          </li>
          <li>
            {t.ukrposhta} · {daysLabel(DELIVERY_DAYS.ukrposhta, locale)} ·{" "}
            {formatPrice(cart.ukrposhtaFee)}
          </li>
          <li>{t.pickup}</li>
          <li>{t.returns}</li>
          <li className="flex flex-wrap gap-x-3 pt-0.5">
            {(["delivery", "payment", "returns"] as const).map((k) => (
              <Link
                key={k}
                href={`/${locale}/${k}`}
                prefetch={false}
                className="text-accent underline-offset-4 hover:underline"
              >
                {t.links[k]}
              </Link>
            ))}
          </li>
        </ul>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="mt-2 font-body text-[12px] text-ink-dim underline underline-offset-4 transition-colors hover:text-ink"
      >
        {open ? t.less : t.more}
      </button>
    </div>
  );
}
