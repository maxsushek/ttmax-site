"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPhone, keepPhoneCaret } from "@/utils/format";
import { validateName, validators } from "@/utils/validators";
import { trackEvent } from "@/lib/analytics/events";
import { getAttribution } from "@/lib/analytics/attribution";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";
import { ArrowRight } from "@/components/ui/ArrowRight";

type FormState = { name: string; phone: string; email: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

export function LeadForm({ locale, messages }: { locale: Locale; messages: Messages }) {
  const m = messages.cta.form;
  const v = messages.validators;

  const [form, setForm] = useState<FormState>({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [started, setStarted] = useState(false);
  // Honeypot
  const [honey, setHoney] = useState("");

  const onStart = () => {
    if (started) return;
    setStarted(true);
    trackEvent({ name: "lead_form_start", params: { location: "consultation" } });
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
    onStart();
  };

  const validate = (f: FormState): FormErrors => {
    const errs: FormErrors = {};
    // Поле називається «Ім'я» — прізвища не вимагаємо (було validators.fullName: «Максим»
    // давав помилку «Введіть ім'я та прізвище»).
    const nameErr = validateName(f.name, v);
    if (nameErr) errs.name = nameErr;
    const phoneErr = validators.phone(f.phone, v);
    if (phoneErr) errs.phone = phoneErr;
    if (f.email) {
      const emailErr = validators.email(f.email, v);
      if (emailErr) errs.email = emailErr;
    }
    return errs;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // WebMCP: якщо поля заповнив ШІ-агент (форма — інструмент request_consultation), браузер
    // чекає на результат через SubmitEvent.respondWith(). Викликати його можна лише синхронно,
    // тому одразу віддаємо обіцянку, а завершуємо її нижче. У звичайному браузері цих
    // властивостей немає — гілка не виконується. У відповідь агентові не кладемо жодних даних
    // покупця: лише «надіслано / не надіслано».
    const ev = e.nativeEvent as SubmitEvent & {
      agentInvoked?: boolean;
      respondWith?: (p: Promise<string>) => void;
    };
    let tellAgent: (msg: string) => void = () => {};
    if (ev.agentInvoked && typeof ev.respondWith === "function") {
      ev.respondWith(new Promise<string>((resolve) => (tellAgent = resolve)));
    }

    if (honey) return tellAgent("The request was not sent."); // bot
    if (status === "submitting") return tellAgent("The request is already being sent.");

    // Агент заповнює поля напряму в DOM і може не викликати onChange — тоді стан React
    // порожній, хоча людина бачить заповнену форму. Беремо значення з самої форми.
    const fd = new FormData(e.currentTarget);
    const read = (key: keyof FormState) => {
      const raw = fd.get(key);
      return typeof raw === "string" ? raw : form[key];
    };
    const values: FormState = {
      name: read("name"),
      phone: formatPhone(read("phone")),
      email: read("email"),
    };
    setForm(values);

    const errs = validate(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      tellAgent(
        `The request was not sent: ${Object.keys(errs).join(", ")} failed validation. Ask the user to correct the highlighted fields.`,
      );
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          email: values.email.trim() || null,
          source: "consultation",
          locale,
          attribution: getAttribution(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      trackEvent({ name: "lead_form_submit", params: { location: "consultation" } });
      trackEvent({ name: "conversion", params: { type: "lead" } });
      setStatus("success");
      setForm({ name: "", phone: "", email: "" });
      // Заявку, яку заповнив агент, відправила людина — другий крок лічильника WebMCP.
      if (ev.agentInvoked) {
        trackEvent({
          name: "webmcp_tool_call",
          params: { tool: "request_consultation", outcome: "submitted" },
        });
      }
      tellAgent("The consultation request was sent. The shop will call the user back.");
    } catch {
      setStatus("error");
      tellAgent(
        "The request was not sent because of a network or server error. Ask the user to try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/15 px-4 py-10 text-center"
      >
        <span aria-hidden className="text-4xl">
          ✅
        </span>
        <p className="font-display text-lg font-bold text-bg-base">{m.success}</p>
      </div>
    );
  }

  return (
    <>
      {/* Honeypot — visually hidden.
          ⚠️ НАВІЩО поза <form>: форма — інструмент WebMCP, і кожне її поле стає параметром для
          ШІ-агента. Пастка всередині форми була б «параметром», який агент сумлінно заповнить, —
          і справжня заявка мовчки зникла б як бот. Спам-боти, що заповнюють усі input на
          сторінці, ловляться так само. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
          />
        </label>
      </div>
      {/* WebMCP (декларативний API, origin trial у Chrome 149+): toolname + tooldescription роблять
        форму інструментом для ШІ-агента в браузері. https://developer.chrome.com/docs/ai/webmcp/declarative-api
        ⚠️ БЕЗ toolautosubmit — і так має лишатися: агент лише заповнює поля, а кнопку натискає
        людина. Заявка йде власникові в Telegram, мовчки відправляти її за людину не можна.
        Кожному полю потрібен name: без нього аудит Lighthouse webmcp-schema-validity провалюється
        (обовʼязкове поле) або дає 0,5 (необовʼязкове). */}
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={m.submit}
        className="flex flex-col gap-2.5"
        toolname="request_consultation"
        tooldescription="Fill in the callback form so that a ttmax.com.ua consultant phones the user to help choose Butterfly table tennis equipment. This only fills the fields: the user must review them and press the submit button themselves. Use only when the user has explicitly asked to be contacted by the shop."
      >
        <PlainField
          label={m.name}
          placeholder={m.name}
          name="name"
          required
          toolparamdescription="First and last name of the user, as they want the shop to address them."
          autoComplete="name"
          value={form.name}
          error={errors.name}
          onValueChange={(val) => update("name", val)}
        />
        <PlainField
          label={m.phone}
          placeholder={m.phone}
          type="tel"
          name="phone"
          required
          toolparamdescription="Ukrainian mobile phone number of the user, e.g. +380 67 123 45 67. Never invent it."
          autoComplete="tel"
          inputMode="numeric"
          value={form.phone}
          error={errors.phone}
          onValueChange={(val) => update("phone", formatPhone(val))}
          // Як у чекауті: перевірка номера (код оператора) одразу після виходу з поля.
          onBlur={() =>
            setErrors((p) => ({ ...p, phone: form.phone ? validators.phone(form.phone, v) : "" }))
          }
        />
        <PlainField
          label={m.email}
          placeholder={m.email}
          type="email"
          name="email"
          toolparamdescription="Optional e-mail address of the user."
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onValueChange={(val) => update("email", val)}
        />

        <Button
          type="submit"
          variant="dark"
          size="lg"
          fullWidth
          disabled={status === "submitting"}
          className="mt-1"
          data-cta="lead-submit"
          data-location="consultation"
        >
          {status === "submitting" ? (
            m.submitting
          ) : (
            <>
              {m.submit}
              <ArrowRight />
            </>
          )}
        </Button>

        {status === "error" && (
          <p role="alert" className="text-center font-body text-xs text-danger">
            ⚠ {m.error}
          </p>
        )}

        <p className="mt-2 text-center font-body text-[11px] text-black/30">{m.note}</p>
      </form>
    </>
  );
}

function PlainField({
  label,
  error,
  value,
  onValueChange,
  ...rest
}: {
  label: string;
  error?: string;
  value: string;
  onValueChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => {
          if (rest.type === "tel") keepPhoneCaret(e.target);
          onValueChange(e.target.value);
        }}
        aria-invalid={!!error || undefined}
        className={cn(
          "w-full rounded-xl border-[1.5px] bg-white/60 px-4 py-3.5 font-display text-[16px] text-bg-base outline-none transition-colors",
          "placeholder:text-black/40 focus:bg-white",
          error ? "border-danger" : "border-black/10 focus:border-black/30",
        )}
      />
      {error && (
        <span role="alert" className="mt-1 block font-body text-[11px] text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
