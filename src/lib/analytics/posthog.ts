// src/lib/analytics/posthog.ts
// PostHog у браузері: ліниве завантаження + черга подій до готовності.
//
// ⚠️ НАВІЩО ЛІНИВО: posthog-js — ~340 КБ коду (~107 КБ gzip). Підключений звичайним import,
// він потрапив би в основний бандл кожної сторінки й погіршив PageSpeed (LCP/TBT), за який
// ми окремо боролись (див. inlineCss у next.config.ts). Тому бібліотека вантажиться окремим
// чанком ПІСЛЯ load, у вільний час браузера. Події, що трапились раніше (view_item на картці),
// чекають у черзі й ідуть зі своїм справжнім часом.
//
// Тут немає статичного import "posthog-js" — лише тип. Не додавати: інакше вся бібліотека
// знову опиниться в бандлі кожного компонента, що викликає trackEvent.
import type { PostHog } from "posthog-js";
import {
  INTERNAL_FLAG,
  POSTHOG_API_HOST,
  POSTHOG_HOSTNAMES,
  POSTHOG_TOKEN,
  POSTHOG_UI_HOST,
} from "@/config/posthog";

type Job = (ph: PostHog) => void;

let instance: PostHog | null = null;
let state: "idle" | "loading" | "ready" | "off" = "idle";
const queue: Job[] = [];
const MAX_QUEUE = 100;
let firstPageviewDated = false;

function enabledHere(): boolean {
  if (typeof window === "undefined" || !POSTHOG_TOKEN) return false;
  return POSTHOG_HOSTNAMES.includes(window.location.hostname);
}

function isInternal(): boolean {
  try {
    return window.localStorage.getItem(INTERNAL_FLAG) === "1";
  } catch {
    return false;
  }
}

function withPosthog(job: Job): void {
  if (state === "off") return;
  if (state === "idle" && !enabledHere()) {
    state = "off";
    return;
  }
  if (instance) {
    job(instance);
    return;
  }
  if (queue.length < MAX_QUEUE) queue.push(job);
}

/** Подія в PostHog. До завантаження бібліотеки — у черзі, з часом виклику. */
export function phCapture(event: string, properties: Record<string, unknown> = {}): void {
  const at = new Date();
  withPosthog((ph) => {
    ph.capture(event, properties, { timestamp: at });
  });
}

/**
 * Значення фіча-флагу, щойно PostHog його завантажить. Колбек отримує `undefined`, якщо флагу
 * немає або PostHog вимкнений (localhost, прев'ю, блокувальник) — тоді компонент лишає дефолт.
 * Використання як «вимикача»: показувати за замовчуванням, ховати лише на явне `false`.
 */
export function phFeatureFlag(key: string, cb: (enabled: boolean | undefined) => void): void {
  withPosthog((ph) => {
    ph.onFeatureFlags(() => cb(ph.isFeatureEnabled(key)));
  });
}

/**
 * Запуск (AnalyticsProvider, один раз на вкладку). Адмінка — окремий кореневий layout без
 * AnalyticsProvider, тож туди PostHog не потрапляє взагалі.
 */
export function initPosthog(): void {
  if (state !== "idle") return;
  if (!enabledHere()) {
    state = "off";
    queue.length = 0;
    return;
  }
  state = "loading";

  const start = () => {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(POSTHOG_TOKEN, {
          api_host: POSTHOG_API_HOST,
          ui_host: POSTHOG_UI_HOST,
          defaults: "2026-08-30",
          // Нікого не ідентифікуємо (немає акаунтів) — усі події анонімні, профілів людей не
          // створюємо. Імені й телефону в PostHog немає і бути не повинно.
          person_profiles: "identified_only",
          capture_exceptions: true,
          // Опитувань не використовуємо — не тягнемо surveys.js на кожну сторінку.
          disable_surveys: true,
          before_send: (event) => {
            // ⚠️ Перший $pageview бібліотека пише в момент ліниво відкладеного init — уже ПІСЛЯ
            // подій сторінки з черги (view_item тощо, з їхнім справжнім часом). Тоді у воронках
            // «перегляд сторінки → дія» вхідна сторінка ламала б порядок кроків. Ставимо йому час
            // відкриття сторінки — саме тоді перегляд і стався.
            if (event && event.event === "$pageview" && !firstPageviewDated) {
              firstPageviewDated = true;
              event.timestamp = new Date(performance.timeOrigin);
            }
            return event;
          },
          session_recording: {
            // Усе, що людина вводить (ім'я, телефон, місто, відділення, текст відгуку), у записі
            // зірочками. .ph-mask — текст на екрані, у якому видно введене (підсумок доставки,
            // e-mail на екрані «Дякуємо»).
            maskAllInputs: true,
            maskTextSelector: ".ph-mask",
          },
        });
        if (isInternal()) posthog.register({ internal: true });
        instance = posthog;
        state = "ready";
        for (const job of queue.splice(0)) {
          try {
            job(posthog);
          } catch {
            /* одна подія не має зупиняти решту */
          }
        }
      })
      .catch(() => {
        // Чанк не завантажився (блокувальник, обрив мережі) — сайт працює як і без PostHog.
        state = "off";
        queue.length = 0;
      });
  };

  const whenIdle = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(start, { timeout: 4000 });
    } else {
      setTimeout(start, 1500);
    }
  };

  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}
