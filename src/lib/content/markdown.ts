// src/lib/content/markdown.ts
// Мінімальний БЕЗПЕЧНИЙ markdown→HTML для адмінських SEO-текстів.
// Спершу екрануємо весь HTML (захист від XSS), потім вмикаємо лише дозволений набір:
// заголовки # / ## / ###, абзаци, списки "- " або "* ", жирний **…**, курсив *…*, посилання [текст](url).
// РОЗБІР ПОРЯДКОВИЙ: заголовок/список/абзац визначаються по рядку — не залежить від порожніх рядків,
// тож "## Заголовок", "### Підзаголовок" і текст підряд (через один \n) рендеряться коректно.
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
  const text = escapeHtml(md.replace(/\r\n/g, "\n").trim());
  if (!text) return "";

  const html: string[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      html.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  const flushAll = () => {
    flushList();
    flushPara();
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushAll();
      continue;
    }
    if (/^### /.test(line)) {
      flushAll();
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (/^## /.test(line)) {
      flushAll();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (/^# /.test(line)) {
      // На сторінці вже є H1 — одиничний "#" трактуємо як H2.
      flushAll();
      html.push(`<h2>${inline(line.slice(2))}</h2>`);
    } else if (/^[-*] /.test(line)) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushAll();
  return html.join("");
}
