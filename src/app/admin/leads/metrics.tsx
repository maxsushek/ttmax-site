type Metrics = {
  total: number;
  qualified: number;
  won: number;
  conversion: number;
  revenue: number;
};

export function LeadsMetrics({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: "Total", value: metrics.total.toString(), color: "#aaa" },
    { label: "Qualified+", value: metrics.qualified.toString(), color: "#54A0FF" },
    { label: "Won", value: metrics.won.toString(), color: "#2ED573" },
    { label: "Conversion", value: `${metrics.conversion}%`, color: "#E8FF47" },
    {
      label: "Revenue",
      value: `${metrics.revenue.toLocaleString("uk-UA")} ₴`,
      color: "#E8FF47",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[#0E1117] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-white/[0.12] transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#555] mb-1.5">
            {c.label}
          </div>
          <div
            className="text-2xl font-black tracking-tight leading-none truncate"
            style={{ color: c.color }}
            title={c.value}
          >
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
