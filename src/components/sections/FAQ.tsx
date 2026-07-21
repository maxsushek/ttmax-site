"use client";

import { useState } from "react";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { trackEvent } from "@/lib/analytics/events";
import type { Messages } from "@/i18n/messages/types";
import type { HomeOverrides } from "@/lib/homepage/home";
import { cn } from "@/utils/cn";

export function FAQ({
  messages,
  overrides,
  items,
}: {
  messages: Messages;
  overrides: HomeOverrides;
  /** Питання з уже розгорнутими плейсхолдерами (напр. {freeShippingThreshold}). */
  items?: ReadonlyArray<{ q: string; a: string }>;
}) {
  const m = messages.faq;
  const list = items ?? m.items;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section ariaLabelledBy="faq-title" className="!py-16 lg:!py-20">
      <Container className="max-w-[740px]">
        <div className="mb-11 text-center">
          <SectionKicker>{overrides.faqKicker || m.kicker}</SectionKicker>
          <SectionTitle id="faq-title">{overrides.faqTitle || m.title}</SectionTitle>
        </div>
        <ul className="flex flex-col gap-2">
          {list.map((item, i) => {
            const isOpen = openIndex === i;
            const id = `faq-${i}`;
            return (
              <li
                key={item.q}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-bg-raised transition-colors duration-300",
                  isOpen ? "border-accent/15" : "border-border-subtle",
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${id}-panel`}
                  id={`${id}-button`}
                  onClick={() => {
                    const next = isOpen ? null : i;
                    setOpenIndex(next);
                    if (next !== null) {
                      trackEvent({ name: "faq_open", params: { question: item.q } });
                    }
                  }}
                  className="flex w-full items-center justify-between bg-transparent px-6 py-5 text-left"
                >
                  <span className="font-display text-lg font-bold tracking-[0.02em]">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "ml-4 inline-block shrink-0 text-2xl text-accent transition-transform duration-300",
                      isOpen && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
                <div
                  id={`${id}-panel`}
                  role="region"
                  aria-labelledby={`${id}-button`}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-[380ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 font-body text-[15px] leading-[1.75] text-ink-dim">
                      {item.a}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
