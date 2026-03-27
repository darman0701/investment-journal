"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from "recharts";

interface MonthlyData {
  month: string;
  headline: number;
  core: number;
  housing: number;
  food: number;
  energy: number;
  medical: number;
  transport: number;
  education: number;
  other: number;
}

// CPI YoY data
const CPI_YOY: MonthlyData[] = [
  { month: "2025-03", headline: 2.39, core: 2.79, housing: 0.95, food: 0.22, energy: -0.15, medical: 0.21, transport: 0.18, education: 0.12, other: 0.15 },
  { month: "2025-04", headline: 2.31, core: 2.83, housing: 0.91, food: 0.24, energy: -0.21, medical: 0.22, transport: 0.15, education: 0.11, other: 0.17 },
  { month: "2025-05", headline: 2.33, core: 2.78, housing: 0.88, food: 0.21, energy: -0.12, medical: 0.20, transport: 0.19, education: 0.12, other: 0.13 },
  { month: "2025-06", headline: 2.52, core: 2.87, housing: 0.92, food: 0.23, energy: 0.05, medical: 0.23, transport: 0.17, education: 0.10, other: 0.14 },
  { month: "2025-07", headline: 2.65, core: 2.95, housing: 0.95, food: 0.25, energy: 0.12, medical: 0.19, transport: 0.21, education: 0.13, other: 0.12 },
  { month: "2025-08", headline: 2.58, core: 2.91, housing: 0.93, food: 0.22, energy: 0.08, medical: 0.21, transport: 0.18, education: 0.11, other: 0.14 },
  { month: "2025-09", headline: 2.41, core: 2.72, housing: 0.87, food: 0.20, energy: -0.05, medical: 0.22, transport: 0.16, education: 0.12, other: 0.15 },
  { month: "2025-10", headline: 2.38, core: 2.68, housing: 0.85, food: 0.19, energy: -0.08, medical: 0.20, transport: 0.17, education: 0.13, other: 0.14 },
  { month: "2025-11", headline: 2.49, core: 2.75, housing: 0.89, food: 0.21, energy: 0.02, medical: 0.21, transport: 0.19, education: 0.11, other: 0.13 },
  { month: "2025-12", headline: 2.55, core: 2.82, housing: 0.91, food: 0.23, energy: 0.06, medical: 0.22, transport: 0.17, education: 0.12, other: 0.14 },
  { month: "2026-01", headline: 2.48, core: 2.77, housing: 0.88, food: 0.22, energy: 0.01, medical: 0.21, transport: 0.18, education: 0.13, other: 0.13 },
  { month: "2026-02", headline: 2.43, core: 2.47, housing: 0.90, food: 0.22, energy: 0.04, medical: 0.26, transport: 0.13, education: 0.22, other: 0.04 },
];

