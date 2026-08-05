"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";
import type { Messages } from "@/i18n/messages/types";
import { ArrowRight } from "@/components/ui/ArrowRight";

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
    /**
     * ⚠️ px-6 замість типового px-8 для розміру lg — і не повертати назад.
     *
     * Дві кнопки стоять поруч у колонці героя, а вона рівно половина контейнера:
     * 540px при вікні 1200+. Російські підписи довші за українські, і при px-8
     * пара займала ~554px проти ~533px в українській — тобто UA вміщалась, а RU
     * переносилась на другий рядок. Виглядало так, ніби у двох мовних версій різна
     * верстка героя, хоча flex-wrap просто робив свою роботу.
     *
     * px-6 знімає 32px з пари: RU виходить ~522px, UA ~501px — обидві з запасом.
     * Нижче 1200 колонка вужчає, і тоді переносяться ОБИДВІ — теж однаково.
     *
     * Правимо саме тут через className (cn використовує twMerge, тож px-6 чисто
     * перебиває px-8), а не в самому Button: розмір lg використовується ще в формах,
     * кошику й чекауті, де кнопки на всю ширину і відступи ні на що не впливають.
     */
    <div className="flex flex-wrap gap-3">
      <Button
        variant="primary"
        size="lg"
        className="px-6"
        onClick={onPrimary}
        data-cta="view-catalog"
        data-location="hero"
      >
        {m.ctaPrimary}
        <ArrowRight />
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="px-6"
        onClick={onSecondary}
        data-cta="consultation"
        data-location="hero"
      >
        {m.ctaSecondary}
      </Button>
    </div>
  );
}
