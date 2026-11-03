// /.well-known/ai.txt — той самий вміст, що й /ai.txt, за стандартним шляхом.
//
// ⚠️ Фізично маршрут лежить у app/well-known/, а не app/.well-known/: App Router
// ігнорує теки, що починаються з крапки. Перепис адреси — у next.config.ts (rewrites).
import { getContact } from "@/lib/contact/get";
import { buildAiTxt } from "@/lib/seo/llms";

// ⚠️ БЕЗ ТАЙМЕРА (03.11.2026, на прохання власника): файл перезбирається на кожному деплої,
// а ціни/наявність/контакти всередині оновлюються тим самим тегом, що й сторінки (адмінка →
// revalidateTag). Погодинна регенерація лише палила ISR-записи Vercel без нових даних.
export const revalidate = false;

export async function GET() {
  return new Response(buildAiTxt(await getContact()), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
