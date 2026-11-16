"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Options = {
  /** Перевести фокус на саму панель під час відкриття (панелі потрібен tabIndex={-1}). */
  autoFocus?: boolean;
  /** Закриття по Escape. Не спрацьовує, якщо подія прийшла з вкладеного діалогу. */
  onEscape?: () => void;
};

/**
 * Поведінка фокуса для модальних вікон (role="dialog" + aria-modal="true"):
 * фокус усередину під час відкриття, Tab ходить по колу в межах вікна,
 * після закриття фокус повертається на елемент, що відкрив вікно.
 *
 * ⚠️ НАВІЩО: PageSpeed/Lighthouse (категорія Agentic Browsing, аудит
 * agent-accessibility-tree) і скрінрідери читають aria-modal буквально — «усе поза
 * вікном недоступне». Якщо фокус при цьому лишається на сторінці під вікном,
 * клавіатура й ШІ-агент опиняються в «невидимій» частині сторінки.
 */
export function useDialogFocus(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  { autoFocus = true, onEscape }: Options = {},
) {
  // onEscape зазвичай створюється наново на кожен рендер — тримаємо в ref,
  // щоб ефект не перепідписувався і не смикав фокус.
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (autoFocus && !node.contains(document.activeElement)) {
      node.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const from = e.target instanceof Element ? e.target.closest('[role="dialog"]') : null;
        if (from === node || from === null) escapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, ref, autoFocus]);
}
