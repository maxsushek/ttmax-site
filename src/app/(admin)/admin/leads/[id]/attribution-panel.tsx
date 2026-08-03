"use client";

import { useState } from "react";

type Props = {
  attribution: Record<string, unknown>;
  source: string;
  locale: string;
};

const PRIMARY_KEYS = [
  { key: "gclid", label: "Google Ads", icon: "🟢" },
  { key: "fbclid", label: "Meta Ads", icon: "🔵" },
  { key: "utm_source", label: "UTM Source", icon: "" },
  { key: "utm_medium", label: "UTM Medium", icon: "" },
  { key: "utm_campaign", label: "UTM Campaign", icon: "" },
  { key: "utm_content", label: "UTM Content", icon: "" },
  { key: "utm_term", label: "UTM Term", icon: "" },
  { key: "referer", label: "Referer", icon: "" },
];

const HIDDEN_KEYS = new Set([...PRIMARY_KEYS.map((p) => p.key)]);

function pickPrimary(attribution: Record<string, unknown>) {
  return PRIMARY_KEYS.map((p) => {
    const value = attribution[p.key];
    if (typeof value === "string" && value.length > 0) {
      return { ...p, value };
    }
    return null;
  }).filter((x): x is { key: string; label: string; icon: string; value: string } => x !== null);
}

function pickOther(attribution: Record<string, unknown>) {
  return Object.entries(attribution).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== ""
  );
}

function detectTrafficSource(attribution: Record<string, unknown>): {
  label: string;
  color: string;
} {
  if (typeof attribution.gclid === "string" && attribution.gclid) {
    return { label: "Google Ads", color: "#E8FF47" };
  }
  if (typeof attribution.fbclid === "string" && attribution.fbclid) {
    return { label: "Meta Ads", color: "#54A0FF" };
  }
  const utmSource = attribution.utm_source;
  if (typeof utmSource === "string" && utmSource) {
    return { label: `UTM: ${utmSource}`, color: "#A29BFE" };
  }
  const referer = attribution.referer;
  if (typeof referer === "string" && referer) {
    try {
      const host = new URL(referer).hostname.replace("www.", "");
      return { label: host, color: "#888" };
    } catch {
      // ignore
    }
  }
  return { label: "Прямой заход", color: "#666" };
}

export function AttributionPanel({ attribution, source, locale }: Props) {
  const [open, setOpen] = useState(false);

  const primary = pickPrimary(attribution);
  const other = pickOther(attribution);
  const trafficSource = detectTrafficSource(attribution);
  const hasData = primary.length > 0 || other.length > 0;

  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-[16px] flex-shrink-0">
            📊
          </div>
          <div className="text-left min-w-0">
            <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#666] mb-0.5">
              Источник
            </div>
            <div
              className="text-[13px] font-bold truncate"
              style={{ color: trafficSource.color }}
            >
              {trafficSource.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasData && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(232,255,71,0.08)",
                color: "#E8FF47",
              }}
            >
              {primary.length + other.length}
            </span>
          )}
          <span
            className="text-[#E8FF47] text-[14px] transition-transform duration-300"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          >
            ▾
          </span>
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
            <div className="grid grid-cols-2 gap-2 mb-3 mt-3">
              <Field label="Source" value={source} />
              <Field label="Locale" value={locale.toUpperCase()} />
            </div>

            {primary.length > 0 && (
              <div className="space-y-2 mb-3">
                {primary.map((p) => (
                  <Field
                    key={p.key}
                    label={p.label}
                    value={p.value}
                    icon={p.icon}
                  />
                ))}
              </div>
            )}

            {other.length > 0 && (
              <details className="mt-3">
                <summary
                  className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#666] cursor-pointer hover:text-[#E8FF47] transition-colors py-1"
                  style={{ listStyle: "none" }}
                >
                  Технические данные ({other.length}) →
                </summary>
                <div className="mt-2 space-y-1.5">
                  {other.map(([k, v]) => (
                    <Field key={k} label={k} value={String(v)} small />
                  ))}
                </div>
              </details>
            )}

            {!hasData && (
              <div
                className="text-[12px] text-[#444] text-center py-3"
                style={{ fontFamily: "'Barlow',sans-serif" }}
              >
                Attribution данных нет
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
  small = false,
}: {
  label: string;
  value: string;
  icon?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2">
      <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-[#444] mb-0.5">
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </div>
      <div
        className={`${small ? "text-[11px]" : "text-[12px]"} text-[#ccc] break-all`}
        style={{ fontFamily: "'Barlow',sans-serif" }}
      >
        {value}
      </div>
    </div>
  );
}
