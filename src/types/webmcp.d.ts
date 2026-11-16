// WebMCP — типи для атрибутів декларативного API (форми як інструменти ШІ-агентів).
//
// Першоджерела (звірено 16.11.2026; API в origin trial із Chrome 149 і ще змінюється):
// - https://developer.chrome.com/docs/ai/webmcp/declarative-api (оновл. 25.09.2026)
// - https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md
//
// ⚠️ `toolautosubmit` тут СВІДОМО не оголошено. З цим атрибутом агент сам відправляє форму,
// а наші форми (заявка, замовлення, відгук) ідуть власникові в Telegram як справжні
// звернення. Без атрибута браузер лише заповнює поля й підсвічує кнопку — відправляє людина.
// Якщо TypeScript свариться на `toolautosubmit` — це запобіжник, а не недогляд.
import "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface FormHTMLAttributes<T> {
    /** Назва інструмента: латиниця, цифри, «_», до 30 символів (рекомендація Chrome). */
    toolname?: string;
    /** Що робить форма — для моделі, до 500 символів. */
    tooldescription?: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    /** Опис параметра для моделі (до 150 символів). Без нього браузер бере текст <label>. */
    toolparamdescription?: string;
  }
}
