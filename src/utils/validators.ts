import type { Messages } from "@/i18n/messages/types";

const UA_PHONE = /^(\+?380|0)(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldKey =
  | "fullName"
  | "phone"
  | "email"
  | "city"
  | "npBranch"
  | "cardNum"
  | "cardExp"
  | "cardCvv";

type Validator = (value: string, msg: Messages["validators"]) => string;

export const validators: Record<FieldKey, Validator> = {
  fullName: (v, m) => {
    const trimmed = v.trim();
    if (!trimmed) return m.required;
    if (trimmed.split(/\s+/).length < 2) return m.fullName;
    return "";
  },
  phone: (v, m) => {
    const cleaned = v.replace(/[\s\-()]/g, "");
    if (!cleaned) return m.required;
    if (!UA_PHONE.test(cleaned)) return m.phone;
    return "";
  },
  email: (v, m) => (!v || EMAIL_RE.test(v) ? "" : m.email),
  city: (v, m) => {
    const trimmed = v.trim();
    if (!trimmed) return m.required;
    if (trimmed.length < 2) return m.cityTooShort;
    return "";
  },
  npBranch: (v, m) => (v.trim() ? "" : m.required),
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
