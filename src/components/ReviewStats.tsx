"use client";
import { Trade, Rating, RATING_LABELS, EMOTION_LABELS, Emotion } from "@/lib/types";

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

      {lessons.length > 0 && (
        <div>
          <p className="text-[11px] text-muted mb-3">振り返りメモ</p>
          <div className="space-y-2">
            {lessons.map((t) => (
              <div key={t.id} className="border-l-2 border-border pl-3 py-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium">{t.name || t.ticker}</span>
                  {t.rating && <span className="text-[10px] text-muted">{RATING_LABELS[t.rating]}</span>}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{t.reviewNote}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
