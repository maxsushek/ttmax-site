// src/components/admin/ContactsForm.tsx
// Контакти + доставка. Зберігаються в site_settings через /api/admin/settings.
// Порожнэ значення видаляэ рядок → фолбэк на код (siteConfig).
"use client";

import { useState } from "react";
import { CONTACT_KEYS } from "@/lib/contact/get";

type Values = Record<string, string>;
type Status = "idle" | "saving" | "saved" | "error";

type Field = { key: string; label: string; placeholder?: string; hint?: string };
type Group = { title: string; fields: Field[] };

const GROUPS: Group[] = [
  {
    title: "Контакти",
    fields: [
      {
        key: CONTACT_KEYS.phone,
        label: "Телефон (для посилання tel:)",
        placeholder: "+380501234567",
      },
      {
        key: CONTACT_KEYS.phoneDisplay,
        label: "Телефон (як показувати)",
        placeholder: "+380 50 123 45 67",
      },
      { key: CONTACT_KEYS.email, label: "Email", placeholder: "hello@ttmax.ua" },
    ],
  },
  {
    title: "Соцмережі (повні посилання)",
    fields: [
      { key: CONTACT_KEYS.telegram, label: "Telegram", placeholder: "https://t.me/…" },
      { key: CONTACT_KEYS.youtube, label: "YouTube", placeholder: "https://youtube.com/@…" },
      { key: CONTACT_KEYS.facebook, label: "Facebook", placeholder: "https://facebook.com/…" },
    ],
  },
  {
    title: "Адреса (для SEO / контактів)",
    fields: [
      { key: CONTACT_KEYS.addrStreet, label: "Вулиця, будинок", placeholder: "вул. Хрещатик, 1" },
      { key: CONTACT_KEYS.addrLocality, label: "Місто", placeholder: "Київ" },
      { key: CONTACT_KEYS.addrRegion, label: "Область", placeholder: "Київська обл." },
      { key: CONTACT_KEYS.addrPostal, label: "Індекс", placeholder: "01001" },
    ],
  },
  {
    title: "Доставка",
    fields: [
      {
        key: CONTACT_KEYS.freeThreshold,
        label: "Безкоштовна доставка від, ₴",
        placeholder: "5000",
        hint: "Сума кошика, з якої доставка стаэ безкоштовною.",
      },
      {
        key: CONTACT_KEYS.shippingFee,
        label: "Вартість доставки, ₴",
        placeholder: "99",
        hint: "Фіксована вартість, якщо кошик менший за поріг.",
      },
    ],
  },
];

export function ContactsForm({ initial }: { initial: Values }) {
  const [values, setValues] = useState<Values>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setStatus("idle");
  };

  const save = async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Помилка збереження");
    }
  };

  return (
    <div className="flex flex-col gap-7">
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            {g.title}
          </h2>
          <div className="flex flex-col gap-3">
            {g.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-[13px] text-[#aaa]">{f.label}</span>
                <input
                  value={values[f.key] ?? ""}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#F0F0F0] outline-none placeholder:text-[#555] focus:border-[#E8FF47]/50"
                />
                {f.hint && <span className="mt-1 block text-[11px] text-[#666]">{f.hint}</span>}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-white/10 bg-[#080A0E]/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-[#E8FF47] px-5 py-2.5 text-sm font-bold text-[#080A0E] transition-opacity disabled:opacity-40"
        >
          {status === "saving" ? "Збереження…" : "Зберегти"}
        </button>
        {status === "saved" && <span className="text-sm text-[#4ade80]">✓ Збережено</span>}
        {status === "error" && <span className="text-sm text-[#f87171]">⚠ {error}</span>}
      </div>

      <p className="text-[12px] leading-relaxed text-[#666]">
        Порожнэ поле = використовується значення з коду (за замовчуванням). Зміни застосовуються на
        сайті без передеплою.
      </p>
    </div>
  );
}
