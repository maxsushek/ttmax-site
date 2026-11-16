// /.well-known/ard.json — маніфест Agentic Resource Discovery (ARD v0.91): каталог агентних
// ресурсів сайту для ШІ-агентів і реєстрів. Пояснення й першоджерела — у lib/seo/ard.ts.
//
// ⚠️ Фізично маршрут лежить у app/well-known/, а не app/.well-known/: App Router ігнорує теки,
// що починаються з крапки. Перепис адреси — у next.config.ts (rewrites).
import { buildArdManifest } from "@/lib/seo/ard";

// ⚠️ БЕЗ ТАЙМЕРА: вміст статичний, збирається на деплої. Регенерація за часом палила б
// ISR-записи Vercel без жодних нових даних.
export const revalidate = false;

export function GET() {
  return new Response(JSON.stringify(buildArdManifest(), null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
