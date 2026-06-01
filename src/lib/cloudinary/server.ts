// src/lib/cloudinary/server.ts
// Серверная часть Cloudinary: подпись загрузки и удаление.
// Секрет НИКОГДА не уходит на клиент. Подпись считаем вручную (SHA-1) — без зависимостей.
import crypto from "node:crypto";

type Config = { cloud: string; key: string; secret: string };

function configured(): Config | null {
  const cloud =
    process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;
  return { cloud, key, secret };
}

/** Подпись по спецификации Cloudinary: параметры сортируются, key=value&…, в конце секрет, SHA-1 hex. */
function sign(params: Record<string, string | number>, secret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + secret).digest("hex");
}

export type SignedUpload = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/** Параметры для прямой загрузки браузер → Cloudinary (минует лимит размера тела на сервере). */
export function signUpload(folder: string): SignedUpload | null {
  const c = configured();
  if (!c) return null;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ folder, timestamp }, c.secret);
  return { signature, timestamp, apiKey: c.key, cloudName: c.cloud, folder };
}

/** Удаляет картинку из Cloudinary по public_id. */
export async function destroyImage(publicId: string): Promise<boolean> {
  const c = configured();
  if (!c) return false;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, c.secret);
  const form = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: c.key,
    signature,
  });
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/destroy`, {
      method: "POST",
      body: form,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const isCloudinaryServerConfigured = (): boolean => configured() !== null;
