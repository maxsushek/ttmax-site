// src/lib/reviews/secret.ts
// Усе, що тримається на секреті REVIEWS_SECRET (env у Vercel):
//  • секрет webhook для Telegram (заголовок X-Telegram-Bot-Api-Secret-Token);
//  • підпис персональних посилань на відгук (замовлення → /vidguk?t=…);
//  • хеш IP для антиспаму (сам IP у базу не пишемо).
//
// ⚠️ Лише сервер (node:crypto у клієнтський бандл не потрапить). Без секрету приймання
// відгуків вимкнене (API віддає 503), а показ уже схвалених працює — читання від секрету
// не залежить.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";

function secret(): string | null {
  const s = process.env.REVIEWS_SECRET;
  return s && s.length >= 24 ? s : null;
}

export function isReviewsConfigured(): boolean {
  return secret() !== null;
}

const hmac = (key: string, data: string) => createHmac("sha256", key).update(data).digest();

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Секрет webhook, похідний від REVIEWS_SECRET: одна змінна в Vercel замість двох.
 * Telegram дозволяє в ньому лише A-Z a-z 0-9 _ - — hex підходить.
 */
export function telegramWebhookSecret(): string | null {
  const s = secret();
  return s ? hmac(s, "telegram-webhook").toString("hex").slice(0, 48) : null;
}

export function checkTelegramSecret(header: string | null): boolean {
  const expected = telegramWebhookSecret();
  return Boolean(expected && header && safeEqual(header, expected));
}

/** Хеш IP з сіллю: досить, щоб рахувати ліміти, і нічого не каже про людину. */
export function ipHash(ip: string): string | null {
  const s = secret();
  if (!s || !ip || ip === "unknown") return null;
  return createHash("sha256").update(`${s}|ip|${ip}`).digest("hex").slice(0, 32);
}

/* ---------------- Персональні посилання на відгук ---------------- */

/** Скільки діє посилання: з запасом на доставку й кілька тижнів гри. */
export const INVITE_DAYS = 120;
const DAY_MS = 86_400_000;

/**
 * Посилання веде або на замовлення з кошика (TT-20261020-00016), або на заявку
 * «швидке замовлення / консультація» (L-<uuid заявки>) — продажі йдуть обома шляхами.
 */
export const INVITE_REF_RE = /^(TT-\d{8}-\d{3,}|L-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** Токен: base64url(номер замовлення або L-заявка).день-закінчення.підпис */
export function signInvite(orderNumber: string, days = INVITE_DAYS): string | null {
  const s = secret();
  if (!s) return null;
  const exp = Math.floor(Date.now() / DAY_MS) + days;
  const payload = `${b64url(orderNumber)}.${exp}`;
  const sig = b64url(hmac(s, `invite|${payload}`)).slice(0, 24);
  return `${payload}.${sig}`;
}

/** Номер замовлення з токена або null (підробка / прострочено / битий рядок). */
export function verifyInvite(token: string | null | undefined): string | null {
  const s = secret();
  if (!s || !token || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [enc, expStr, sig] = parts as [string, string, string];
  const expected = b64url(hmac(s, `invite|${enc}.${expStr}`)).slice(0, 24);
  if (!safeEqual(sig, expected)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / DAY_MS)) return null;
  const ref = fromB64url(enc);
  return INVITE_REF_RE.test(ref) ? ref : null;
}

/** Повна адреса сторінки відгуку за замовленням (мова — як у замовленні). */
export function inviteUrl(orderNumber: string, lang: "uk" | "ru" | string): string | null {
  const t = signInvite(orderNumber);
  if (!t) return null;
  const path = lang === "ru" ? "ru" : "ua";
  return `${siteConfig.url}/${path}/vidguk?t=${t}`;
}
