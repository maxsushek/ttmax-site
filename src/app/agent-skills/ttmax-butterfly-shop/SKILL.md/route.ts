// /agent-skills/ttmax-butterfly-shop/SKILL.md — навичка (Agent Skill) для ШІ-агентів: де на сайті
// лежать ціни, наявність, характеристики, словник і фіди та чого агентові робити не можна
// (самостійно відправляти замовлення, заявки, відгуки). На неї посилається /.well-known/ard.json.
// Назва теки мусить збігатися з AGENT_SKILL_NAME у lib/seo/ard.ts.
import { buildAgentSkill } from "@/lib/seo/ard";

// ⚠️ БЕЗ ТАЙМЕРА: вміст статичний, збирається на деплої (квоти ISR на Vercel).
export const revalidate = false;

export function GET() {
  return new Response(buildAgentSkill(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
