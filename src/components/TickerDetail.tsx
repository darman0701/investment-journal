"use client";
import { useEffect, useState, lazy, Suspense } from "react";
import { Trade, WatchlistItem, Analysis, HORIZON_LABELS, RATING_LABELS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getExternalLinks } from "@/lib/edinetLinks";
import { useTickerDetail } from "@/lib/useTickerDetail";

const ChartViewer = lazy(() => import("./ChartViewer"));

interface Props {
  trades: Trade[];
  watchlist: WatchlistItem[];
  analyses: Analysis[];
}

interface PriceData { price: number; change: number; changePercent: number }

interface Position {
  ticker: string;
  name: string;
  avgPrice: number;
  totalQuantity: number;
  totalCost: number;
}

function computePosition(ticker: string, trades: Trade[]): Position | null {
  const sorted = [...trades]
    .filter((t) => t.ticker === ticker)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (!sorted.length) return null;

  let name = ticker;
  let avgPrice = 0;
  let totalQuantity = 0;
  let totalCost = 0;

  for (const t of sorted) {
    if (t.name) name = t.name;
    if (t.type === "buy") {
      totalCost += t.price * t.quantity;
      totalQuantity += t.quantity;
      avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    } else {
      totalQuantity -= t.quantity;
      if (totalQuantity <= 0) {
        totalQuantity = 0;
        totalCost = 0;
        avgPrice = 0;
      } else {
        totalCost = avgPrice * totalQuantity;
      }
    }
  }

  return { ticker, name, avgPrice, totalQuantity, totalCost };
}

function resolveName(ticker: string, trades: Trade[], watchlist: WatchlistItem[], analyses: Analysis[]): string {
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].ticker === ticker && trades[i].name) return trades[i].name;
  }
  for (const w of watchlist) if (w.ticker === ticker && w.name) return w.name;
  for (const a of analyses) if (a.ticker === ticker && a.name) return a.name;
  return ticker;
}

export default function TickerDetail(props: Props) {
  const { ticker } = useTickerDetail();
  if (!ticker) return null;
  // Remount on ticker change to reset local state cleanly.
  return <TickerDetailInner key={ticker} ticker={ticker} {...props} />;
}

interface InnerProps extends Props { ticker: string }

