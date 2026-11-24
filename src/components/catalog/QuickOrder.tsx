"use client";

// Швидке замовлення з картки товару: кнопка → модалка з телефоном (обов'язково) та
// іменем (опційно). Сабмит іде в /api/leads (source="quick-order", товар в attribution),
// тобто той самий потік, що й форма-CTA: запис у CRM + Telegram-сповіщення менеджеру.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneField } from "@/components/ui/PhoneField";
// Той самий перелік кодів операторів, що й у чекауті та на бекенді (/api/leads).
import { UA_PHONE, phoneDisplay, phoneE164 } from "@/utils/phone";
import { useCart } from "@/components/cart/CartProvider";
import { trackEvent } from "@/lib/analytics/events";
import { getAttribution } from "@/lib/analytics/attribution";
import { type Locale } from "@/i18n/config";

import { CloseIcon } from "@/components/ui/CloseIcon";
import { ArrowRight } from "@/components/ui/ArrowRight";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

const UI: Record<
  Locale,
  {
    button: string;
    title: string;
    subtitle: string;
    phone: string;
    name: string;
    nameHint: string;
    submit: string;
    submitting: string;
    success: string;
    successHint: string;
    shopPhone: string;
    error: string;
    phoneError: string;
    note: string;
    close: string;
  }
> = {
  ua: {
    button: "Швидке замовлення",
    title: "Швидке замовлення",
    subtitle: "Залиште номер — передзвонимо, уточнимо наявність і оформимо.",
    phone: "Телефон",
    name: "Ім'я",
    nameHint: "не обов'язково",
    submit: "Замовити дзвінок",
    submitting: "Надсилаємо…",
    success: "Дякуємо! Ми передзвонимо найближчим часом.",
    successHint: "Зазвичай телефонуємо протягом робочого дня.",
    shopPhone: "Наш номер:",
    error: "Щось пішло не так. Спробуйте ще раз або зателефонуйте нам.",
    // Той самий текст, що на оформленні (messages.validators.phone): номер у записі поля.
    phoneError: "Перевірте номер. Приклад: +38 (067) 123-45-67",
    note: "Без спаму. Номер потрібен лише для дзвінка щодо замовлення.",
    close: "Закрити",
  },
  ru: {
    button: "Быстрый заказ",
    title: "Быстрый заказ",
    subtitle: "Оставьте номер — перезвоним, уточним наличие и оформим.",
    phone: "Телефон",
    name: "Имя",
    nameHint: "необязательно",
    submit: "Заказать звонок",
    submitting: "Отправляем…",
    success: "Спасибо! Мы перезвоним в ближайшее время.",
    successHint: "Обычно звоним в течение рабочего дня.",
    shopPhone: "Наш номер:",
    error: "Что-то пошло не так. Попробуйте ещё раз или позвоните нам.",
    phoneError: "Проверьте номер. Пример: +38 (067) 123-45-67",
    note: "Без спама. Номер нужен только для звонка по заказу.",
    close: "Закрыть",
  },
};

// Тексти режиму «з кошика»: замість одного товару — весь кошик.
const CART_UI: Record<
  Locale,
  Pick<(typeof UI)["ua"], "button" | "title" | "subtitle" | "submit">
> = {
  ua: {
    button: "Замовити в 1 клік",
    title: "Замовлення в 1 клік",
    subtitle: "Залиште номер — передзвонимо й оформимо весь кошик за вас, без заповнення форми.",
    submit: "Замовити дзвінок",
  },
  ru: {
    button: "Заказать в 1 клик",
    title: "Заказ в 1 клик",
    subtitle: "Оставьте номер — перезвоним и оформим всю корзину за вас, без заполнения формы.",
    submit: "Заказать звонок",
  },
};

// Тексти режиму «консультація» (блог): людина ще не обрала товар — просить підбір.
const CONSULT_UI: Record<
  Locale,
  Pick<(typeof UI)["ua"], "button" | "title" | "subtitle" | "submit" | "success" | "note">
> = {
  ua: {
    button: "Підібрати під мене",
    title: "Підбір інвентарю",
    subtitle: "Залиште номер — розпитаємо про рівень і стиль гри й порадимо основу та накладки.",
    submit: "Чекаю дзвінка",
    success: "Дякуємо! Передзвонимо й допоможемо з вибором.",
    note: "Без спаму. Номер потрібен лише для дзвінка щодо підбору.",
  },
  ru: {
    button: "Подобрать под меня",
    title: "Подбор инвентаря",
    subtitle:
      "Оставьте номер — расспросим об уровне и стиле игры и подскажем основание и накладки.",
    submit: "Жду звонка",
    success: "Спасибо! Перезвоним и поможем с выбором.",
    note: "Без спама. Номер нужен только для звонка по подбору.",
  },
};

