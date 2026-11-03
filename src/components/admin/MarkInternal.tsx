"use client";

// Позначає цей браузер як «власник сайту»: після відкриття адмінки всі події PostHog на сайті
// йдуть з internal=true і відсіюються фільтром внутрішнього трафіку (див. config/posthog.ts).
import { useEffect } from "react";
import { markInternalBrowser } from "@/config/posthog";

export function MarkInternal() {
  useEffect(() => {
    markInternalBrowser();
  }, []);
  return null;
}
