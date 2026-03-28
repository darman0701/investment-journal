"use client";
import { useState, useEffect } from "react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from "recharts";

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

interface ApiData {
  cpiYoY: MonthlyData[];
  cpiMoM: MonthlyData[];
  pceYoY: MonthlyData[];
  pceMoM: MonthlyData[];
}

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
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [cpiRes, pceRes] = await Promise.all([
          fetch("/api/cpi"),
          fetch("/api/pce"),
        ]);

        const cpiJson = cpiRes.ok ? await cpiRes.json() : null;
        const pceJson = pceRes.ok ? await pceRes.json() : null;

        if (cancelled) return;

        if (!cpiJson && !pceJson) {
          setError("データの取得に失敗しました");
          return;
        }

        setData({
          cpiYoY: cpiJson?.cpiYoY ?? [],
          cpiMoM: cpiJson?.cpiMoM ?? [],
          pceYoY: pceJson?.pceYoY ?? [],
          pceMoM: pceJson?.pceMoM ?? [],
        });
      } catch {
        if (!cancelled) setError("データの取得に失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const dataMap: Record<string, MonthlyData[]> = data
    ? { "cpi-yoy": data.cpiYoY, "cpi-mom": data.cpiMoM, "pce-yoy": data.pceYoY, "pce-mom": data.pceMoM }
    : {};

  const dataKey = `${indicator}-${changeType}`;
  const currentData = dataMap[dataKey] ?? [];
  const latest = currentData[currentData.length - 1];
  const prev = currentData.length >= 2 ? currentData[currentData.length - 2] : null;

  const headlineChange = prev && latest ? latest.headline - prev.headline : 0;
  const coreChange = prev && latest ? latest.core - prev.core : 0;

  const indicatorLabel = indicator === "cpi" ? "CPI" : "PCE";
  const changeLabel = changeType === "yoy" ? "前年比" : "前月比";
  const unit = "%";

  const breakdownData = latest
    ? Object.entries(COMPONENT_LABELS)
        .map(([key, label]) => ({
          name: label,
          key,
          value: latest[key as keyof MonthlyData] as number,
          fill: COMPONENT_COLORS[key],
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return `${y}/${mo}`;
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold">CPI / PCE 内訳分析</h3>
          <p className="text-[11px] text-muted">インフレ分解ダッシュボード — どの項目が物価を押し上げているか、コンポーネント別に可視化</p>
        </div>
        <div className="flex items-center justify-center h-40 text-muted text-sm">
          BLS / BEA からデータ取得中...
        </div>
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold">CPI / PCE 内訳分析</h3>
          <p className="text-[11px] text-muted">インフレ分解ダッシュボード — どの項目が物価を押し上げているか、コンポーネント別に可視化</p>
        </div>
        <div className="flex items-center justify-center h-40 text-danger text-sm">
          {error ?? "データがありません"}
        </div>
      </div>
    );
  }

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
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e3ea" />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: "#7c8091" }} />
                <YAxis tick={{ fontSize: 10, fill: "#7c8091" }} unit="pt" />
                <Tooltip
                  contentStyle={{ background: "#ffffff", border: "1px solid #e0e3ea", borderRadius: 8, fontSize: 11 }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e3ea" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: "#7c8091" }} />
              <YAxis tick={{ fontSize: 10, fill: "#7c8091" }} unit="%" />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #e0e3ea", borderRadius: 8, fontSize: 11 }}
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
        CPI: BLS API から自動取得（24時間キャッシュ） / PCE: FRED API から自動取得（FRED_API_KEY 未設定時はフォールバックデータ）
      </p>
    </div>
  );
}
