"use client";
import { useMemo } from "react";
import { Trade } from "@/lib/types";

interface Props {
  trades: Trade[];
}

function weekBounds(d: Date): [Date, Date] {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const dow = start.getDay();
  start.setDate(start.getDate() - dow);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return [start, end];
}

export default function ReviewScreen({ trades }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const [wStart, wEnd] = weekBounds(now);
    const week = trades.filter((t) => {
      const d = new Date(t.date);
      return d >= wStart && d <= wEnd;
    });

    const reviewed = trades.filter((t) => t.rating);
    const wins = reviewed.filter(
      (t) => t.rating === "excellent" || t.rating === "good"
    );
    const winRate =
      reviewed.length > 0
        ? Math.round((wins.length / reviewed.length) * 100)
        : 0;

    // Realized P/L (sum of sell - matched buy avg) — approximate using trade list directly
    let realized = 0;
    const buyMap = new Map<string, { qty: number; cost: number }>();
    const sorted = [...trades].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const t of sorted) {
      const e = buyMap.get(t.ticker) || { qty: 0, cost: 0 };
      if (t.type === "buy") {
        e.qty += t.quantity;
        e.cost += t.price * t.quantity;
      } else {
        const avg = e.qty > 0 ? e.cost / e.qty : 0;
        const pl = (t.price - avg) * t.quantity;
        const weekHit =
          new Date(t.date) >= wStart && new Date(t.date) <= wEnd;
        if (weekHit) realized += pl;
        e.qty -= t.quantity;
        e.cost = avg * e.qty;
        if (e.qty < 0) {
          e.qty = 0;
          e.cost = 0;
        }
      }
      buyMap.set(t.ticker, e);
    }

    // Avg holding days (for sold positions)
    const sellTrades = sorted.filter((t) => t.type === "sell");
    const days = sellTrades
      .map((s) => {
        const buy = sorted.find(
          (b) => b.type === "buy" && b.ticker === s.ticker
        );
        if (!buy) return null;
        return (
          (new Date(s.date).getTime() - new Date(buy.date).getTime()) /
          86400000
        );
      })
      .filter((x): x is number => x != null);
    const avgDays =
      days.length > 0
        ? Math.round(days.reduce((s, d) => s + d, 0) / days.length)
        : 0;

    return {
      wStart,
      wEnd,
      weekCount: week.length,
      winRate,
      realized,
      avgDays,
      unreviewed: trades.filter((t) => !t.rating).length,
    };
  }, [trades]);

  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;

  return (
    <div
      className="scrollbar-none"
      style={{ flex: 1, overflowY: "auto", padding: "18px 16px 140px" }}
    >
      <div className="md:grid md:grid-cols-2 md:gap-3"><div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div
          className="serif"
          style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}
        >
          週次レビュー
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          {fmt(stats.wStart)} - {fmt(stats.wEnd)}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <Metric label="勝率" value={`${stats.winRate}%`} tone="success" />
          <Metric
            label="今週の実現損益"
            value={`${stats.realized >= 0 ? "+" : "−"}¥${Math.abs(
              Math.round(stats.realized)
            ).toLocaleString("ja-JP")}`}
            tone={stats.realized >= 0 ? "success" : "danger"}
          />
          <Metric label="今週の取引数" value={`${stats.weekCount}`} />
          <Metric
            label="平均保有日数"
            value={`${stats.avgDays}`}
            suffix="日"
          />
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 600,
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          気づき
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          {stats.unreviewed > 0
            ? `未レビューの取引が${stats.unreviewed}件あります。記録の鮮度が高いうちに振り返りましょう。`
            : `素晴らしい — 全ての取引に評価が付いています。`}
        </div>
      </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "success" | "danger";
}) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{label}</div>
      <div
        className="tabular"
        style={{
          fontSize: 22,
          fontWeight: 600,
          color:
            tone === "success"
              ? "var(--success)"
              : tone === "danger"
              ? "var(--danger)"
              : "var(--text)",
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: 12, marginLeft: 2, fontWeight: 500 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
