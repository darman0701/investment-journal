"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Position {
  ticker: string;
  name: string;
  avgPrice: number;
  totalQuantity: number;
  totalCost: number;
}

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
}

interface Props {
  positions: Position[];
  prices: Record<string, PriceData | null>;
}

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#06b6d4", "#a78bfa", "#ec4899", "#14b8a6"];

export default function PortfolioAnalytics({ positions, prices }: Props) {
  if (positions.length === 0) return null;

  // Allocation data
  const allocationData = positions.map((pos, i) => {
    const pd = prices[pos.ticker];
    const value = pd ? pd.price * pos.totalQuantity : pos.totalCost;
    return {
      name: pos.name,
      ticker: pos.ticker,
      value: Math.round(value),
      fill: COLORS[i % COLORS.length],
    };
  });

  const total = allocationData.reduce((s, d) => s + d.value, 0);

  // Cost vs Current comparison data
  const comparisonData = positions.map((pos) => {
    const pd = prices[pos.ticker];
    return {
      name: pos.ticker,
      取得原価: Math.round(pos.totalCost),
      現在評価: pd ? Math.round(pd.price * pos.totalQuantity) : Math.round(pos.totalCost),
    };
  });

  // P&L per stock
  const plData = positions.map((pos) => {
    const pd = prices[pos.ticker];
    const pl = pd ? (pd.price - pos.avgPrice) * pos.totalQuantity : 0;
    return {
      name: pos.ticker,
      損益: Math.round(pl),
      fill: pl >= 0 ? "#10b981" : "#f43f5e",
    };
  }).sort((a, b) => b.損益 - a.損益);

  return (
    <div className="space-y-6">
      {/* Allocation Pie */}
      <div>
        <h4 className="text-[13px] font-medium mb-3">保有比率</h4>
        <div className="flex items-center gap-4">
          <div style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="#09090b"
                >
                  {allocationData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [`¥${Number(value).toLocaleString()}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {allocationData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.fill }} />
                <span className="text-muted truncate flex-1">{d.name}</span>
                <span className="tabular-nums text-foreground/80">{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost vs Current */}
      <div>
        <h4 className="text-[13px] font-medium mb-3">取得原価 vs 現在評価</h4>
        <div className="bg-surface rounded-xl border border-border p-3" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }}
                formatter={(value) => [`¥${Number(value).toLocaleString()}`, ""]}
              />
              <Bar dataKey="取得原価" fill="#71717a" radius={[2, 2, 0, 0]} />
              <Bar dataKey="現在評価" fill="#6366f1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P&L per stock */}
      <div>
        <h4 className="text-[13px] font-medium mb-3">銘柄別損益</h4>
        <div className="space-y-1.5">
          {plData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="text-[11px] text-muted w-12 text-right shrink-0 font-mono">{d.name}</span>
              <div className="flex-1 h-5 bg-card rounded overflow-hidden relative flex items-center">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${Math.min(Math.abs(d.損益) / Math.max(...plData.map((p) => Math.abs(p.損益))) * 100, 100)}%`,
                    backgroundColor: d.fill,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className={`text-[11px] tabular-nums w-20 text-right font-medium ${d.損益 >= 0 ? "text-success" : "text-danger"}`}>
                {d.損益 >= 0 ? "+" : ""}¥{d.損益.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
