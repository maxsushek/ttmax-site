"use client";

// Форма відгуку. Відправка — POST /api/reviews; публікує лише модератор.
// Антиспам із боку форми: поле-пастка `website` (людина його не бачить) і час від
// відкриття форми до відправки. Справжні перевірки — на сервері.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import type { Locale } from "@/i18n/config";
import { REVIEW_T } from "./strings";

type ErrorKey = keyof (typeof REVIEW_T)["ua"]["errors"];

const inputCls =
  "w-full rounded-xl border-[1.5px] bg-white/[0.04] px-4 py-3 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-ink-dim";

export function ReviewForm({
  kind,
  productSlug,
  locale,
  token,
  compact = false,
}: {
  kind: "product" | "store";
  productSlug?: string;
  locale: Locale;
  /** Персональне посилання з замовлення: телефон не потрібен, відгук — «Покупець». */
  token?: string;
  compact?: boolean;
}) {
  const t = REVIEW_T[locale];
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [body, setBody] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [field, setField] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const shown = hover || rating;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setField(null);
    if (rating < 1) return (setError("rating"), setField("rating"));
    if (name.trim().length < 2) return (setError("name"), setField("name"));
    if (body.trim().length < 10) return (setError("body"), setField("body"));
    setState("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          productSlug: productSlug ?? null,
          locale,
          rating,
          name,
          city: city || null,
          body,
          phone: token ? null : phone || null,
          token: token ?? null,
          website,
          elapsedMs: startedAt.current ? Date.now() - startedAt.current : -1,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; verified?: boolean; error?: string; field?: string };
      if (res.ok && json.ok) {
        setVerified(Boolean(json.verified));
        setState("done");
        return;
      }
      const code = json.error === "validation" ? (json.field as ErrorKey | undefined) : (json.error as ErrorKey | undefined);
      setError(code && code in t.errors ? code : "generic");
      setField(json.field ?? null);
      setState("error");
    } catch {
      setError("generic");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-accent/40 bg-accent/[0.06] px-5 py-6 font-body text-[15px] leading-relaxed text-ink"
      >
        ✓ {verified ? t.doneVerified : t.done}
      </div>
    );
  }

  const bad = (f: string) => field === f;

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-3.5", compact && "gap-3")}>
      {/* Оцінка */}
      <fieldset>
        <legend className="mb-1.5 font-body text-[12px] font-medium text-ink-muted">{t.ratingLabel}</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name={`rating-${productSlug ?? kind}`}
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                  aria-label={`${n} — ${t.rate[n - 1]}`}
                />
                <svg
                  width={compact ? 28 : 32}
                  height={compact ? 28 : 32}
                  viewBox="0 0 24 24"
                  aria-hidden
                  className={cn(
                    "rounded transition-transform peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60",
                    n <= shown ? "text-accent" : "text-white/20",
                    n <= shown && "scale-105",
                  )}
                >
                  <path
                    fill="currentColor"
                    d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
                  />
                </svg>
              </label>
            ))}
          </div>
          <span className={cn("font-body text-[13px]", shown ? "text-ink" : "text-ink-dim")}>
            {shown ? t.rate[shown - 1] : ""}
          </span>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-body text-[12px] font-medium text-ink-muted">{t.name}</span>
          <input
            type="text"
            autoComplete="given-name"
            maxLength={60}
            placeholder={t.namePh}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={bad("name") || undefined}
            className={cn(inputCls, bad("name") ? "border-danger" : "border-border-strong focus:border-accent/60")}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-[12px] font-medium text-ink-muted">{t.city}</span>
          <input
            type="text"
            autoComplete="address-level2"
            maxLength={60}
            placeholder={t.cityPh}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={cn(inputCls, bad("city") ? "border-danger" : "border-border-strong focus:border-accent/60")}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block font-body text-[12px] font-medium text-ink-muted">{t.body}</span>
        <textarea
          rows={compact ? 4 : 5}
          maxLength={3000}
          placeholder={kind === "store" ? t.bodyStorePh : t.bodyPh}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={bad("body") || undefined}
          className={cn(
            inputCls,
            "resize-y leading-relaxed",
            bad("body") ? "border-danger" : "border-border-strong focus:border-accent/60",
          )}
        />
      </label>

      {!token && (
        <label className="block">
          <span className="mb-1 block font-body text-[12px] font-medium text-ink-muted">{t.phone}</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="067 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={bad("phone") || undefined}
            className={cn(inputCls, bad("phone") ? "border-danger" : "border-border-strong focus:border-accent/60")}
          />
          <span className="mt-1 block font-body text-[11px] text-ink-dim">{t.phoneHint}</span>
        </label>
      )}

      {/* Пастка для ботів: людина цього поля не бачить і не заповнює. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={state === "sending"} className="mt-1 self-start">
        {state === "sending" ? t.sending : t.submit}
      </Button>

      {error && (
        <p role="alert" className="font-body text-[13px] text-danger">
          ⚠ {t.errors[error]}
        </p>
      )}
      <p className="font-body text-[11px] text-ink-dim">{t.note}</p>
    </form>
  );
}
