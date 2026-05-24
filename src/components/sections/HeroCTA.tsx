"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";
import type { Messages } from "@/i18n/messages/types";

export function HeroCTA({ messages }: { messages: Messages }) {
  const m = messages.hero;

  const onPrimary = () => {
    trackEvent({ name: "cta_click", params: { cta: "view-catalog", location: "hero" } });
    document.querySelector("#categories")?.scrollIntoView({ behavior: "smooth" });
  };

  const onSecondary = () => {
    trackEvent({ name: "cta_click", params: { cta: "consultation", location: "hero" } });
    document.querySelector("#consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="primary"
        size="lg"
        onClick={onPrimary}
        data-cta="view-catalog"
        data-location="hero"
      >
        {m.ctaPrimary} →
      </Button>
      <Button
        variant="ghost"
        size="lg"
        onClick={onSecondary}
        data-cta="consultation"
        data-location="hero"
      >
        {m.ctaSecondary}
      </Button>
    </div>
  );
}
