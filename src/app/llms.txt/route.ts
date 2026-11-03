// /llms.txt — карта сайту для ШІ-асистентів.
// Маршрут, а не статичний файл: ціни й перелік товарів тягнуться з того ж джерела,
// що й сторінки, тож файл не старіє між деплоями (див. lib/seo/llms.ts).
import { getMediaMap } from "@/lib/media/get";
import { getOverrides } from "@/lib/catalog/overrides";
import { getContact } from "@/lib/contact/get";
import { buildLlmsIndex } from "@/lib/seo/llms";

// ⚠️ БЕЗ ТАЙМЕРА (03.11.2026, на прохання власника): файл перезбирається на кожному деплої,
// а ціни/наявність/контакти всередині оновлюються тим самим тегом, що й сторінки (адмінка →
// revalidateTag). Погодинна регенерація лише палила ISR-записи Vercel без нових даних.
export const revalidate = false;

export async function GET() {
  const [media, overrides, contact] = await Promise.all([
    getMediaMap(),
    getOverrides(),
    getContact(),
  ]);
  return new Response(buildLlmsIndex({ media, overrides, contact }), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
