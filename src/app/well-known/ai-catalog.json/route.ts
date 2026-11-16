// /.well-known/ai-catalog.json — ПОПЕРЕДНЯ назва маніфесту ARD (до v0.91). Той самий вміст,
// що й /.well-known/ard.json.
//
// ⚠️ НАВІЩО дубль: старіші версії PageSpeed/Lighthouse і частина реєстрів шукають ще цю адресу
// (аудит звався «Схема ai-catalog.json»). Нові спершу читають ard.json, тож попередження
// «знайдено лише за застарілою адресою» не виникає. Коли PageSpeed перейде на ard.json —
// цей маршрут і його перепис у next.config.ts можна прибрати.
import { buildArdManifest } from "@/lib/seo/ard";

export const revalidate = false;

export function GET() {
  return new Response(JSON.stringify(buildArdManifest(), null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
