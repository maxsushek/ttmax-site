import type { Messages } from "@/i18n/messages/types";
import { UA_PHONE } from "@/utils/phone";

/** Мобільний номер України з кодом оператора — перелік кодів у utils/phone.ts (спільний із бекендом). */
export { UA_PHONE };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldKey =
  | "fullName"
  | "phone"
  | "email"
  | "city"
  | "npBranch"
  | "ukrBranch"
  | "cardNum"
  | "cardExp"
  | "cardCvv";

type Validator = (value: string, msg: Messages["validators"]) => string;

/**
 * Саме ім'я, без прізвища: форма-заявка (поле так і називається — «Ім'я») і самовивіз, де
 * прізвище нікому не потрібне. Мінімум 2 символи — стільки ж вимагає сервер (zod, name.min(2)).
 */
export const validateName: Validator = (v, m) => {
  const trimmed = v.trim();
  if (!trimmed) return m.nameEmpty;
  if (trimmed.length < 2) return m.cityTooShort;
  return "";
};

// ⚠️ Порожнє поле — своїм текстом («Вкажіть місто»), а не спільним «Обов'язкове поле»:
// чотири однакові червоні рядки під формою нічого не пояснювали (PostHog, checkout_error).
export const validators: Record<FieldKey, Validator> = {
  fullName: (v, m) => {
    const trimmed = v.trim();
    if (!trimmed) return m.fullNameEmpty;
    if (trimmed.split(/\s+/).length < 2) return m.fullName;
    return "";
  },
  phone: (v, m) => {
    const cleaned = v.replace(/[\s\-()]/g, "");
    if (!cleaned) return m.phoneEmpty;
    if (!UA_PHONE.test(cleaned)) return m.phone;
    return "";
  },
  email: (v, m) => (!v.trim() || EMAIL_RE.test(v.trim()) ? "" : m.email),
  city: (v, m) => {
    const trimmed = v.trim();
    if (!trimmed) return m.cityEmpty;
    if (trimmed.length < 2) return m.cityTooShort;
    return "";
  },
  npBranch: (v, m) => (v.trim() ? "" : m.npBranchEmpty),
  // Укрпошта: індекс або адреса відділення — вільний текст, як і відділення НП.
  ukrBranch: (v, m) => (v.trim() ? "" : m.ukrBranchEmpty),
  cardNum: (v, m) => (/^\d{16}$/.test(v.replace(/\s/g, "")) ? "" : m.cardNum),
  cardExp: (v, m) => {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v)) return m.cardExp;
    const parts = v.split("/").map(Number);
    const mm = parts[0];
    const yy = parts[1];
    if (mm === undefined || yy === undefined) return m.cardExp;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (yy < currentYear || (yy === currentYear && mm < currentMonth)) return m.cardExpired;
    return "";
  },
  cardCvv: (v, m) => (/^\d{3,4}$/.test(v) ? "" : m.cardCvv),
};