export type QuickOrderCart = {
  /** slug — сторінка товару: за ним бот у Telegram бере фото (cards.ts, sendPhotos). */
  items: Array<{ name: string; qty: number; price: number; slug?: string }>;
  total: number;
};

export function QuickOrder({
  locale,
  productSlug = "",
  productName,
  variant = "secondary",
  cart,
  consult = false,
}: {
  locale: Locale;
  productSlug?: string;
  /** Повна назва (бренд + модель) — іде в attribution і в Telegram. У режимі кошика — підпис у вікні. */
  productName: string;
  /** primary — акцентна кнопка (для товарів «ціна за запитом»); secondary — під «В кошик». */
  variant?: "primary" | "secondary";
  /**
   * Режим «з кошика»: склад іде окремим полем `cart` (api/leads пише його в notes і value_uah),
   * source = "cart-quick-order". Звичайне оформлення при цьому лишається — це другий шлях.
   */
  cart?: QuickOrderCart;
  /**
   * Режим «підбір» зі статті блогу (BlogConsult): productName — назва статті, source =
   * "blog-consult". Товару немає, тож slug в attribution не кладемо.
   */
  consult?: boolean;
}) {
  const t = cart
    ? { ...UI[locale], ...CART_UI[locale] }
    : consult
      ? { ...UI[locale], ...CONSULT_UI[locale] }
      : UI[locale];
  // Одне ім'я на source заявки і на location подій — так воронки розділяють картку, кошик і блог.
  const source = cart ? "cart-quick-order" : consult ? "blog-consult" : "quick-order";
  // Телефон магазину — з налаштувань (/admin → контакти), як у підвалі, а не з коду.
  const { shopPhone, shopPhoneDisplay } = useCart();
  const [open, setOpen] = useState(false);
  // Телефон — цифри «0XXXXXXXXX» (ui/PhoneField), а не текст із дужками.
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  // Що саме надіслали — для підсумку на екрані «Дякуємо» (поля після надсилання очищаються).
  const [sent, setSent] = useState<{ phone: string; name: string } | null>(null);
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [phoneErr, setPhoneErr] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  // Tab по колу в межах вікна + повернення фокуса на кнопку після закриття.
  // autoFocus вимкнено: фокус на поле телефону ставить ефект нижче.
  const dialogRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useDialogFocus(open, dialogRef, { autoFocus: false });

  useEffect(() => {
    if (!open) return;
    startedRef.current = false;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // фокус на телефон + блок прокрутки фону
    const tid = setTimeout(() => phoneRef.current?.focus(), 60);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(tid);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const openModal = () => {
    setOpen(true);
    setStatus("idle");
    // Відкрив вікно — «показ форми»; «почав» — лише коли щось увів (onFirstInput).
    // Так воронка відрізняє тих, хто подивився й закрив, від тих, хто почав заповнювати.
    trackEvent({ name: "lead_form_view", params: { location: source } });
  };

  const onFirstInput = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent({ name: "lead_form_start", params: { location: source } });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ⚠️ Клієнтську перевірку лишаємо (економить зайвий запит), але вона НЕ є захистом:
    // бот шле POST напряму, минаючи цей код. Тому honeypot тепер їде на сервер у полі
    // `company` і відсіюється там (api/leads/route.ts).
    if (honey) return;
    if (status === "submitting") return;

    if (!UA_PHONE.test(phone)) {
      setPhoneErr(true);
      phoneRef.current?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          phone: phoneE164(phone),
          // Honeypot на сервер: у людини поле лишається порожнім, бот його заповнює.
          company: honey,
          source,
          locale,
          // Для кошика товар не кладемо в attribution: картка в Telegram зробила б з нього
          // посилання на неіснуючу сторінку. Склад — у полі cart.
          attribution: cart
            ? getAttribution()
            : consult
              ? { ...getAttribution(), product: productName }
              : { ...getAttribution(), product: productName, productSlug },
          ...(cart ? { cart } : {}),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackEvent({ name: "lead_form_submit", params: { location: source } });
      trackEvent({ name: "conversion", params: { type: "lead" } });
      setSent({ phone, name: name.trim() });
      setStatus("success");
      setPhone("");
      setName("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant === "primary" ? "primary" : "outline"}
        size="lg"
        fullWidth
        // Контурна кнопка — теж «замовити», тож той самий відблиск, але тихіший
        // (primary вже має cta-sheen з варіанта Button).
        className={variant === "primary" ? undefined : "cta-sheen cta-sheen--soft"}
        onClick={openModal}
        data-cta={source}
        data-location={productSlug || source}
      >
        {t.button}
      </Button>

      {open && (
        // ⚠️ z-[900], а не z-[100]: з кошика вікно відкривається поверх шухляди кошика (z-[810]),
        // інакше воно опинилося б під нею і кнопка «1 клік» нічого б не показувала.
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          className="fixed inset-0 z-[900] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-3xl border border-border-subtle bg-bg-raised p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-ink">
                  {t.title}
                </h2>
                <p className="mt-1 font-body text-[13px] leading-snug text-ink-muted">
                  {t.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="shrink-0 rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                <span aria-hidden className="text-xl leading-none">
                  <CloseIcon />
                </span>
              </button>
            </div>

            <p className="mb-4 rounded-xl border border-border-subtle bg-white/[0.03] px-3.5 py-2.5 font-body text-[13px] text-ink-muted">
              {consult ? "📖" : "🛒"} <span className="font-semibold text-ink">{productName}</span>
            </p>

            {status === "success" ? (
              // Екран «заявку прийнято» — як у формі запису sparkservice: галочка, що домальовується,
              // і підсумок із номером, на який зателефонують (у записі «+38 (0XX) XXX-XX-XX»).
              <div className="flex flex-col items-center py-4 text-center">
                <svg viewBox="0 0 52 52" fill="none" aria-hidden className="mb-4 h-[72px] w-[72px]">
                  <circle cx="26" cy="26" r="25" className="fill-success/[0.12]" />
                  <path
                    d="M15 27l7 7 15-16"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="36"
                    strokeDashoffset="36"
                    className="animate-draw-check stroke-success motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
                  />
                </svg>
                <p className="font-display text-base font-bold text-ink">{t.success}</p>
                <p className="mt-1 font-body text-[12px] text-ink-muted">{t.successHint}</p>
                {sent && (
                  // ph-mask / ph-no-capture: номер та ім'я не йдуть ні в запис сеансу, ні в текст кліків.
                  <dl className="ph-mask ph-no-capture mt-4 grid w-full gap-1.5 rounded-xl bg-white/[0.04] px-4 py-3 text-left font-body text-[13px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">{t.phone}</dt>
                      <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
                        {phoneDisplay(sent.phone)}
                      </dd>
                    </div>
                    {sent.name && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">{t.name}</dt>
                        <dd className="min-w-0 break-words text-right font-semibold text-ink">
                          {sent.name}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
                {/* py-3 -my-3 — зона дотику 44 px: нижче, за 16 px, кнопка «Закрити». */}
                <p className="mt-3 font-body text-[12px] text-ink-muted">
                  {t.shopPhone}{" "}
                  <a
                    href={`tel:${shopPhone}`}
                    onClick={() =>
                      trackEvent({ name: "phone_click", params: { location: `${source}-success` } })
                    }
                    className="-my-3 inline-block whitespace-nowrap py-3 font-semibold text-ink underline decoration-white/30 underline-offset-[3px]"
                  >
                    {shopPhoneDisplay}
                  </a>
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 font-body text-[13px] text-accent underline hover:no-underline"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5">
                {/* Honeypot */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <input
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honey}
                    onChange={(e) => setHoney(e.target.value)}
                  />
                </div>

                {/* Те саме поле телефону, що й на оформленні: «+38», маска, крапки, оператор.
                    Помилку показуємо після спроби надіслати або коли вийшли з поля з неповним номером;
                    порожнє поле не підсвічуємо — це ще не помилка. */}
                <PhoneField
                  label={t.phone}
                  required
                  locale={locale}
                  inputRef={phoneRef}
                  value={phone}
                  onChange={(digits) => {
                    setPhone(digits);
                    setPhoneErr(false);
                    onFirstInput();
                  }}
                  onBlur={() => {
                    if (phone && !UA_PHONE.test(phone)) setPhoneErr(true);
                  }}
                  error={phoneErr ? t.phoneError : undefined}
                />

                <Input
                  label={t.name}
                  optional
                  optionalLabel={t.nameHint}
                  autoComplete="name"
                  maxLength={120}
                  placeholder={t.name}
                  value={name}
                  onValueChange={(val) => {
                    setName(val);
                    onFirstInput();
                  }}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={status === "submitting"}
                  className="mt-1"
                  data-cta={`${source}-submit`}
                  data-location={productSlug || source}
                >
                  {status === "submitting" ? (
                    t.submitting
                  ) : (
                    <>
                      {t.submit}
                      <ArrowRight />
                    </>
                  )}
                </Button>

                {status === "error" && (
                  <p role="alert" className="text-center font-body text-xs text-danger">
                    ⚠ {t.error}
                  </p>
                )}
                <p className="mt-1 text-center font-body text-[11px] text-ink-dim">{t.note}</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
