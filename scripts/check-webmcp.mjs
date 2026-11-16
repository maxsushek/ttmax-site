// Перевірка WebMCP у справжньому Chrome — те саме, що бачить аудит Lighthouse
// (категорія Agentic Browsing: webmcp-registered-tools, webmcp-schema-validity).
//
// Запуск (потрібен Google Chrome 149+ і запущена локальна збірка):
//   npm run build && npx next start -p 3100
//   node scripts/check-webmcp.mjs                       — головна + картка товару
//   node scripts/check-webmcp.mjs http://localhost:3100/ua/nakladki
//
// ⚠️ НАВІЩО окремий скрипт. WebMCP — origin trial: у звичайному Chrome і в PageSpeed без токена
// API вимкнений, аудити показують «непридатно», і помилку в розмітці форми (поле без name,
// форма без tooldescription) не видно, доки токен не ввімкнуть на проді — а тоді аудит одразу
// падає. Тут Chrome запускається з увімкненими функціями WebMCP, і ми читаємо ті самі події
// DevTools-протоколу, що й Lighthouse: WebMCP.toolsAdded та Audits.issueAdded (FormModelContext*).
//
// Скрипт НІЧОГО не відправляє: форми не сабмітяться, інструменти лише перелічуються.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Назви функцій Blink (Chrome 157). Прапорець chrome://flags/#enable-webmcp-testing вмикає їх же.
const FEATURES = "WebMCP,DeclarativeWebMCP";
const PORT = 9333;
// Помилки (аудит = 0) і попередження (аудит = 0,5) — список із Lighthouse 13.6.
const ERRORS = new Set([
  "FormModelContextMissingToolName",
  "FormModelContextMissingToolDescription",
  "FormModelContextRequiredParameterMissingName",
]);
const WARNINGS = new Set([
  "FormModelContextParameterMissingTitleAndDescription",
  "FormModelContextParameterMissingName",
]);

const urls = process.argv.slice(2);
if (urls.length === 0)
  urls.push("http://localhost:3100/ua", "http://localhost:3100/ua/butterfly/nakladki/dignics-05");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "ttmax-webmcp-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    `--enable-features=${FEATURES}`,
    `--enable-blink-features=${FEATURES}`,
    "--window-size=412,915",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let failed = false;
try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    } catch {
      await sleep(250);
    }
  }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error(`Chrome не запустився (${CHROME}); шлях можна задати через CHROME_PATH`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  let tools = [];
  let issues = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
    if (msg.method === "WebMCP.toolsAdded") tools.push(...msg.params.tools);
    if (msg.method === "WebMCP.toolsRemoved") {
      const gone = new Set(msg.params.tools.map((t) => t.name));
      tools = tools.filter((t) => !gone.has(t.name));
    }
    if (msg.method === "Audits.issueAdded") {
      const type = msg.params.issue?.details?.genericIssueDetails?.errorType;
      if (type) issues.push(type);
    }
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      pending.set(++id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const enabled = await send("WebMCP.enable");
  if (enabled.error) throw new Error(`цей Chrome не знає домену WebMCP: ${enabled.error.message}`);
  await send("Audits.enable");
  await send("Page.enable");
  await send("Runtime.enable");

  for (const url of urls) {
    tools = [];
    issues = [];
    await send("Page.navigate", { url });
    await sleep(6000);
    const supported = (
      await send("Runtime.evaluate", {
        expression: "typeof document.modelContext !== 'undefined'",
        returnByValue: true,
      })
    ).result?.result?.value;
    console.log(`\n${url}`);
    if (!supported) {
      console.log("  ✗ document.modelContext відсутній — WebMCP у цьому Chrome не ввімкнувся");
      failed = true;
      continue;
    }
    for (const t of new Map(tools.map((t) => [t.name, t])).values()) {
      const kind = typeof t.backendNodeId === "number" ? "форма" : "скрипт";
      const params = Object.keys(t.inputSchema?.properties ?? {}).join(", ") || "без параметрів";
      console.log(`  ✓ ${t.name} (${kind}): ${params}`);
    }
    if (tools.length === 0) console.log("  — інструментів не зареєстровано");
    const errors = issues.filter((i) => ERRORS.has(i));
    const warnings = issues.filter((i) => WARNINGS.has(i));
    for (const e of errors) console.log(`  ✗ помилка схеми (аудит провалено): ${e}`);
    for (const w of warnings) console.log(`  ! попередження схеми (аудит 0,5): ${w}`);
    if (errors.length || warnings.length) failed = true;
    else console.log("  ✓ зауважень до схем немає");
  }
  ws.close();
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  failed = true;
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