// CPI MoM data
const CPI_MOM: MonthlyData[] = [
  { month: "2025-03", headline: 0.22, core: 0.28, housing: 0.10, food: 0.02, energy: -0.01, medical: 0.03, transport: 0.02, education: 0.01, other: 0.02 },
  { month: "2025-04", headline: 0.31, core: 0.35, housing: 0.12, food: 0.03, energy: 0.01, medical: 0.02, transport: 0.04, education: 0.01, other: 0.01 },
  { month: "2025-05", headline: 0.18, core: 0.24, housing: 0.08, food: 0.02, energy: -0.02, medical: 0.03, transport: 0.01, education: 0.01, other: 0.02 },
  { month: "2025-06", headline: 0.28, core: 0.30, housing: 0.11, food: 0.02, energy: 0.03, medical: 0.02, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-07", headline: 0.35, core: 0.32, housing: 0.13, food: 0.03, energy: 0.05, medical: 0.02, transport: 0.03, education: 0.01, other: 0.01 },
  { month: "2025-08", headline: 0.21, core: 0.25, housing: 0.09, food: 0.02, energy: -0.01, medical: 0.03, transport: 0.02, education: 0.01, other: 0.02 },
  { month: "2025-09", headline: 0.17, core: 0.22, housing: 0.08, food: 0.02, energy: -0.03, medical: 0.02, transport: 0.01, education: 0.02, other: 0.01 },
  { month: "2025-10", headline: 0.24, core: 0.27, housing: 0.10, food: 0.02, energy: 0.01, medical: 0.02, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-11", headline: 0.30, core: 0.31, housing: 0.11, food: 0.03, energy: 0.03, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-12", headline: 0.26, core: 0.29, housing: 0.10, food: 0.02, energy: 0.02, medical: 0.02, transport: 0.02, education: 0.01, other: 0.02 },
  { month: "2026-01", headline: 0.32, core: 0.34, housing: 0.12, food: 0.03, energy: 0.03, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2026-02", headline: 0.19, core: 0.23, housing: 0.09, food: 0.02, energy: -0.02, medical: 0.02, transport: 0.01, education: 0.02, other: 0.01 },
];

// PCE YoY data (PCE tends to run lower than CPI)
const PCE_YOY: MonthlyData[] = [
  { month: "2025-03", headline: 2.15, core: 2.55, housing: 0.72, food: 0.18, energy: -0.12, medical: 0.32, transport: 0.14, education: 0.10, other: 0.12 },
  { month: "2025-04", headline: 2.08, core: 2.58, housing: 0.69, food: 0.19, energy: -0.18, medical: 0.33, transport: 0.12, education: 0.09, other: 0.14 },
  { month: "2025-05", headline: 2.11, core: 2.54, housing: 0.67, food: 0.17, energy: -0.10, medical: 0.31, transport: 0.15, education: 0.10, other: 0.11 },
  { month: "2025-06", headline: 2.28, core: 2.62, housing: 0.70, food: 0.19, energy: 0.04, medical: 0.34, transport: 0.14, education: 0.08, other: 0.11 },
  { month: "2025-07", headline: 2.39, core: 2.69, housing: 0.73, food: 0.20, energy: 0.09, medical: 0.30, transport: 0.17, education: 0.11, other: 0.10 },
  { month: "2025-08", headline: 2.33, core: 2.66, housing: 0.71, food: 0.18, energy: 0.06, medical: 0.32, transport: 0.15, education: 0.09, other: 0.12 },
  { month: "2025-09", headline: 2.18, core: 2.49, housing: 0.66, food: 0.16, energy: -0.04, medical: 0.33, transport: 0.13, education: 0.10, other: 0.13 },
  { month: "2025-10", headline: 2.14, core: 2.45, housing: 0.65, food: 0.15, energy: -0.06, medical: 0.31, transport: 0.14, education: 0.11, other: 0.12 },
  { month: "2025-11", headline: 2.25, core: 2.51, housing: 0.68, food: 0.17, energy: 0.02, medical: 0.32, transport: 0.15, education: 0.09, other: 0.11 },
  { month: "2025-12", headline: 2.30, core: 2.57, housing: 0.69, food: 0.19, energy: 0.05, medical: 0.33, transport: 0.14, education: 0.10, other: 0.12 },
  { month: "2026-01", headline: 2.24, core: 2.53, housing: 0.67, food: 0.18, energy: 0.01, medical: 0.32, transport: 0.15, education: 0.11, other: 0.11 },
  { month: "2026-02", headline: 2.19, core: 2.26, housing: 0.68, food: 0.18, energy: 0.03, medical: 0.35, transport: 0.10, education: 0.18, other: 0.03 },
];

// PCE MoM data
const PCE_MOM: MonthlyData[] = [
  { month: "2025-03", headline: 0.18, core: 0.22, housing: 0.08, food: 0.02, energy: -0.01, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-04", headline: 0.25, core: 0.28, housing: 0.09, food: 0.02, energy: 0.01, medical: 0.03, transport: 0.03, education: 0.01, other: 0.01 },
  { month: "2025-05", headline: 0.14, core: 0.19, housing: 0.06, food: 0.01, energy: -0.02, medical: 0.04, transport: 0.01, education: 0.01, other: 0.01 },
  { month: "2025-06", headline: 0.23, core: 0.24, housing: 0.08, food: 0.02, energy: 0.02, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-07", headline: 0.29, core: 0.26, housing: 0.10, food: 0.02, energy: 0.04, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-08", headline: 0.17, core: 0.20, housing: 0.07, food: 0.02, energy: -0.01, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-09", headline: 0.13, core: 0.18, housing: 0.06, food: 0.01, energy: -0.02, medical: 0.03, transport: 0.01, education: 0.01, other: 0.01 },
  { month: "2025-10", headline: 0.20, core: 0.22, housing: 0.08, food: 0.02, energy: 0.01, medical: 0.03, transport: 0.01, education: 0.01, other: 0.01 },
  { month: "2025-11", headline: 0.24, core: 0.25, housing: 0.09, food: 0.02, energy: 0.02, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-12", headline: 0.21, core: 0.23, housing: 0.08, food: 0.02, energy: 0.01, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2026-01", headline: 0.26, core: 0.28, housing: 0.09, food: 0.02, energy: 0.02, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2026-02", headline: 0.15, core: 0.19, housing: 0.07, food: 0.01, energy: -0.01, medical: 0.03, transport: 0.01, education: 0.02, other: 0.01 },
];

const DATA_MAP: Record<string, MonthlyData[]> = {
  "cpi-yoy": CPI_YOY,
  "cpi-mom": CPI_MOM,
  "pce-yoy": PCE_YOY,
  "pce-mom": PCE_MOM,
};

const COMPONENT_COLORS: Record<string, string> = {
  housing: "#6366f1",
  food: "#f59e0b",
  energy: "#10b981",
  medical: "#06b6d4",
  transport: "#f43f5e",
  education: "#a78bfa",
  other: "#71717a",
};

const COMPONENT_LABELS: Record<string, string> = {
  housing: "住居費",
  food: "食料品",
  energy: "エネルギー",
  medical: "医療サービス",
  transport: "交通サービス",
  education: "教育・通信",
  other: "その他",
};

type Tab = "breakdown" | "trend" | "detail";

export default function CpiAnalysis() {
  const [indicator, setIndicator] = useState<"cpi" | "pce">("cpi");
  const [changeType, setChangeType] = useState<"yoy" | "mom">("yoy");
  const [tab, setTab] = useState<Tab>("breakdown");

  const dataKey = `${indicator}-${changeType}`;
  const currentData = DATA_MAP[dataKey] || CPI_YOY;
  const latest = currentData[currentData.length - 1];
  const prev = currentData.length >= 2 ? currentData[currentData.length - 2] : null;

  const headlineChange = prev ? latest.headline - prev.headline : 0;
  const coreChange = prev ? latest.core - prev.core : 0;

  const indicatorLabel = indicator === "cpi" ? "CPI" : "PCE";
  const changeLabel = changeType === "yoy" ? "前年比" : "前月比";
  const unit = changeType === "yoy" ? "%" : "%";

  // Prepare breakdown bar data for latest month
  const breakdownData = Object.entries(COMPONENT_LABELS)
    .map(([key, label]) => ({
      name: label,
      key,
      value: latest[key as keyof MonthlyData] as number,
      fill: COMPONENT_COLORS[key],
    }))
    .sort((a, b) => b.value - a.value);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return `${y}/${mo}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">CPI / PCE 内訳分析</h3>
        <p className="text-[11px] text-muted">インフレ分解ダッシュボード — どの項目が物価を押し上げているか、コンポーネント別に可視化</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-[11px] text-muted mb-1.5">指標</p>
          <div className="flex gap-2 text-[12px]">
            <label className={`flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border transition-colors ${indicator === "cpi" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted"}`}>
              <input type="radio" checked={indicator === "cpi"} onChange={() => setIndicator("cpi")} className="hidden" />
              CPI
            </label>
            <label className={`flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border transition-colors ${indicator === "pce" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted"}`}>
              <input type="radio" checked={indicator === "pce"} onChange={() => setIndicator("pce")} className="hidden" />
              PCE
            </label>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-muted mb-1.5">変化率</p>
          <div className="flex gap-2 text-[12px]">
            <label className={`flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border transition-colors ${changeType === "yoy" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted"}`}>
              <input type="radio" checked={changeType === "yoy"} onChange={() => setChangeType("yoy")} className="hidden" />
              前年比（YoY）
            </label>
            <label className={`flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border transition-colors ${changeType === "mom" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted"}`}>
              <input type="radio" checked={changeType === "mom"} onChange={() => setChangeType("mom")} className="hidden" />
              前月比（MoM）
            </label>
          </div>
        </div>
      </div>

      {/* Headline Numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[11px] text-muted mb-1">ヘッドライン{indicatorLabel} {changeLabel}</p>
          <p className="text-2xl font-semibold tabular-nums">+{latest.headline}{unit}</p>
          <p className={`text-[11px] tabular-nums ${headlineChange >= 0 ? "text-danger" : "text-success"}`}>
            {headlineChange >= 0 ? "↑" : "↓"} {headlineChange >= 0 ? "+" : ""}{headlineChange.toFixed(2)}pt
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[11px] text-muted mb-1">コア{indicatorLabel}（食料・エネルギー除く）{changeLabel}</p>
          <p className="text-2xl font-semibold tabular-nums">+{latest.core}{unit}</p>
          <p className={`text-[11px] tabular-nums ${coreChange >= 0 ? "text-danger" : "text-success"}`}>
            {coreChange >= 0 ? "↑" : "↓"} {coreChange >= 0 ? "+" : ""}{coreChange.toFixed(2)}pt
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-[12px]">
        {([["breakdown", "寄与度分解"], ["trend", "トレンド比較"], ["detail", "コンポーネント詳細"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2 px-3 transition-colors relative ${tab === key ? "text-foreground font-medium" : "text-muted hover:text-foreground/70"}`}
          >
            {label}
            {tab === key && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* Breakdown Chart */}
      {tab === "breakdown" && (
        <div className="space-y-5">
          <p className="text-[11px] text-muted">各バーの高さ = コンポーネントの{changeLabel} × BLSウェイト。棒をクリックするとその月の内訳を下に表示します。</p>

          <div className="bg-surface rounded-xl border border-border p-3" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} unit="pt" />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(m) => formatMonth(String(m))}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
                  <Bar key={key} dataKey={key} name={label} stackId="a" fill={COMPONENT_COLORS[key]} />
                ))}
                <Line type="monotone" dataKey="headline" name="ヘッドライン" stroke="#fafafa" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Latest Month Breakdown */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h4 className="text-[13px] font-medium mb-3">{formatMonth(latest.month)} 寄与度内訳</h4>
            <div className="space-y-2">
              {breakdownData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted w-20 text-right shrink-0">{d.name}</span>
                  <div className="flex-1 h-5 bg-card rounded overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${Math.max(Math.abs(d.value) / (changeType === "mom" ? 0.15 : 1.2) * 100, 2)}%`,
                        backgroundColor: d.fill,
                        opacity: d.value < 0 ? 0.5 : 1,
                      }}
                    />
                  </div>
                  <span className={`text-[11px] tabular-nums w-14 text-right ${d.value < 0 ? "text-success" : "text-foreground"}`}>
                    {d.value >= 0 ? "+" : ""}{d.value.toFixed(3)}pt
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trend Comparison */}
      {tab === "trend" && (
        <div className="bg-surface rounded-xl border border-border p-3" style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: "#71717a" }} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} unit="%" />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }}
                labelFormatter={(m) => formatMonth(String(m))}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="headline" name={`ヘッドライン${indicatorLabel}`} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="core" name={`コア${indicatorLabel}`} stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Component Detail */}
      {tab === "detail" && (
        <div className="space-y-4">
          {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
            <div key={key} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COMPONENT_COLORS[key] }} />
                <span className="text-[13px] font-medium">{label}</span>
                <span className="text-[12px] text-muted ml-auto tabular-nums">
                  最新: {(latest[key as keyof MonthlyData] as number) >= 0 ? "+" : ""}{(latest[key as keyof MonthlyData] as number).toFixed(3)}pt
                </span>
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={currentData}>
                    <Line type="monotone" dataKey={key} stroke={COMPONENT_COLORS[key]} strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted">
        ※ データは手動更新。FRED APIキーを設定すれば自動取得に切替可能。
      </p>
    </div>
  );
}
