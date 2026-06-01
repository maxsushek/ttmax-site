"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, formatCardExp, formatCardNumber, formatPhone } from "@/utils/format";
import { validators, type FieldKey } from "@/utils/validators";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY, toAnalyticsItems } from "@/lib/analytics/ecommerce";
import { getAttribution } from "@/lib/analytics/attribution";
import { siteConfig } from "@/config/site";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

type Delivery = "np" | "ukrposhta" | "pickup";
type Payment = "apple" | "cod" | "card";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  npBranch: string;
  delivery: Delivery;
  payment: Payment;
  cardNum: string;
  cardExp: string;
  cardCvv: string;
};

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
    delivery: "np",
    payment: "cod",
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

  const shipping = cart.total >= cart.freeShippingThreshold ? 0 : cart.shippingFee;
  const total = cart.total + shipping;

  const validate1 = () => {
    const errs: Partial<Record<FieldKey, string>> = {};
    (["fullName", "phone", "city", "npBranch"] as const).forEach((k) => {
      const validator = validators[k];
      if (validator) {
        const err = validator(form[k] as string, v);
        if (err) errs[k] = err;
      }
    });
    if (form.email) {
      const err = validators.email(form.email, v);
      if (err) errs.email = err;
    }
    return errs;
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

  const goStep2 = () => {
    const errs = validate1();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setDone((p) => Array.from(new Set([...p, 1])) as Array<1 | 2>);
    setStep(2);
  };

  const goStep3 = () => {
    const errs = validate2();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setDone((p) => Array.from(new Set([...p, 2])) as Array<1 | 2>);
    setStep(3);
  };

  // Локальные строки для submit — чтобы не модифицировать messages/uk.ts и ru.ts.
  // Если позже захочешь — перенеси в i18n.
  const t = {
    sending: locale === "uk" ? "Надсилаємо…" : "Отправляем…",
    submitError:
      locale === "uk"
        ? "Не вдалося оформити замовлення. Спробуйте ще раз."
        : "Не удалось оформить заказ. Попробуйте ещё раз.",
    emptyCart: locale === "uk" ? "Кошик порожній." : "Корзина пуста.",
  };

  const submitOrder = async () => {
    if (submitting) return;
    if (cart.items.length === 0) {
      setSubmitError(t.emptyCart);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.fullName,
            phone: form.phone,
            email: form.email || null,
          },
          delivery: {
            method: form.delivery,
            city: form.city || null,
            branch: form.npBranch || null,
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
      setSubmitError(t.submitError);
    } finally {
      setSubmitting(false);
    }
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
        <p className="mb-8 max-w-[320px] font-body text-sm text-ink-dim">
          {form.email
            ? m.success.emailNote.replace("{email}", form.email)
            : m.success.emailNote.replace("{email}", m.success.emailFallback)}
          . {m.success.deliveryNote}
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
    <div className="fixed inset-0 z-[910] overflow-y-auto bg-bg-base">
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
        <div className="flex items-center gap-1.5">
          <span aria-hidden>🔒</span>
          <span className="font-body text-xs text-ink-dim">{m.secureCheckout}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={messages.common.close}
          className="p-1 text-lg text-ink-dim transition-colors hover:text-ink"
        >
          ✕
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
              onClick={() => done.includes(1) && setStep(1)}
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
                    <span className="mt-0.5 block font-body text-xs text-success">
                      ✓ {form.city}, {form.npBranch}
                    </span>
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
                <div className="mb-2.5 font-body text-xs font-medium text-ink-muted">
                  {m.delivery.method}
                </div>
                <div className="mb-6 flex flex-col gap-2">
                  {[
                    { v: "np" as const, icon: "📦", ...m.delivery.np },
                    { v: "ukrposhta" as const, icon: "✉️", ...m.delivery.ukrposhta },
                    { v: "pickup" as const, icon: "🏪", ...m.delivery.pickup },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => update("delivery", opt.v)}
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
                      value={form.fullName}
                      onValueChange={(val) => update("fullName", val)}
                      error={errors.fullName}
                      onBlurValidate={() =>
                        setErrors((p) => ({
                          ...p,
                          fullName: validators.fullName(form.fullName, v),
                        }))
                      }
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
                      onBlurValidate={() =>
                        setErrors((p) => ({ ...p, phone: validators.phone(form.phone, v) }))
                      }
                    />
                  </div>
                  <Input
                    label={m.delivery.fields.city}
                    placeholder={m.delivery.fields.cityPlaceholder}
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    onValueChange={(val) => update("city", val)}
                    error={errors.city}
                    onBlurValidate={() =>
                      setErrors((p) => ({ ...p, city: validators.city(form.city, v) }))
                    }
                  />
                  <Input
                    label={m.delivery.fields.npBranch}
                    placeholder={m.delivery.fields.npBranchPlaceholder}
                    required
                    value={form.npBranch}
                    onValueChange={(val) => update("npBranch", val)}
                    error={errors.npBranch}
                    onBlurValidate={() =>
                      setErrors((p) => ({
                        ...p,
                        npBranch: validators.npBranch(form.npBranch, v),
                      }))
                    }
                  />
                </div>
                <Input
                  label={m.delivery.fields.email}
                  placeholder={m.delivery.fields.emailPlaceholder}
                  type="email"
                  autoComplete="email"
                  optional
                  optionalLabel={m.delivery.optional}
                  value={form.email}
                  onValueChange={(val) => update("email", val)}
                  error={errors.email}
                  onBlurValidate={() =>
                    setErrors((p) => ({ ...p, email: validators.email(form.email, v) }))
                  }
                />

                <div className="mb-5 mt-2 flex items-center gap-1.5">
                  <span aria-hidden className="text-[13px]">
                    🔒
                  </span>
                  <span className="font-body text-[11px] text-ink-ghost">
                    {m.delivery.trustNote}
                  </span>
                </div>

                <Button variant="primary" size="lg" fullWidth onClick={goStep2}>
                  {m.delivery.next} →
                </Button>
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
                  {[
                    { v: "apple" as const, icon: "📱", ...m.payment.apple },
                    { v: "cod" as const, icon: "💵", ...m.payment.cod },
                    { v: "card" as const, icon: "💳", ...m.payment.card },
                  ].map((opt) => (
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
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2.5 py-2">
                        <div
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04] text-xl"
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="h-full w-full object-contain" />
                          ) : (
                            item.emoji
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-bold">{item.model}</div>
                          <div className="font-body text-[11px] text-ink-dim">×{item.qty}</div>
                        </div>
                        <div className="shrink-0 font-display text-[14px] font-black text-accent">
                          {formatPrice(item.price * item.qty)}
                        </div>
                      </li>
                    ))}
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
                <p className="mb-4 font-body text-[13px] leading-relaxed text-ink-muted">
                  {m.confirm.agreement.replace(m.confirm.agreementLink, "")}
                  <a
                    href={`/${locale}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {m.confirm.agreementLink}
                  </a>
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
                    ["⭐", "4.9/5"],
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
                {cart.items.map((item) => (
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
                      <span className="block truncate text-[13px] font-bold">{item.model}</span>
                      <span className="block font-body text-[11px] text-ink-muted">
                        {item.brand}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-extrabold">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </li>
                ))}
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
