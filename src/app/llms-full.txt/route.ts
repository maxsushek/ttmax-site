// /llms-full.txt — повні дані для ШІ: ціни, наявність, характеристики, FAQ.
import { getMediaMap } from "@/lib/media/get";
import { getOverrides } from "@/lib/catalog/overrides";
import { getContact } from "@/lib/contact/get";
import { buildLlmsFull } from "@/lib/seo/llms";

export const revalidate = 3600;

export async function GET() {
  const [media, overrides, contact] = await Promise.all([
    getMediaMap(),
    getOverrides(),
    getContact(),
  ]);
  return new Response(buildLlmsFull({ media, overrides, contact }), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
