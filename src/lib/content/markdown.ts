// src/lib/content/markdown.ts
// Мінімальний БЕЗПЕЧНИЙ markdown→HTML для адмінських SEO-текстів.
// Спершу екрануємо весь HTML (захист від XSS), потім вмикаємо лише дозволений набір:
// заголовки ## / ###, абзаци, переноси, списки "- ", жирний **…**, курсив *…*, посилання [текст](url).
// Зовнішні посилання отримують rel/target; внутрішні (з "/") лишаються dofollow для перелінковки.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  // Посилання: тільки http(s):// або внутрішні, що починаються з "/".
  let out = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    (_m, text: string, href: string) => {
      const external = /^https?:\/\//.test(href);
      const attrs = external ? ' rel="noopener noreferrer" target="_blank"' : "";
      return `<a href="${href}"${attrs}>${text}</a>`;
    },
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

/** Повертає безпечний HTML-рядок. Порожній вхід → "". */
export function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md.replace(/\r\n/g, "\n").trim());
  if (!escaped) return "";
  const blocks = escaped.split(/\n{2,}/);
  const html: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const first = lines[0] ?? "";
    if (lines.length === 1 && /^### /.test(first)) {
      html.push(`<h3>${inline(first.slice(4))}</h3>`);
    } else if (lines.length === 1 && /^## /.test(first)) {
      html.push(`<h2>${inline(first.slice(3))}</h2>`);
    } else if (lines.every((l) => /^[-*] /.test(l))) {
      const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("");
      html.push(`<ul>${items}</ul>`);
    } else {
      html.push(`<p>${inline(lines.join("<br/>"))}</p>`);
    }
  }
  return html.join("");
}
