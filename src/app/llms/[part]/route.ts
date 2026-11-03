// /llms/<частина>.txt — частини llms-full.txt окремими файлами (див. llmsParts у lib/seo/llms.ts).
// Повний /llms-full.txt лишається; ці файли — для асистентів, що обрізають великі відповіді.
import { getMediaMap } from "@/lib/media/get";
import { getOverrides } from "@/lib/catalog/overrides";
import { getContact } from "@/lib/contact/get";
import { buildLlmsPart, llmsParts } from "@/lib/seo/llms";

// ⚠️ БЕЗ ТАЙМЕРА (03.11.2026, на прохання власника): файл перезбирається на кожному деплої,
// а ціни/наявність/контакти всередині оновлюються тим самим тегом, що й сторінки (адмінка →
// revalidateTag). Погодинна регенерація лише палила ISR-записи Vercel без нових даних.
export const revalidate = false;
// Статично, як /llms.txt: перелік частин відомий на збірці. Без цього маршрут був би
// функцією на кожен запит (ƒ) — зайві виклики й читання кешу на кожного бота.
export const dynamicParams = false;

export async function generateStaticParams() {
  const [media, overrides] = await Promise.all([getMediaMap(), getOverrides()]);
  return llmsParts({ media, overrides }).map((p) => ({ part: `${p.slug}.txt` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ part: string }> }) {
  const { part } = await params;
  const slug = part.endsWith(".txt") ? part.slice(0, -4) : null;
  if (!slug) return new Response("Not found", { status: 404 });
  const [media, overrides, contact] = await Promise.all([getMediaMap(), getOverrides(), getContact()]);
  const body = buildLlmsPart(slug, { media, overrides, contact });
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
