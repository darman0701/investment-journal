"use client";
import { Trade, Rating, RATING_LABELS, EMOTION_LABELS, Emotion, HORIZON_LABELS, Horizon } from "@/lib/types";

interface Props { trades: Trade[]; }

export default function ReviewStats({ trades }: Props) {
  const reviewed = trades.filter((t) => t.rating);
  const rc: Record<Rating, number> = { excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const t of reviewed) { if (t.rating) rc[t.rating]++; }

  const ec: Record<string, { total: number; good: number }> = {};
  for (const t of trades) {
    if (!t.emotion) continue;
    if (!ec[t.emotion]) ec[t.emotion] = { total: 0, good: 0 };
    ec[t.emotion].total++;
    if (t.rating === "excellent" || t.rating === "good") ec[t.emotion].good++;
  }

  const lessons = trades.filter((t) => t.reviewNote).sort((a, b) => new Date(b.reviewDate || b.createdAt).getTime() - new Date(a.reviewDate || a.createdAt).getTime()).slice(0, 10);
  const total = reviewed.length;
  const goodRate = total > 0 ? ((rc.excellent + rc.good) / total * 100).toFixed(0) : null;

  if (trades.length === 0) {
    return <div className="text-center py-20"><p className="text-sm text-muted">データなし</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        <div className="bg-card p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{trades.length}</p>
          <p className="text-[10px] text-muted mt-1">取引</p>
        </div>
        <div className="bg-card p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{total}</p>
          <p className="text-[10px] text-muted mt-1">評価済</p>
        </div>
        <div className="bg-card p-4 text-center">
          <p className={`text-2xl font-bold tabular-nums ${goodRate && Number(goodRate) >= 50 ? "text-success" : ""}`}>
            {goodRate ?? "—"}<span className="text-sm">%</span>
          </p>
          <p className="text-[10px] text-muted mt-1">良判断率</p>
        </div>
      </div>

      {total > 0 && (
        <div>
          <p className="text-[11px] text-muted mb-3">判断の内訳</p>
          <div className="space-y-2">
            {(Object.entries(RATING_LABELS) as [Rating, string][]).map(([key, label]) => {
              const c = rc[key];
              const pct = total > 0 ? (c / total) * 100 : 0;
              const color = key === "excellent" ? "bg-success" : key === "good" ? "bg-primary" : key === "fair" ? "bg-warning" : "bg-danger";
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-4 text-[12px] text-center font-medium">{label}</span>
                  <div className="flex-1 bg-card rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-muted w-8 text-right tabular-nums">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(ec).length > 0 && (
        <div>
          <p className="text-[11px] text-muted mb-3">心理と結果</p>
          <div className="space-y-2">
            {Object.entries(ec).map(([emotion, d]) => {
              const rate = d.total > 0 ? Math.round((d.good / d.total) * 100) : 0;
              return (
                <div key={emotion} className="flex items-center justify-between py-1">
                  <span className="text-[12px]">{EMOTION_LABELS[emotion as Emotion]}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted tabular-nums">{d.total}回</span>
                    <span className={`text-[11px] font-medium tabular-nums ${rate >= 50 ? "text-success" : "text-danger"}`}>{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 短期/長期別成績 */}
      {(() => {
        const horizonStats: Record<string, { total: number; reviewed: number; good: number }> = {};
        for (const t of trades) {
          const h = t.horizon || "未設定";
          if (!horizonStats[h]) horizonStats[h] = { total: 0, reviewed: 0, good: 0 };
          horizonStats[h].total++;
          if (t.rating) {
            horizonStats[h].reviewed++;
            if (t.rating === "excellent" || t.rating === "good") horizonStats[h].good++;
          }
        }
        const entries = Object.entries(horizonStats);
        if (entries.length <= 1 && entries[0]?.[0] === "未設定") return null;
        return (
          <div>
            <p className="text-[11px] text-muted mb-3">投資期間別</p>
            <div className="grid grid-cols-2 gap-2">
              {entries.filter(([k]) => k !== "未設定").map(([horizon, s]) => {
                const rate = s.reviewed > 0 ? Math.round((s.good / s.reviewed) * 100) : null;
                return (
                  <div key={horizon} className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-[12px] font-medium mb-1">
                      {horizon === "short" ? HORIZON_LABELS.short : horizon === "long" ? HORIZON_LABELS.long : horizon}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold tabular-nums">{s.total}</span>
                      <span className="text-[10px] text-muted">取引</span>
                      {rate !== null && (
                        <span className={`text-[11px] font-medium ml-auto ${rate >= 50 ? "text-success" : "text-danger"}`}>
                          {rate}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {lessons.length > 0 && (
        <div>
          <p className="text-[11px] text-muted mb-3">振り返りメモ</p>
          <div className="space-y-2">
            {lessons.map((t) => (
              <div key={t.id} className={`border-l-2 pl-3 py-2 ${
                t.rating === "excellent" ? "border-success" : t.rating === "good" ? "border-primary" : t.rating === "poor" ? "border-danger" : "border-border"
              }`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium">{t.name || t.ticker}</span>
                  {t.rating && <span className="text-[10px] text-muted">{RATING_LABELS[t.rating]}</span>}
                  {t.horizon && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.horizon === "short" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                      {HORIZON_LABELS[t.horizon]}
                    </span>
                  )}
                  <span className="text-[10px] text-muted ml-auto">{t.reviewDate ? new Date(t.reviewDate).toLocaleDateString("ja-JP") : ""}</span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed whitespace-pre-wrap">{t.reviewNote}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未振り返りの取引 */}
      {trades.filter((t) => !t.rating).length > 0 && (
        <div>
          <p className="text-[11px] text-muted mb-2">未振り返り</p>
          <div className="flex flex-wrap gap-1.5">
            {trades.filter((t) => !t.rating).slice(0, 10).map((t) => (
              <span key={t.id} className="text-[10px] px-2 py-1 bg-card border border-border rounded-md text-muted">
                {t.name || t.ticker}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
