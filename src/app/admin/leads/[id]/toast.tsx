"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error";
type Toast = { id: number; kind: ToastKind; text: string };

type ToastContextValue = {
  push: (kind: ToastKind, text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback — не падаем, если по какой-то причине провайдер не примонтирован
    return {
      push: (_kind: ToastKind, _text: string) => {
        // no-op
      },
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      <div
        aria-live="polite"
        className="fixed z-[9999] bottom-4 right-4 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isSuccess = toast.kind === "success";
  const icon = isSuccess ? "✓" : "✗";
  const color = isSuccess ? "#2ED573" : "#FF6B81";
  const bg = isSuccess ? "rgba(46,213,115,0.08)" : "rgba(255,107,129,0.08)";

  return (
    <div
      className="pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-200"
      style={{
        background: `${bg}`,
        borderColor: `${color}33`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-black"
        style={{ background: color, color: "#080A0E" }}
      >
        {icon}
      </span>
      <span
        className="text-[13px] font-medium"
        style={{ color, fontFamily: "'Barlow',sans-serif" }}
      >
        {toast.text}
      </span>
    </div>
  );
}
