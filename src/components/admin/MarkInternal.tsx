"use client";

// Позначає цей браузер як «власник сайту»: після відкриття адмінки всі події PostHog на сайті
// йдуть з internal=true і відсіюються фільтром внутрішнього трафіку (див. config/posthog.ts).
import { useEffect } from "react";
import { INTERNAL_FLAG } from "@/config/posthog";

export function MarkInternal() {
  useEffect(() => {
    try {
      window.localStorage.setItem(INTERNAL_FLAG, "1");
    } catch {
      /* приватний режим — нічого страшного */
    }
  }, []);
  return null;
}
