import type { Messages } from "@/i18n/messages/types";

export function TrustBar({ messages }: { messages: Messages }) {
  const items = [
    { icon: "🚚", label: messages.trustBar.delivery },
    { icon: "↩️", label: messages.trustBar.returns },
    { icon: "🔒", label: messages.trustBar.secure },
    { icon: "⭐", label: messages.trustBar.rating },
  ];
  return (
    <div className="border-y border-border-subtle bg-white/[0.01] py-4">
      <div className="container-page grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <span aria-hidden className="text-lg">
              {item.icon}
            </span>
            <span className="font-body text-[12px] text-ink-muted sm:text-[13px]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
