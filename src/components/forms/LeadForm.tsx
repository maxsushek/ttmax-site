"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPhone } from "@/utils/format";
import { validators } from "@/utils/validators";
import { trackEvent } from "@/lib/analytics/events";
import { getAttribution } from "@/lib/analytics/attribution";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

type FormState = { name: string; phone: string; email: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

export function LeadForm({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
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

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    const nameErr = validators.fullName(form.name, v);
    if (nameErr) errs.name = nameErr;
    const phoneErr = validators.phone(form.phone, v);
    if (phoneErr) errs.phone = phoneErr;
    if (form.email) {
      const emailErr = validators.email(form.email, v);
      if (emailErr) errs.email = emailErr;
    }
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honey) return; // bot
    if (status === "submitting") return;

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
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
    } catch {
      setStatus("error");
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
    <form onSubmit={onSubmit} noValidate aria-label={m.submit} className="flex flex-col gap-2.5">
      {/* Honeypot — visually hidden */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
          />
        </label>
      </div>

      <PlainField
        label={m.name}
        placeholder={m.name}
        autoComplete="name"
        value={form.name}
        error={errors.name}
        onValueChange={(val) => update("name", val)}
      />
      <PlainField
        label={m.phone}
        placeholder={m.phone}
        type="tel"
        autoComplete="tel"
        inputMode="numeric"
        value={form.phone}
        error={errors.phone}
        onValueChange={(val) => update("phone", formatPhone(val))}
      />
      <PlainField
        label={m.email}
        placeholder={m.email}
        type="email"
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
        {status === "submitting" ? m.submitting : `${m.submit} →`}
      </Button>

      {status === "error" && (
        <p role="alert" className="text-center font-body text-xs text-danger">
          ⚠ {m.error}
        </p>
      )}

      <p className="mt-2 text-center font-body text-[11px] text-black/30">{m.note}</p>
    </form>
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
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={!!error || undefined}
        className={cn(
          "w-full rounded-xl border-[1.5px] bg-white/60 px-4 py-3.5 font-display text-[15px] text-bg-base outline-none transition-colors",
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
