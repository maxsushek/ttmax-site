"use client";

// Кліки зі статті блогу на каталог і на інші статті.
//
// НАВІЩО: за жовтень 2026 жоден із 22 візитів, що почались зі статті, не дійшов до товару, а
// в середньому на статті проводять 37 с. Щоб бачити, чи працюють картки-рекомендації,
// «таблетки» розділів, блок «Також у каталозі» й «Читайте також», кожне таке посилання
// позначене data-blog-link="<вид>" у BlogArticle, а тут один слухач рахує кліки.
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

export function BlogClickTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-blog-link]");
      if (!el) return;
      trackEvent({
        name: "blog_link_click",
        params: {
          post: slug,
          kind: el.dataset.blogLink ?? "other",
          href: el.getAttribute("href") ?? "",
        },
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [slug]);

  return null;
}
