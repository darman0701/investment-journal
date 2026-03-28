"use client";
import { useState, useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";
import type { IChartApi, Time } from "lightweight-charts";
import DcfCalculator from "./DcfCalculator";

interface ValuationData {
  sp500: {
    price: number;
    change: number;
    changePercent: number;
    trailingPE: number | null;
    forwardPE: number | null;
    priceToBook: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
  } | null;
  peHistory: { time: number; price: number }[];
  updatedAt: string;
}

interface MetricCardProps {
  label: string;
  description: string;
  current: number | null;
  average?: number | null;
  high?: number | null;
  low?: number | null;
}

function MetricCard({ label, description, current, average, high, low }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h4 className="text-sm font-semibold mb-1">{label}</h4>
      <p className="text-[11px] text-muted mb-3">{description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-[10px] text-muted">現在値</p>
          <p className="text-2xl font-semibold tabular-nums">{current?.toFixed(2) ?? "-"}</p>
        </div>
        {average !== undefined && (
          <div>
            <p className="text-[10px] text-muted">期間平均</p>
            <p className="text-2xl font-semibold tabular-nums text-muted">{average?.toFixed(2) ?? "-"}</p>
          </div>
        )}
        {high !== undefined && (
          <div>
            <p className="text-[10px] text-muted">期間最高</p>
            <p className="text-2xl font-semibold tabular-nums text-muted">{high?.toFixed(2) ?? "-"}</p>
          </div>
        )}
        {low !== undefined && (
          <div>
            <p className="text-[10px] text-muted">期間最低</p>
            <p className="text-2xl font-semibold tabular-nums text-muted">{low?.toFixed(2) ?? "-"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

type ValuationView = "sp500" | "dcf";

export default function Valuation() {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ValuationView>("sp500");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/valuation")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Render price history chart
  useEffect(() => {
    if (!data?.peHistory?.length || !chartContainerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 300,
      layout: { background: { color: "#f5f6fa" }, textColor: "#7c8091", fontSize: 11 },
      grid: { vertLines: { color: "#e0e3ea" }, horzLines: { color: "#e0e3ea" } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "#e0e3ea" },
      timeScale: { borderColor: "#e0e3ea" },
    });
    chartRef.current = chart;

    const series = chart.addSeries(LineSeries, { color: "#6366f1", lineWidth: 2, title: "S&P500" });
    series.setData(
      data.peHistory.map((d) => ({ time: d.time as Time, value: d.price }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (container) chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.sp500) {
    return <p className="text-center py-12 text-muted text-[13px]">バリュエーションデータを取得できませんでした</p>;
  }

  const sp = data.sp500;

  return (
    <div className="space-y-5">
      {/* View Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex border border-border rounded-lg overflow-hidden text-[12px]">
          <button
            onClick={() => setView("sp500")}
            className={`px-3 py-1.5 transition-colors ${view === "sp500" ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"}`}
          >
            S&P500 指標
          </button>
          <button
            onClick={() => setView("dcf")}
            className={`px-3 py-1.5 transition-colors ${view === "dcf" ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"}`}
          >
            DCF 計算
          </button>
        </div>
      </div>

      {view === "dcf" ? (
        <DcfCalculator />
      ) : (
      <>
      <p className="text-[11px] text-muted">データソース: Yahoo Finance</p>

      {/* Current Price */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-[11px] text-muted mb-1">S&P500 現在値</p>
        <p className="text-3xl font-semibold tabular-nums">{sp.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        <p className={`text-[13px] tabular-nums ${sp.change >= 0 ? "text-success" : "text-danger"}`}>
          {sp.change >= 0 ? "↑" : "↓"} {Math.abs(sp.change).toFixed(2)} ({sp.changePercent >= 0 ? "+" : ""}{sp.changePercent.toFixed(2)}%)
        </p>
        {sp.fiftyTwoWeekHigh && sp.fiftyTwoWeekLow && (
          <p className="text-[11px] text-muted mt-2">
            52週レンジ: {sp.fiftyTwoWeekLow.toLocaleString()} - {sp.fiftyTwoWeekHigh.toLocaleString()}
          </p>
        )}
      </div>

      {/* Valuation Metrics */}
      <MetricCard
        label="PER（trailing 12M）"
        description="過去12ヶ月の実績EPS基準のP/E ratio。一般に15〜20倍が歴史的平均。"
        current={sp.trailingPE}
      />

      {sp.forwardPE && (
        <MetricCard
          label="PER（forward）"
          description="今後12ヶ月の予想EPS基準のP/E ratio。"
          current={sp.forwardPE}
        />
      )}

      <MetricCard
        label="PBR（Price to Book）"
        description="純資産倍率。1倍割れは理論上の割安水準。S&P500の歴史的平均は約4倍。"
        current={sp.priceToBook}
      />

      {/* Price History Chart */}
      {data.peHistory.length > 0 && (
        <section>
          <h4 className="text-sm font-medium mb-3">S&P500 長期推移</h4>
          <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden border border-border" />
        </section>
      )}

      {data.updatedAt && (
        <p className="text-[10px] text-muted text-right">最終更新: {new Date(data.updatedAt).toLocaleString("ja-JP")}</p>
      )}
      </>
      )}
    </div>
  );
}
