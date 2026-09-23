// /ai.txt — політика використання вмісту ШІ-асистентами + пріоритетні сторінки.
import { getContact } from "@/lib/contact/get";
import { buildAiTxt } from "@/lib/seo/llms";

export const revalidate = 3600;

export async function GET() {
  return new Response(buildAiTxt(await getContact()), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
