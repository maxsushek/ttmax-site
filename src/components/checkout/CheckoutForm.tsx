"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, formatCardExp, formatCardNumber, formatPhone } from "@/utils/format";
import { validateName, validators, type FieldKey } from "@/utils/validators";
import { trackEvent } from "@/lib/analytics/events";
import { AVAILABLE_PAYMENT_METHODS, COD_ONLY, DEFAULT_PAYMENT_METHOD } from "@/config/payment";
import { CURRENCY, toAnalyticsItems } from "@/lib/analytics/ecommerce";
import { getAttribution } from "@/lib/analytics/attribution";
import { siteConfig } from "@/config/site";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { computeShipping } from "@/lib/checkout/shipping";
import { splitCartModel } from "@/lib/cart/line";

type Delivery = "np" | "ukrposhta" | "pickup";
type Payment = "apple" | "cod" | "card";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  npBranch: string;
  /** Відділення Укрпошти (індекс або адреса) — окремо від НП, щоб номер відділення НП не «переїхав» сюди. */
  ukrBranch: string;
  delivery: Delivery;
  payment: Payment;
  cardNum: string;
  cardExp: string;
  cardCvv: string;
};

/** Текстові поля першого кроку (усі — рядки у FormState). */
type Step1Field = "fullName" | "phone" | "email" | "city" | "npBranch" | "ukrBranch";

type Props = {
  messages: Messages;
  locale: Locale;
  onClose: () => void;
  onComplete: () => void;
  logoUrl?: string;
};