function TickerDetailInner({ ticker, trades, watchlist, analyses }: InnerProps) {
  const { close } = useTickerDetail();
  const [price, setPrice] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch current price
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/prices?tickers=${encodeURIComponent(ticker)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: Record<string, PriceData | null> | null) => {
        if (cancelled) return;
        setPrice(data?.[ticker] ?? null);
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (!cancelled) setPriceLoading(false); });
    return () => { cancelled = true; };
  }, [ticker]);

  // Esc to close + lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  const name = resolveName(ticker, trades, watchlist, analyses);
  const position = computePosition(ticker, trades);
  const held = position && position.totalQuantity > 0;
  const tickerTrades = [...trades]
    .filter((t) => t.ticker === ticker)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const tickerAnalyses = [...analyses]
    .filter((a) => a.ticker === ticker)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const watchEntry = watchlist.find((w) => w.ticker === ticker);
  const links = getExternalLinks(ticker);

  const currentValue = held && price ? price.price * position!.totalQuantity : null;
  const pl = held && price ? (price.price - position!.avgPrice) * position!.totalQuantity : null;
  const plPct = held && price && position!.avgPrice > 0
    ? ((price.price - position!.avgPrice) / position!.avgPrice) * 100
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} 詳細`}
    >
      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur-sm py-2 -mx-5 px-5 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-mono text-muted">{ticker}</span>
              {watchEntry && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">監視</span>
              )}
              {held && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">保有</span>
              )}
            </div>
            <h2 className="text-lg font-semibold tracking-tight truncate">{name}</h2>
            <div className="mt-1.5 flex items-baseline gap-2">
              {priceLoading ? (
                <span className="text-[12px] text-muted">価格取得中...</span>
              ) : price ? (
                <>
                  <span className="text-xl font-bold tabular-nums tracking-tight">{formatCurrency(price.price)}</span>
                  <span className={`text-[12px] tabular-nums ${price.change >= 0 ? "text-success" : "text-danger"}`}>
                    {price.change >= 0 ? "+" : ""}{price.change.toFixed(1)} ({price.changePercent >= 0 ? "+" : ""}{price.changePercent.toFixed(2)}%)
                  </span>
                </>
              ) : (
                <span className="text-[12px] text-muted">価格データなし</span>
              )}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="閉じる"
            className="shrink-0 w-9 h-9 rounded-full bg-card hover:bg-card-hover border border-border text-muted hover:text-foreground transition-all duration-200 active:scale-[0.98] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            ✕
          </button>
        </div>

        {/* Position summary */}
        {held && position && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] text-muted mb-3">ポジション</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted">保有株数</p>
                <p className="text-[15px] font-medium tabular-nums tracking-tight">{position.totalQuantity.toLocaleString()}株</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">平均取得単価</p>
                <p className="text-[15px] font-medium tabular-nums tracking-tight">{formatCurrency(Math.round(position.avgPrice))}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">評価額</p>
                <p className="text-[15px] font-medium tabular-nums tracking-tight">
                  {currentValue != null ? formatCurrency(Math.round(currentValue)) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted">損益</p>
                <p className={`text-[15px] font-medium tabular-nums tracking-tight ${pl != null ? (pl >= 0 ? "text-success" : "text-danger") : ""}`}>
                  {pl != null
                    ? `${pl >= 0 ? "+" : ""}${formatCurrency(Math.round(pl))}${plPct != null ? ` (${plPct >= 0 ? "+" : ""}${plPct.toFixed(2)}%)` : ""}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist note */}
        {watchEntry && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted">監視ノート</p>
              {watchEntry.targetPrice != null && (
                <span className="text-[11px] text-warning tabular-nums">目標 {formatCurrency(watchEntry.targetPrice)}</span>
              )}
            </div>
            {watchEntry.note ? (
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{watchEntry.note}</p>
            ) : (
              <p className="text-[11px] text-muted">メモなし</p>
            )}
            {watchEntry.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {watchEntry.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-muted border border-border rounded-md px-2 py-0.5">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        <section className="mb-6">
          <h3 className="text-[13px] font-medium mb-3">チャート</h3>
          <div className="rounded-2xl border border-border bg-card p-3">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <ChartViewer initialTicker={{ ticker, name }} />
            </Suspense>
          </div>
        </section>

        {/* Trade history */}
        <section className="mb-6">
          <h3 className="text-[13px] font-medium mb-3">取引履歴 <span className="text-[11px] text-muted ml-1">({tickerTrades.length})</span></h3>
          {tickerTrades.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-[12px] text-muted">取引記録なし</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {tickerTrades.map((t) => (
                <div key={t.id} className="px-4 py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-1 h-8 rounded-full ${t.type === "buy" ? "bg-success" : "bg-danger"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium">{t.type === "buy" ? "買い" : "売り"}</span>
                          {t.horizon && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.horizon === "short" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                              {HORIZON_LABELS[t.horizon]}
                            </span>
                          )}
                          {t.rating && <span className="text-[10px] text-muted">{RATING_LABELS[t.rating]}</span>}
                        </div>
                        <p className="text-[11px] text-muted tabular-nums">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] tabular-nums">{formatCurrency(t.price)}</p>
                      <p className="text-[11px] text-muted tabular-nums">{t.quantity}株</p>
                    </div>
                  </div>
                  {t.reason && (
                    <p className="text-[11px] text-muted leading-relaxed mt-2 pl-4 whitespace-pre-wrap">{t.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Analyses */}
        <section className="mb-6">
          <h3 className="text-[13px] font-medium mb-3">分析 <span className="text-[11px] text-muted ml-1">({tickerAnalyses.length})</span></h3>
          {tickerAnalyses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-[12px] text-muted">分析データなし</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickerAnalyses.map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium">{a.source || "分析"}</span>
                    <span className="text-[11px] text-muted tabular-nums">{formatDate(a.date)}</span>
                  </div>
                  {a.summary && <p className="text-[11px] text-muted leading-5 whitespace-pre-wrap">{a.summary}</p>}
                  {a.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {a.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-muted/70 border border-border/60 rounded px-1.5 py-px">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* External links */}
        {links.length > 0 && (
          <section className="mb-8">
            <h3 className="text-[13px] font-medium mb-3">外部リンク</h3>
            <div className="flex gap-1.5 flex-wrap">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-2.5 py-1 border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-all duration-200"
                  title={link.description}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
