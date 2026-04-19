"use client";
import { Trade, EMOTION_LABELS, RATING_LABELS, Rating, Horizon, HORIZON_LABELS } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { openTicker } from "@/lib/useTickerDetail";
import { useState } from "react";

interface Props {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onReview: (id: string, rating: Rating, note: string) => void;
}

export default function TradeList({ trades, onEdit, onDelete, onReview }: Props) {
  const [filterTag, setFilterTag] = useState("");
  const [filterType, setFilterType] = useState<"" | "buy" | "sell">("");
  const [filterHorizon, setFilterHorizon] = useState<"" | Horizon>("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<Rating>("good");
  const [reviewNote, setReviewNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allTags = Array.from(new Set(trades.flatMap((t) => t.tags)));
  const filtered = trades
    .filter((t) => !filterTag || t.tags.includes(filterTag))
    .filter((t) => !filterType || t.type === filterType)
    .filter((t) => !filterHorizon || t.horizon === filterHorizon)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const submitReview = (id: string) => {
    onReview(id, reviewRating, reviewNote);
    setReviewingId(null);
    setReviewNote("");
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <p className="text-2xl mb-2" aria-hidden>📝</p>
        <p className="text-sm text-muted">取引記録がありません</p>
        <p className="text-[11px] text-muted/70 mt-1">上の「取引を記録」から追加してください</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1">
          {(["", "buy", "sell"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-[11px] rounded-lg transition ${
                filterType === type ? "bg-card-hover text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {type === "" ? "ALL" : type === "buy" ? "BUY" : "SELL"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["", "short", "long"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setFilterHorizon(h)}
              className={`px-2.5 py-1.5 text-[11px] rounded-lg transition ${
                filterHorizon === h ? "bg-card-hover text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {h === "" ? "期間" : HORIZON_LABELS[h]}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="text-[11px] py-1.5 px-2 bg-transparent border-0 text-muted"
          >
            <option value="">Tag</option>
            {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        )}
        <span className="text-[11px] text-muted ml-auto tabular-nums">{filtered.length}</span>
      </div>

      <div className="space-y-1">
        {filtered.map((trade) => (
          <div
            key={trade.id}
            className="border-b border-border/50 last:border-0"
          >
            <button
              onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
              className="w-full py-3.5 text-left hover:bg-card/50 transition-colors px-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-1 h-8 rounded-full ${trade.type === "buy" ? "bg-success" : "bg-danger"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); openTicker(trade.ticker); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openTicker(trade.ticker); } }}
                        className="text-[13px] font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm cursor-pointer"
                      >
                        {trade.name || trade.ticker}
                      </span>
                      <span className="text-[11px] text-muted font-mono">{trade.ticker}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted">{formatDate(trade.date)}</span>
                      {trade.horizon && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${trade.horizon === "short" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>{HORIZON_LABELS[trade.horizon]}</span>
                      )}
                      {trade.rating && (
                        <span className="text-[10px] text-muted">{RATING_LABELS[trade.rating]}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] tabular-nums">{formatCurrency(trade.price)}</p>
                  <p className="text-[11px] text-muted tabular-nums">{trade.quantity}株</p>
                </div>
              </div>
            </button>

            {expandedId === trade.id && (
              <div className="pl-5 pr-1 pb-4 space-y-3">
                {trade.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {trade.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-muted border border-border rounded-md px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
                {trade.type === "buy" && trade.stopLoss != null && (
                  <p className="text-[11px] text-danger">
                    損切りライン: {formatCurrency(trade.stopLoss)}（-{((1 - trade.stopLoss / trade.price) * 100).toFixed(1)}%）
                  </p>
                )}
                {trade.emotion && (
                  <p className="text-[11px] text-muted">
                    心理: {EMOTION_LABELS[trade.emotion]}
                  </p>
                )}
                {trade.reason && (
                  <div>
                    <p className="text-[11px] text-muted mb-1">理由</p>
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{trade.reason}</p>
                  </div>
                )}
                {trade.reviewNote && (
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-[11px] text-muted mb-1">振り返り</p>
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{trade.reviewNote}</p>
                  </div>
                )}

                {reviewingId === trade.id ? (
                  <div className="bg-surface rounded-lg p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      {(Object.entries(RATING_LABELS) as [Rating, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setReviewRating(key)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] transition ${
                            reviewRating === key ? "bg-primary text-white" : "bg-card text-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="学んだこと、反省点"
                      rows={2}
                      className="w-full resize-none text-[12px]"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => submitReview(trade.id)} className="px-3 py-1.5 bg-primary text-white text-[11px] rounded-lg">保存</button>
                      <button onClick={() => setReviewingId(null)} className="px-3 py-1.5 text-muted text-[11px]">取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setReviewRating(trade.rating || "good"); setReviewNote(trade.reviewNote || ""); setReviewingId(trade.id); }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      振り返る
                    </button>
                    <button onClick={() => onEdit(trade)} className="text-[11px] text-muted hover:text-foreground">編集</button>
                    <button
                      onClick={() => { if (confirm("削除しますか？")) onDelete(trade.id); }}
                      className="text-[11px] text-muted hover:text-danger"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
