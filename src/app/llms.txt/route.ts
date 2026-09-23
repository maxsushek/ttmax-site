// /llms.txt — карта сайту для ШІ-асистентів.
// Маршрут, а не статичний файл: ціни й перелік товарів тягнуться з того ж джерела,
// що й сторінки, тож файл не старіє між деплоями (див. lib/seo/llms.ts).
import { getMediaMap } from "@/lib/media/get";
import { getOverrides } from "@/lib/catalog/overrides";
import { getContact } from "@/lib/contact/get";
import { buildLlmsIndex } from "@/lib/seo/llms";

export const revalidate = 3600;

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