export function CheckoutForm({ messages, locale, onClose, onComplete, logoUrl }: Props) {
  const cart = useCart();
  const m = messages.checkout;
  const v = messages.validators;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const methodLabelId = useId();
  const [done, setDone] = useState<Array<1 | 2>>([]);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    npBranch: "",
    ukrBranch: "",
    delivery: "np",
    // Не «cod» рядком: дефолт іде з конфігу, щоб при поверненні онлайн-оплати
    // не лишився вибраним спосіб, якого вже немає в переліку (або навпаки).
    payment: DEFAULT_PAYMENT_METHOD,
    cardNum: "",
    cardExp: "",
    cardCvv: "",
  });

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (typeof value === "string") {
      setErrors((p) => ({ ...p, [key]: "" }));
    }
  }, []);

  // ⚠️ Рахуємо через спільну computeShipping — ту саму, якою рахує /api/orders.
  // Раніше тут була формула без урахування способу доставки, тож «Самовивіз ·
  // Безкоштовно» усе одно додавав 90 грн до рахунку. Не повертати локальну формулу:
  // щойно клієнт і сервер порахують по-різному, замовлення почнуть відхилятись.
  const shipping = computeShipping({
    method: form.delivery,
    subtotal: cart.total,
    freeShippingThreshold: cart.freeShippingThreshold,
    shippingFee: cart.shippingFee,
    ukrposhtaFee: cart.ukrposhtaFee,
  });
  const total = cart.total + shipping;

  // Ціна біля кожного способу доставки — рахуємо тією ж computeShipping, а не пишемо
  // числом у словнику. ⚠️ Саме через зашите в словник число підпис «Укрпошта · ~30 грн»
  // місяцями розходився з реальними 90 грн у рахунку. Тепер підпис фізично не може
  // розійтись із сумою: обидва беруться з однієї функції та одних налаштувань.
  const feeFor = (method: Delivery) =>
    computeShipping({
      method,
      subtotal: cart.total,
      freeShippingThreshold: cart.freeShippingThreshold,
      shippingFee: cart.shippingFee,
      ukrposhtaFee: cart.ukrposhtaFee,
    });

  /**
   * ⚠️ ПОЛЯ АДРЕСИ ЗАЛЕЖАТЬ ВІД СПОСОБУ ДОСТАВКИ (23.11.2026) — і перевірка разом із ними.
   *
   * Було: «Місто» й «Відділення НП» обов'язкові за будь-якого способу. Покупець обирав
   * «Самовивіз», а форма вимагала відділення Нової Пошти: 15.11.2026 людина п'ять разів
   * за 12 секунд натиснула «Далі», доки не вписала в поле будь-що (PostHog, checkout_error:
   * 8 із 12 помилок — лише npBranch). Для Укрпошти те саме поле називалось «Відділення НП».
   *
   * Тепер: НП — місто й відділення/поштомат; Укрпошта — місто й індекс або адреса свого
   * відділення (окреме поле ukrBranch); самовивіз — без адреси взагалі. Не повертати спільний
   * перелік обов'язкових полів: сервер (/api/orders) місто й відділення не вимагає свідомо.
   */
  const addressFields = (method: Delivery): Array<"city" | "npBranch" | "ukrBranch"> =>
    method === "np" ? ["city", "npBranch"] : method === "ukrposhta" ? ["city", "ukrBranch"] : [];

  const setDelivery = (method: Delivery) => {
    setForm((p) => ({ ...p, delivery: method }));
    // Введені значення НЕ чистимо: за випадковий дотик не карають. Помилки — лише ті, що
    // змінюються разом зі способом:
    //  • відділення — поле іншого перевізника, його помилка нового поля не стосується;
    //  • ім'я — правило залежить від способу (самовивіз приймає саме ім'я), тож заповнене
    //    поле перевіряємо за новим правилом одразу: інакше «Іван» лишався б із зеленою
    //    позначкою після переходу на Нову Пошту, де потрібне прізвище;
    //  • місто — правило те саме для обох перевізників, помилку не чіпаємо; при самовивозі
    //    поля немає.
    const nameRule = method === "pickup" ? validateName : validators.fullName;
    setErrors((p) => ({
      ...p,
      // Порожнє поле без помилки не чіпаємо: людина до нього ще не дійшла.
      fullName: form.fullName.trim() || p.fullName ? nameRule(form.fullName, v) : "",
      city: method === "pickup" ? "" : p.city,
      npBranch: "",
      ukrBranch: "",
    }));
  };

  /**
   * Одна перевірка поля — і для виходу з поля, і для «Далі», і для повторної перевірки перед
   * відправленням. Самовивіз: прізвище потрібне перевізнику, а не магазину, тож досить імені.
   */
  const fieldError = (key: Step1Field): string =>
    key === "fullName" && form.delivery === "pickup"
      ? validateName(form.fullName, v)
      : validators[key](form[key], v);

  const validate1 = () => {
    const errs: Partial<Record<FieldKey, string>> = {};
    (["fullName", "phone", ...addressFields(form.delivery), "email"] as const).forEach((k) => {
      const err = fieldError(k);
      if (err) errs[k] = err;
    });
    return errs;
  };

  // Вийшли з поля — показуємо помилку одразу. В аналітику — лише помилку формату (поле не
  // порожнє), раз на поле й без значення: «Далі» могли й не натиснути (05.11.2026 покупець
  // чотири хвилини заповнював форму й пішов — причини в даних не було).
  const blurReported = useRef<Set<Step1Field>>(new Set());
  const blurCheck = (key: Step1Field) => {
    const err = fieldError(key);
    setErrors((p) => ({ ...p, [key]: err }));
    if (err && form[key].trim() && !blurReported.current.has(key)) {
      blurReported.current.add(key);
      trackEvent({
        name: "checkout_field_error",
        params: { field: key, shipping_tier: form.delivery },
      });
    }
  };

  const validate2 = () => {
    const errs: Partial<Record<FieldKey, string>> = {};
    if (form.payment === "card") {
      (["cardNum", "cardExp", "cardCvv"] as const).forEach((k) => {
        const err = validators[k](form[k], v);
        if (err) errs[k] = err;
      });
    }
    return errs;
  };

  // Аналітика кроків: лише назви полів і способи, без введених даних покупця.
  const stepItems = () => toAnalyticsItems(cart.items);
  const reportErrors = (step: number, errs: Partial<Record<FieldKey, string>>) => {
    const fields = Object.keys(errs);
    trackEvent({
      name: "checkout_error",
      params: {
        step,
        fields: fields.join(","),
        count: fields.length,
        shipping_tier: form.delivery,
      },
    });
    // На телефоні перше хибне поле часто вище екрана або під клавіатурою: показуємо його й
    // ставимо курсор, щоб було видно, чому «Далі» не спрацювало. Після рендера помилок.
    requestAnimationFrame(() => {
      const el = rootRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]');
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
    });
  };

  const goStep2 = () => {
    const errs = validate1();
    if (Object.keys(errs).length) {
      setErrors(errs);
      reportErrors(1, errs);
      return;
    }
    trackEvent({
      name: "add_shipping_info",
      params: { currency: CURRENCY, value: total, items: stepItems(), shippingTier: form.delivery },
    });
    setDone((p) => Array.from(new Set([...p, 1])) as Array<1 | 2>);
    setStep(2);
  };

  /**
   * ⚠️ З ПЕРШОГО КРОКУ ВИХОДЯТЬ ЛИШЕ ЧЕРЕЗ ПЕРЕВІРКУ (23.11.2026).
   * Заголовок кроку «Оплата» відкривався, щойно перший крок був пройдений хоч раз. Тож можна
   * було натиснути «Змінити», стерти місто або змінити перевізника (поле його відділення
   * порожнє) і піти далі через заголовок — замовлення йшло без адреси. Тепер повернення на
   * перший крок знімає позначки «пройдено», а перед другим кроком і перед відправленням
   * перший крок перевіряється ще раз.
   */
  const reopenStep1 = () => {
    setDone([]);
    setStep(1);
  };
  /** Перший крок не проходить перевірку — повертаємо на нього й показуємо, що виправити. */
  const step1Blocked = (): boolean => {
    const errs = validate1();
    if (Object.keys(errs).length === 0) return false;
    setErrors(errs);
    reopenStep1();
    reportErrors(1, errs);
    return true;
  };

  const goStep3 = () => {
    if (step1Blocked()) return;
    const errs = validate2();
    if (Object.keys(errs).length) {
      setErrors(errs);
      reportErrors(2, errs);
      return;
    }
    trackEvent({
      name: "add_payment_info",
      params: { currency: CURRENCY, value: total, items: stepItems(), paymentType: form.payment },
    });
    setDone((p) => Array.from(new Set([...p, 2])) as Array<1 | 2>);
    setStep(3);
  };

  // Локальные строки для submit — чтобы не модифицировать messages/uk.ts и ru.ts.
  // Если позже захочешь — перенеси в i18n.
  const t = {
    sending: locale === "ua" ? "Надсилаємо…" : "Отправляем…",
    submitError:
      locale === "ua"
        ? "Не вдалося оформити замовлення. Спробуйте ще раз."
        : "Не удалось оформить заказ. Попробуйте ещё раз.",
    emptyCart: locale === "ua" ? "Кошик порожній." : "Корзина пуста.",
  };

  const submitOrder = async () => {
    if (submitting) return;
    if (cart.items.length === 0) {
      setSubmitError(t.emptyCart);
      return;
    }
    if (step1Blocked()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.fullName.trim(),
            phone: form.phone,
            email: form.email.trim() || null,
          },
          // Адреса — лише та, що стосується обраного способу: при самовивозі її немає,
          // а введене раніше для іншого перевізника в замовлення не йде.
          delivery: {
            method: form.delivery,
            city: form.delivery === "pickup" ? null : form.city.trim() || null,
            branch:
              form.delivery === "np"
                ? form.npBranch.trim() || null
                : form.delivery === "ukrposhta"
                  ? form.ukrBranch.trim() || null
                  : null,
          },
          payment: {
            method: form.payment,
          },
          items: cart.items.map((item) => ({
            productId: item.id,
            brand: item.brand,
            model: item.model,
            category: item.category,
            emoji: item.emoji,
            price: item.price,
            qty: item.qty,
          })),
          totals: {
            subtotal: cart.total,
            shipping,
            total,
          },
          agreed: true,
          locale,
          attribution: getAttribution(),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        ok: boolean;
        persisted?: boolean;
        orderId?: string;
        orderNumber?: string;
      };

      // Префикс # для отображения; fallback на локальный ID если backend без Supabase
      const displayId = data.orderNumber
        ? `#${data.orderNumber}`
        : "#TT" + Math.floor(Math.random() * 90000 + 10000);

      setOrderId(displayId);
      setOrdered(true);

      trackEvent({
        name: "purchase",
        params: {
          currency: CURRENCY,
          value: total,
          transactionId: data.orderNumber ?? displayId,
          shipping,
          items: toAnalyticsItems(cart.items),
        },
      });
      trackEvent({ name: "conversion", params: { type: "purchase", value: total } });

      // Очищаем кошик после успешного заказа
      cart.clear();
    } catch (err) {
      console.error("Order submit failed:", err);
      // HTTP-статус або тип мережевої помилки — щоб бачити втрачені замовлення.
      trackEvent({
        name: "order_failed",
        params: { reason: err instanceof Error ? err.message.slice(0, 60) : "unknown" },
      });
      setSubmitError(t.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  // Підсумок кроку «Доставка» у згорнутому вигляді: спосіб і адреса саме цього способу.
  const deliverySummary =
    form.delivery === "pickup"
      ? m.delivery.pickupTitle
      : [
          m.delivery[form.delivery].label,
          [form.city, form.delivery === "np" ? form.npBranch : form.ukrBranch]
            .map((x) => x.trim())
            .filter(Boolean)
            .join(", "),
        ]
          .filter(Boolean)
          .join(" · ");

  // Закрили оформлення, не замовивши: на якому кроці й які поля встигли заповнити
  // (лише назви полів, без значень) — щоб бачити, де саме люди йдуть.
  const closeCheckout = () => {
    trackEvent({
      name: "checkout_close",
      params: {
        step,
        shipping_tier: form.delivery,
        filled: (["fullName", "phone", "city", "npBranch", "ukrBranch", "email"] as const)
          .filter((k) => form[k].trim())
          .join(","),
      },
    });
    onClose();
  };

  const STEPS: Array<{ n: 1 | 2 | 3; label: string }> = useMemo(
    () => [
      { n: 1, label: m.steps.delivery },
      { n: 2, label: m.steps.payment },
      { n: 3, label: m.steps.confirm },
    ],
    [m.steps],
  );

  const stepCircleCls = (n: 1 | 2 | 3) =>
    cn(
      "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full",
      "font-display text-xs font-black text-bg-base transition-all duration-300",
      done.includes(n as 1 | 2) ? "bg-success" : step === n ? "bg-accent" : "bg-white/10",
    );

  const sectionBoxCls = (n: 1 | 2 | 3) =>
    cn(
      "mb-3 overflow-hidden rounded-2xl bg-bg-raised transition-colors",
      step === n
        ? "border border-accent/20"
        : done.includes(n as 1 | 2)
          ? "border border-success/20"
          : "border border-border-subtle",
      !done.includes((n - 1) as 1 | 2) && step !== n && n > 1 && "opacity-45",
    );

  if (ordered) {
    return (
      <div className="fixed inset-0 z-[910] flex flex-col items-center justify-center bg-bg-base p-6 text-center">
        <div aria-hidden className="mb-5 animate-check-bounce text-7xl">
          🎉
        </div>
        <h2 className="mb-3 font-display text-3xl font-black uppercase">{m.success.title}</h2>
        <p className="mb-2 font-body text-base text-ink-muted">
          {m.success.orderNumber} <strong className="text-accent">{orderId}</strong>
        </p>
        {/* ph-mask ховає текст у записі сеансу, ph-no-capture — в автозахопленні кліків
            (інакше дотик до абзацу слав би номер у PostHog як текст елемента).
            ⚠️ Замовлення підтверджують дзвінком — тому тут номер, на який зателефонують (покупець
            ще й бачить, чи не помилився в ньому), а не обіцянка листа: листів сайт не надсилає.
            Нерозривні пробіли — щоб номер не розірвало перенесенням рядка. */}
        <p className="ph-mask ph-no-capture mb-8 max-w-[320px] font-body text-sm text-ink-dim">
          {m.success.callNote.replace("{phone}", form.phone.replace(/ /g, "\u00A0"))}{" "}
          {form.delivery === "pickup" ? m.success.pickupNote : m.success.deliveryNote}
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            onComplete();
            onClose();
          }}
        >
          {m.success.back}
        </Button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="fixed inset-0 z-[910] overflow-y-auto bg-bg-base">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-base/95 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={siteConfig.name}
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <>
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base"
              >
                {siteConfig.emoji}
              </span>
              <span className="font-display text-lg font-black uppercase tracking-[0.06em]">
                TT<span className="text-accent">{siteConfig.brandSuffix}</span>
              </span>
            </>
          )}
        </div>
        {/* «Безпечна оплата» із замком натякала на оплату карткою, якої немає: людина йшла
            шукати її на кроці «Оплата». Поки спосіб один — кажемо прямо, як платити. */}
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{COD_ONLY ? "💵" : "🔒"}</span>
          <span className="font-body text-xs text-ink-dim">
            {COD_ONLY ? m.payment.cod.label : m.secureCheckout}
          </span>
        </div>
        <button
          type="button"
          onClick={closeCheckout}
          aria-label={messages.common.close}
          // -m-2 p-3: зона дотику 44 px замість 26 — хрестик стоїть у кутку липкої шапки.
          className="-m-2 p-3 text-lg text-ink-dim transition-colors hover:text-ink"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Progress */}
      <div className="border-b border-border-subtle bg-white/[0.03] px-5 py-3.5">
        <div className="mx-auto flex max-w-[640px] items-center">
          {STEPS.map((s, i) => (
            <span key={s.n} className="flex flex-1 items-center last:flex-initial">
              <span className="flex flex-col items-center gap-1.5">
                <span className={stepCircleCls(s.n)}>
                  {done.includes(s.n as 1 | 2) ? "✓" : s.n}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-[0.1em]",
                    step === s.n
                      ? "text-accent"
                      : done.includes(s.n as 1 | 2)
                        ? "text-success"
                        : "text-ink-ghost",
                  )}
                >
                  {s.label}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-2 mb-5 h-px flex-1 transition-colors duration-[400ms]",
                    done.includes(s.n as 1 | 2) ? "bg-success/40" : "bg-white/10",
                  )}
                />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-5 px-4 py-6 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1fr_340px] lg:content-center lg:py-10">
        {/* Form column */}
        <div>
          {/* Step 1 */}
          <div className={sectionBoxCls(1)}>
            <button
              type="button"
              onClick={() => done.includes(1) && reopenStep1()}
              className="flex w-full items-center justify-between bg-transparent p-6"
              disabled={!done.includes(1) && step !== 1}
            >
              <span className="flex items-center gap-3.5">
                <span className={stepCircleCls(1)}>{done.includes(1) ? "✓" : 1}</span>
                <span className="text-left">
                  <span
                    className={cn(
                      "block font-display text-base font-bold uppercase tracking-[0.06em]",
                      step === 1 ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {m.steps.delivery}
                  </span>
                  {done.includes(1) && (
                    <>
                      {/**
                       * ⚠️ ph-no-capture ОБОВ'ЯЗКОВИЙ на обох рядках — не прибирати.
                       * Цей заголовок — <button>, а posthog-js до кожного кліку по кнопці додає
                       * текст усіх вкладених <span> ($el_text, $elements_chain). ph-mask ховає
                       * текст лише в ЗАПИСІ сеансу; без ph-no-capture місто, відділення, ім'я й
                       * телефон покупця йшли б в аналітику з кожним натисканням «Змінити».
                       */}
                      <span className="ph-mask ph-no-capture mt-0.5 block font-body text-xs text-success">
                        ✓ {deliverySummary}
                      </span>
                      {/* Ім'я й телефон — щоб на підтвердженні було видно, куди подзвонять:
                          помилка в номері губить замовлення з оплатою при отриманні. */}
                      <span className="ph-mask ph-no-capture mt-0.5 block font-body text-xs text-ink-muted">
                        {form.fullName.trim()} ·{" "}
                        <span className="whitespace-nowrap">{form.phone}</span>
                      </span>
                    </>
                  )}
                </span>
              </span>
              {done.includes(1) && (
                <span className="border-b border-accent/30 font-body text-xs text-accent">
                  {m.edit}
                </span>
              )}
            </button>

            {step === 1 && (
              <div className="px-6 pb-6 pt-1">
                <div
                  id={methodLabelId}
                  className="mb-2.5 font-body text-xs font-medium text-ink-muted"
                >
                  {m.delivery.method}
                </div>
                <div
                  role="group"
                  aria-labelledby={methodLabelId}
                  className="mb-6 flex flex-col gap-2"
                >
                  {[
                    { v: "np" as const, icon: "📦", ...m.delivery.np },
                    { v: "ukrposhta" as const, icon: "✉️", ...m.delivery.ukrposhta },
                    { v: "pickup" as const, icon: "🏪", ...m.delivery.pickup },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setDelivery(opt.v)}
                      aria-pressed={form.delivery === opt.v}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all",
                        form.delivery === opt.v
                          ? "border-[1.5px] border-accent bg-accent/[0.06]"
                          : "border-[1.5px] border-border-subtle bg-white/[0.02] hover:bg-white/[0.04]",
                      )}
                    >
                      <span aria-hidden className="shrink-0 text-[22px]">
                        {opt.icon}
                      </span>
                      <span className="flex-1">
                        <span
                          className={cn(
                            "block font-display text-[15px] font-bold",
                            form.delivery === opt.v ? "text-accent" : "text-ink",
                          )}
                        >
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block font-body text-xs text-ink-dim">
                          {opt.sub}
                        </span>
                      </span>
                      {/* Ціна саме цього способу — з computeShipping, не зі словника. */}
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap font-display text-[13px] font-bold",
                          feeFor(opt.v) === 0 ? "text-accent" : "text-ink-muted",
                        )}
                      >
                        {feeFor(opt.v) === 0 ? messages.cart.free : formatPrice(feeFor(opt.v))}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "h-5 w-5 shrink-0 rounded-full border-2 transition-all",
                          form.delivery === opt.v
                            ? "border-accent bg-accent"
                            : "border-white/20 bg-transparent",
                        )}
                      />
                    </button>
                  ))}
                </div>

                <div className="mb-2.5 font-body text-xs font-medium text-ink-muted">
                  {m.delivery.contact}
                </div>
                <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                  <div className="col-span-full">
                    <Input
                      label={m.delivery.fields.fullName}
                      placeholder={m.delivery.fields.fullNamePlaceholder}
                      required
                      autoComplete="name"
                      maxLength={120}
                      value={form.fullName}
                      onValueChange={(val) => update("fullName", val)}
                      error={errors.fullName}
                      onBlurValidate={() => blurCheck("fullName")}
                    />
                  </div>
                  <div className="col-span-full">
                    <Input
                      label={m.delivery.fields.phone}
                      placeholder={m.delivery.fields.phonePlaceholder}
                      required
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phone}
                      onValueChange={(val) => update("phone", formatPhone(val))}
                      error={errors.phone}
                      onBlurValidate={() => blurCheck("phone")}
                    />
                  </div>
                  {form.delivery === "pickup" ? (
                    // Самовивіз: адреса покупця не потрібна — замість полів кажемо, куди їхати
                    // (адреса магазину з siteConfig — та сама, що в підвалі й на «Оплаті») і що далі.
                    <div
                      role="note"
                      className="col-span-full mb-4 rounded-xl border border-border-subtle bg-white/[0.03] px-4 py-3.5"
                    >
                      <div className="font-display text-[15px] font-bold text-ink">
                        {m.delivery.pickupTitle}
                      </div>
                      <p className="mt-1 font-body text-[13px] leading-snug text-ink-muted">
                        {m.delivery.pickupNote.replace(
                          "{address}",
                          siteConfig.addressDisplay[locale],
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Input
                        key="city"
                        label={m.delivery.fields.city}
                        placeholder={m.delivery.fields.cityPlaceholder}
                        required
                        autoComplete="address-level2"
                        maxLength={120}
                        value={form.city}
                        onValueChange={(val) => update("city", val)}
                        error={errors.city}
                        onBlurValidate={() => blurCheck("city")}
                      />
                      {/* key — щоб при зміні перевізника поле змонтувалось заново (без «зеленої
                          галочки» й тексту від попереднього). */}
                      {form.delivery === "np" ? (
                        <Input
                          key="npBranch"
                          label={m.delivery.fields.npBranch}
                          placeholder={m.delivery.fields.npBranchPlaceholder}
                          required
                          maxLength={240}
                          value={form.npBranch}
                          onValueChange={(val) => update("npBranch", val)}
                          error={errors.npBranch}
                          onBlurValidate={() => blurCheck("npBranch")}
                        />
                      ) : (
                        <Input
                          key="ukrBranch"
                          label={m.delivery.fields.ukrBranch}
                          placeholder={m.delivery.fields.ukrBranchPlaceholder}
                          required
                          autoComplete="postal-code"
                          maxLength={240}
                          value={form.ukrBranch}
                          onValueChange={(val) => update("ukrBranch", val)}
                          error={errors.ukrBranch}
                          onBlurValidate={() => blurCheck("ukrBranch")}
                        />
                      )}
                    </>
                  )}
                </div>
                <Input
                  label={m.delivery.fields.email}
                  placeholder={m.delivery.fields.emailPlaceholder}
                  type="email"
                  autoComplete="email"
                  optional
                  optionalLabel={m.delivery.optional}
                  maxLength={254}
                  value={form.email}
                  onValueChange={(val) => update("email", val)}
                  error={errors.email}
                  onBlurValidate={() => blurCheck("email")}
                />

                {/**
                 * ⚠️ СКІЛЬКИ Й ЯК ПЛАТИТИ — ДО КНОПКИ «ДАЛІ» (23.11.2026).
                 * На телефоні підсумок замовлення видно лише на третьому кроці, а про оплату
                 * каже другий. Троє з ~18 покупців натиснули «Далі» з порожньою формою —
                 * схоже, щоб побачити саме це (PostHog, checkout_error), і двоє з них пішли.
                 * Сума — тією ж computeShipping, що й рахунок; рядок про оплату — лише поки
                 * оплата при отриманні єдина (COD_ONLY). Не писати «до сплати N грн»:
                 * перевізник додає до накладеного платежу свою комісію.
                 */}
                <div className="mb-4 mt-1 flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 lg:hidden">
                    <span className="font-body text-[13px] text-ink-muted">
                      {shipping > 0
                        ? m.delivery.totalWithDelivery
                        : form.delivery === "pickup"
                          ? messages.cart.total
                          : m.delivery.totalFreeDelivery}
                    </span>
                    <span className="shrink-0 font-display text-lg font-black text-ink">
                      {formatPrice(total)}
                    </span>
                  </div>
                  {COD_ONLY && (
                    <p className="flex items-center gap-2 font-body text-[13px] text-ink">
                      <span aria-hidden>💵</span>
                      {form.delivery === "pickup" ? m.delivery.payNotePickup : m.delivery.payNote}
                    </p>
                  )}
                </div>

                <Button variant="primary" size="lg" fullWidth onClick={goStep2}>
                  {m.delivery.next} →
                </Button>

                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <span aria-hidden className="text-[13px]">
                    🔒
                  </span>
                  <span className="font-body text-[11px] text-ink-ghost">
                    {m.delivery.trustNote}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className={sectionBoxCls(2)}>
            <button
              type="button"
              onClick={() => done.includes(1) && setStep(2)}
              disabled={!done.includes(1)}
              className="flex w-full items-center justify-between bg-transparent p-6"
            >
              <span className="flex items-center gap-3.5">
                <span className={stepCircleCls(2)}>{done.includes(2) ? "✓" : 2}</span>
                <span className="text-left">
                  <span
                    className={cn(
                      "block font-display text-base font-bold uppercase tracking-[0.06em]",
                      step === 2 ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {m.steps.payment}
                  </span>
                  {done.includes(2) && (
                    <span className="mt-0.5 block font-body text-xs text-success">
                      ✓{" "}
                      {form.payment === "apple"
                        ? m.payment.apple.label
                        : form.payment === "card"
                          ? m.payment.card.label
                          : m.payment.cod.label}
                    </span>
                  )}
                </span>
              </span>
              {done.includes(2) && (
                <span className="border-b border-accent/30 font-body text-xs text-accent">
                  {m.edit}
                </span>
              )}
            </button>

            {step === 2 && (
              <div className="px-6 pb-6 pt-1">
                <div className="mb-2.5 font-body text-xs font-medium text-ink-muted">
                  {m.payment.method}
                </div>
                <div className="mb-5 flex flex-col gap-2">
                  {/**
                   * ⚠️ Перелік фільтрується по AVAILABLE_PAYMENT_METHODS, а не задається тут.
                   * Онлайн-оплата вимкнена (config/payment.ts): картка й Apple Pay збирали дані,
                   * але нікуди їх не надсилали — покупець думав, що заплатив, а гроші не
                   * списувались. Не додавати способи прямо в цей масив: список мусить лишатись
                   * похідним від конфігу, інакше UI розійдеться з валідацією в /api/orders.
                   */}
                  {[
                    { v: "apple" as const, icon: "📱", ...m.payment.apple },
                    {
                      v: "cod" as const,
                      icon: "💵",
                      ...m.payment.cod,
                      // При самовивозі «оплата при отриманні в НП» — неправда: людина платить
                      // у магазині. Підпис іде за обраною доставкою, щоб текст не суперечив дії.
                      sub: form.delivery === "pickup" ? m.payment.codPickup : m.payment.cod.sub,
                    },
                    { v: "card" as const, icon: "💳", ...m.payment.card },
                  ]
                    .filter((opt) => AVAILABLE_PAYMENT_METHODS.includes(opt.v))
                    .map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => update("payment", opt.v)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all",
                          form.payment === opt.v
                            ? "border-[1.5px] border-accent bg-accent/[0.06]"
                            : "border-[1.5px] border-border-subtle bg-white/[0.02] hover:bg-white/[0.04]",
                        )}
                      >
                        <span aria-hidden className="shrink-0 text-[22px]">
                          {opt.icon}
                        </span>
                        <span className="flex-1">
                          <span
                            className={cn(
                              "block font-display text-[15px] font-bold",
                              form.payment === opt.v ? "text-accent" : "text-ink",
                            )}
                          >
                            {opt.label}
                          </span>
                          <span className="mt-0.5 block font-body text-xs text-ink-dim">
                            {opt.sub}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full border-2 transition-all",
                            form.payment === opt.v
                              ? "border-accent bg-accent"
                              : "border-white/20 bg-transparent",
                          )}
                        />
                      </button>
                    ))}
                </div>

                {form.payment === "card" && (
                  <div className="mb-4 rounded-xl border border-border-subtle bg-white/[0.03] p-4">
                    <div className="grid grid-cols-2 gap-x-3">
                      <div className="col-span-full">
                        <Input
                          label={m.payment.cardNum}
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          value={form.cardNum}
                          onValueChange={(val) => update("cardNum", formatCardNumber(val))}
                          error={errors.cardNum}
                          onBlurValidate={() =>
                            setErrors((p) => ({
                              ...p,
                              cardNum: validators.cardNum(form.cardNum, v),
                            }))
                          }
                        />
                      </div>
                      <Input
                        label={m.payment.cardExp}
                        placeholder="MM/РР"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={form.cardExp}
                        onValueChange={(val) => update("cardExp", formatCardExp(val))}
                        error={errors.cardExp}
                        onBlurValidate={() =>
                          setErrors((p) => ({
                            ...p,
                            cardExp: validators.cardExp(form.cardExp, v),
                          }))
                        }
                      />
                      <Input
                        label={m.payment.cardCvv}
                        placeholder="•••"
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={form.cardCvv}
                        onValueChange={(val) => update("cardCvv", val.replace(/\D/g, ""))}
                        error={errors.cardCvv}
                        onBlurValidate={() =>
                          setErrors((p) => ({
                            ...p,
                            cardCvv: validators.cardCvv(form.cardCvv, v),
                          }))
                        }
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span aria-hidden className="text-xs">
                        🔒
                      </span>
                      <span className="font-body text-[11px] text-ink-ghost">
                        {m.payment.cardTrust}
                      </span>
                    </div>
                  </div>
                )}

                <Button variant="primary" size="lg" fullWidth onClick={goStep3}>
                  {m.payment.next} →
                </Button>
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className={sectionBoxCls(3)}>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className={stepCircleCls(3)}>3</span>
              <span
                className={cn(
                  "font-display text-[17px] font-bold uppercase tracking-[0.04em]",
                  step === 3 ? "text-ink" : "text-ink-dim",
                )}
              >
                {m.steps.confirm}
              </span>
            </div>

            {step === 3 && (
              <div className="px-5 pb-6">
                {/* Список + підсумки дублюють sticky-сайдбар праворуч,
                    тому на десктопі ховаємо їх; на мобайлі сайдбара немає — показуємо тут. */}
                <div className="lg:hidden">
                  <ul className="divide-y divide-border-subtle">
                    {cart.items.map((item) => {
                      const line = splitCartModel(item.model);
                      return (
                        <li key={item.id} className="flex items-center gap-2.5 py-2">
                          <div
                            aria-hidden
                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04] text-xl"
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              item.emoji
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="break-words text-[13px] font-bold leading-snug">
                              {line.name}
                            </div>
                            {/* Варіант (розмір, ручка, товщина) — окремим помітним рядком і без обрізання:
    це остання нагода побачити не той розмір. */}
                            {line.variant && (
                              <div className="mt-0.5 font-body text-[13px] font-semibold leading-snug text-ink">
                                {line.variant}
                              </div>
                            )}
                            <div className="font-body text-[11px] text-ink-dim">×{item.qty}</div>
                          </div>
                          <div className="shrink-0 font-display text-[14px] font-black text-accent">
                            {formatPrice(item.price * item.qty)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="my-4 rounded-xl bg-white/[0.03] px-4 py-3.5">
                    <div className="mb-2 flex justify-between">
                      <span className="font-body text-[13px] text-ink-muted">
                        {messages.cart.subtotal}:
                      </span>
                      <span className="font-display text-[14px] text-ink">
                        {formatPrice(cart.total)}
                      </span>
                    </div>
                    <div className="mb-2 flex justify-between">
                      <span className="font-body text-[13px] text-ink-muted">
                        {messages.cart.delivery}:
                      </span>
                      <span className="font-display text-[14px] text-ink">
                        {shipping === 0 ? `🎉 ${messages.cart.free}` : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border-subtle pt-2.5">
                      <span className="font-display text-base font-bold uppercase">
                        {messages.cart.total}:
                      </span>
                      <span className="font-display text-[22px] font-black text-accent">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>
                {/**
                 * Згода дається самим оформленням — окремої галочки немає й не було.
                 * Раніше тут стояло «Я погоджуюсь з умовами використання» і текст
                 * збирався через .replace(): формулювання від першої особи читалось як
                 * підпис під галочкою, а сам трюк ламався б від будь-якої правки тексту.
                 * Тепер речення з плейсхолдерами {terms} і {privacy} — обидва стають
                 * посиланнями. Політика конфіденційності тут потрібна не менше за умови:
                 * на цьому кроці збираються персональні дані.
                 */}
                <p className="mb-4 font-body text-[13px] leading-relaxed text-ink-muted">
                  {(() => {
                    const link = (href: string, label: string) => (
                      <a
                        key={href}
                        href={`/${locale}${href}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        {label}
                      </a>
                    );
                    return m.confirm.agreement
                      .split(/(\{terms\}|\{privacy\})/)
                      .map((part, i) =>
                        part === "{terms}" ? (
                          link("/terms", m.confirm.agreementTerms)
                        ) : part === "{privacy}" ? (
                          link("/privacy", m.confirm.agreementPrivacy)
                        ) : (
                          <span key={i}>{part}</span>
                        ),
                      );
                  })()}
                </p>
                {submitError && (
                  <div className="mb-2.5 font-body text-[12px] text-danger" role="alert">
                    ⚠ {submitError}
                  </div>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={submitOrder}
                  disabled={submitting}
                  data-cta="checkout-submit"
                  data-location="checkout"
                >
                  {submitting ? t.sending : `🔒 ${m.confirm.submit} — ${formatPrice(total)}`}
                </Button>
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  {[
                    ["🔒", "SSL"],
                    ["🚚", messages.trustBar.delivery],
                    ["↩️", messages.trustBar.returns],
                    ["🇯🇵", locale === "ru" ? "Оригинал Butterfly" : "Оригінал Butterfly"],
                  ].map(([ic, tx]) => (
                    <span
                      key={tx}
                      className="inline-flex items-center gap-1 font-body text-[11px] text-ink-ghost"
                    >
                      <span aria-hidden>{ic}</span>
                      {tx}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky summary (desktop) */}
        <aside className="hidden self-start lg:sticky lg:top-[90px] lg:block">
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-raised">
            <div className="border-b border-border-subtle px-5 py-4">
              <div className="mb-3 font-display text-sm font-bold uppercase tracking-[0.1em] text-ink-muted">
                {m.summary}
              </div>
              <ul className="space-y-2.5">
                {cart.items.map((item) => {
                  const line = splitCartModel(item.model);
                  return (
                    <li key={item.id} className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04] text-xl"
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" className="h-full w-full object-contain" />
                        ) : (
                          item.emoji
                        )}
                        {item.qty > 1 && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-bg-base">
                            {item.qty}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-[13px] font-bold leading-snug">
                          {line.name}
                        </span>
                        {line.variant ? (
                          <span className="block font-body text-[12px] font-semibold leading-snug text-ink">
                            {line.variant}
                          </span>
                        ) : (
                          <span className="block font-body text-[11px] text-ink-muted">
                            {item.brand}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-display text-sm font-extrabold">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="px-5 py-3.5">
              <div className="mb-2 flex justify-between">
                <span className="font-body text-[13px] text-ink-muted">
                  {messages.cart.subtotal}
                </span>
                <span className="font-display text-[13px] text-ink">{formatPrice(cart.total)}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span className="font-body text-[13px] text-ink-muted">
                  {messages.cart.delivery}
                </span>
                <span
                  className={cn(
                    "font-display text-[13px]",
                    shipping === 0 ? "text-success" : "text-ink",
                  )}
                >
                  {shipping === 0 ? messages.cart.free : formatPrice(shipping)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t border-border-subtle pt-3">
                <span className="font-display text-base font-bold uppercase">
                  {messages.cart.total}
                </span>
                <span className="font-display text-2xl font-black text-accent">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
