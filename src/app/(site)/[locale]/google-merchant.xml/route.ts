// /{locale}/google-merchant.xml — товарний фід Google Merchant Center (див. lib/feeds/google-merchant.ts).
//
// Окремий фід на кожну мову: Merchant Center вимагає, щоб мова фіду збігалась із мовою
// сторінки товару, тож український фід веде на /ua/…, російський — на /ru/….
//
// ⚠️ ДИНАМІЧНИЙ І ПОТОКОВИЙ — свідомо:
//  • force-dynamic: фід тягне ціни, наявність і фото з тих самих кешованих джерел, що й
//    картка (getOverrides / getMediaMap / getSettings, теги з адмінки), тож завжди свіжий —
//    і не пише ISR-кеш (квота Vercel). Merchant Center забирає фід раз на добу.
//  • потік: повний фід — кілька мегабайт, а звичайна (не потокова) відповідь функції Vercel
//    обмежена 4,5 МБ (FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE). На потокові відповіді ліміт не діє.
import { isLocale } from "@/i18n/config";
import { getMediaMap } from "@/lib/media/get";
import { getOverrides } from "@/lib/catalog/overrides";
import { getContact } from "@/lib/contact/get";
import { merchantXmlChunks } from "@/lib/feeds/google-merchant";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ locale: string }> }) {
  const { locale } = await ctx.params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const [media, overrides, contact] = await Promise.all([getMediaMap(), getOverrides(), getContact()]);
  const chunks = merchantXmlChunks({
    locale,
    media,
    overrides,
    delivery: {
      freeShippingThreshold: contact.freeShippingThreshold,
      shippingFee: contact.shippingFee,
      ukrposhtaFee: contact.ukrposhtaFee,
    },
  });

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      // По одному товару за раз: памʼять і час до першого байта не залежать від розміру фіду.
      const next = chunks.next();
      if (next.done) controller.close();
      else controller.enqueue(enc.encode(next.value));
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Фід — для Merchant Center, а не для пошукової видачі.
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
