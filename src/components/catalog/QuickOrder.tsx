"use client";

// Швидке замовлення з картки товару: кнопка → модалка з телефоном (обов'язково) та
// іменем (опційно). Сабмит іде в /api/leads (source="quick-order", товар в attribution),
// тобто той самий потік, що й форма-CTA: запис у CRM + Telegram-сповіщення менеджеру.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPhone } from "@/utils/format";
import { trackEvent } from "@/lib/analytics/events";
import { getAttribution } from "@/lib/analytics/attribution";
import { type Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

// Той самий валідатор укр. номера, що й на бекенді (/api/leads) — щоб не пропускати сміття.
const PHONE_RE = /^(\+?380|0)(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/;

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
    error: "Щось пішло не так. Спробуйте ще раз або зателефонуйте нам.",
    phoneError: "Введіть коректний номер (напр. 067 123 45 67)",
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
    error: "Что-то пошло не так. Попробуйте ещё раз или позвоните нам.",
    phoneError: "Введите корректный номер (напр. 067 123 45 67)",
    note: "Без спама. Номер нужен только для звонка по заказу.",
    close: "Закрыть",
  },
};

export function QuickOrder({
  locale,
  productSlug,
  productName,
  variant = "secondary",
}: {
  locale: Locale;
  productSlug: string;
  /** Повна назва (бренд + модель) — іде в attribution і в Telegram. */
  productName: string;
  /** primary — акцентна кнопка (для товарів «ціна за запитом»); secondary — під «В кошик». */
  variant?: "primary" | "secondary";
}) {
  const t = UI[locale];
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [phoneErr, setPhoneErr] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

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
    trackEvent({ name: "lead_form_start", params: { location: "quick-order" } });
  };

  const onFirstInput = () => {
    if (startedRef.current) return;
    startedRef.current = true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honey) return; // бот
    if (status === "submitting") return;

    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    if (!PHONE_RE.test(cleanPhone)) {
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
          phone: cleanPhone,
          source: "quick-order",
          locale,
          attribution: { ...getAttribution(), product: productName, productSlug },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackEvent({ name: "lead_form_submit", params: { location: "quick-order" } });
      trackEvent({ name: "conversion", params: { type: "lead" } });
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
        onClick={openModal}
        data-cta="quick-order"
        data-location={productSlug}
      >
        {t.button}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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
                <p className="mt-1 font-body text-[13px] leading-snug text-ink-muted">{t.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="shrink-0 rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                <span aria-hidden className="text-xl leading-none">
                  ✕
                </span>
              </button>
            </div>

            <p className="mb-4 rounded-xl border border-border-subtle bg-white/[0.03] px-3.5 py-2.5 font-body text-[13px] text-ink-muted">
              🛒 <span className="font-semibold text-ink">{productName}</span>
            </p>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span aria-hidden className="text-4xl">
                  ✅
                </span>
                <p className="font-display text-base font-bold text-ink">{t.success}</p>
                <p className="font-body text-[12px] text-ink-muted">{t.successHint}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-3 font-body text-[13px] text-accent underline hover:no-underline"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5">
                {/* Honeypot */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={honey}
                    onChange={(e) => setHoney(e.target.value)}
                  />
                </div>

                <label className="block">
                  <span className="mb-1 block font-body text-[12px] font-medium text-ink-muted">
                    {t.phone}
                  </span>
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="+380 67 123 45 67"
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatPhone(e.target.value));
                      setPhoneErr(false);
                      onFirstInput();
                    }}
                    aria-invalid={phoneErr || undefined}
                    className={cn(
                      "w-full rounded-xl border-[1.5px] bg-white/[0.04] px-4 py-3 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-ink-dim",
                      phoneErr ? "border-danger" : "border-border-strong focus:border-accent/60",
                    )}
                  />
                  {phoneErr && (
                    <span role="alert" className="mt-1 block font-body text-[11px] text-danger">
                      {t.phoneError}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1 block font-body text-[12px] font-medium text-ink-muted">
                    {t.name} <span className="text-ink-dim">· {t.nameHint}</span>
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder={t.name}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      onFirstInput();
                    }}
                    className="w-full rounded-xl border-[1.5px] border-border-strong bg-white/[0.04] px-4 py-3 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-ink-dim focus:border-accent/60"
                  />
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={status === "submitting"}
                  className="mt-1"
                  data-cta="quick-order-submit"
                  data-location={productSlug}
                >
                  {status === "submitting" ? t.submitting : `${t.submit} →`}
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
