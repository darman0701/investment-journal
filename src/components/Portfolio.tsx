"use client";
import { useState, useEffect, useCallback } from "react";
import { Trade, WatchlistItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { getExternalLinks } from "@/lib/edinetLinks";
import { openTicker } from "@/lib/useTickerDetail";
import PortfolioAnalytics from "./PortfolioAnalytics";
import Dashboard from "./Dashboard";

interface Props {
  trades: Trade[];
  watchlist?: WatchlistItem[];
  onNavigate?: (tab: string) => void;
}

interface Position {
  ticker: string; name: string; avgPrice: number;
  totalQuantity: number; totalCost: number; tags: string[];
}

interface PriceData { price: number; change: number; changePercent: number; }

type View = "list" | "analytics";

export default function Portfolio({ trades, watchlist = [], onNavigate }: Props) {
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [view, setView] = useState<View>("list");
  const [linksOpen, setLinksOpen] = useState<string | null>(null);

  const positions = new Map<string, Position>();
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const trade of sorted) {
    const pos = positions.get(trade.ticker) || { ticker: trade.ticker, name: trade.name || trade.ticker, avgPrice: 0, totalQuantity: 0, totalCost: 0, tags: [] };
    if (trade.type === "buy") {
      pos.totalCost += trade.price * trade.quantity;
      pos.totalQuantity += trade.quantity;
      pos.avgPrice = pos.totalQuantity > 0 ? pos.totalCost / pos.totalQuantity : 0;
    } else {
      pos.totalQuantity -= trade.quantity;
      if (pos.totalQuantity <= 0) { pos.totalQuantity = 0; pos.totalCost = 0; pos.avgPrice = 0; }
      else { pos.totalCost = pos.avgPrice * pos.totalQuantity; }
    }
    pos.tags = [...new Set([...pos.tags, ...trade.tags])];
    if (trade.name) pos.name = trade.name;
    positions.set(trade.ticker, pos);
  }

  const active = Array.from(positions.values()).filter((p) => p.totalQuantity > 0);
  const totalInvested = active.reduce((s, p) => s + p.totalCost, 0);

  const fetchPrices = useCallback(async () => {
    if (active.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prices?tickers=${active.map((p) => p.ticker).join(",")}`);
      if (res.ok) { setPrices(await res.json()); setLastUpdated(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })); }
    } catch {}
    setLoading(false);
  }, [active.length]);

  useEffect(() => { fetchPrices(); }, []);

  if (active.length === 0) {
    return (
      <div>
        {onNavigate && <Dashboard trades={trades} watchlist={watchlist} onNavigate={onNavigate} />}
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <p className="text-2xl mb-2" aria-hidden>📊</p>
          <p className="text-sm text-muted">保有銘柄なし</p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("trades")}
              className="mt-3 text-[12px] text-primary hover:underline"
            >
              取引を記録する
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasPrices = Object.keys(prices).length > 0;
  const totalCurrent = active.reduce((s, p) => { const d = prices[p.ticker]; return s + (d ? d.price * p.totalQuantity : p.totalCost); }, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div>
      {onNavigate && <Dashboard trades={trades} watchlist={watchlist} onNavigate={onNavigate} />}

      {/* Header numbers */}
      <div className="mb-6">
        {hasPrices ? (
          <>
            <p className="text-[11px] text-muted mb-1">評価額</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight">{formatCurrency(Math.round(totalCurrent))}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[13px] font-medium tabular-nums ${totalPL >= 0 ? "text-success" : "text-danger"}`}>
                {totalPL >= 0 ? "+" : ""}{formatCurrency(Math.round(totalPL))}
              </span>
              <span className={`text-[11px] tabular-nums ${totalPL >= 0 ? "text-success" : "text-danger"}`}>
                {totalPLPct >= 0 ? "+" : ""}{totalPLPct.toFixed(2)}%
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] text-muted mb-1">投資総額</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight">{formatCurrency(totalInvested)}</p>
          </>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">{active.length}銘柄</span>
            <div className="flex border border-border rounded-md overflow-hidden text-[10px]">
              <button
                onClick={() => setView("list")}
                className={`px-2 py-0.5 transition ${view === "list" ? "bg-card-hover text-foreground" : "text-muted"}`}
              >一覧</button>
              <button
                onClick={() => setView("analytics")}
                className={`px-2 py-0.5 transition ${view === "analytics" ? "bg-card-hover text-foreground" : "text-muted"}`}
              >分析</button>
            </div>
          </div>
          <button onClick={fetchPrices} disabled={loading} className="text-[11px] text-muted hover:text-foreground transition">
            {loading ? "..." : lastUpdated ? `${lastUpdated} 更新` : "価格取得"}
          </button>
        </div>
      </div>

      {view === "analytics" ? (
        <PortfolioAnalytics positions={active} prices={prices} />
      ) : (
        <>
          {/* Holdings */}
          <div className="space-y-px">
            {active.map((pos) => {
              const pd = prices[pos.ticker];
              const pl = pd ? (pd.price - pos.avgPrice) * pos.totalQuantity : null;
              const plPct = pd && pos.avgPrice > 0 ? ((pd.price - pos.avgPrice) / pos.avgPrice) * 100 : null;
              const links = getExternalLinks(pos.ticker);
              const showLinks = linksOpen === pos.ticker;

              return (
                <div key={pos.ticker} className="py-3.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setLinksOpen(showLinks ? null : pos.ticker)}
                        className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:bg-card-hover transition"
                      >
                        <span className="text-[10px] font-mono font-bold text-muted">{pos.ticker.slice(0, 3)}</span>
                      </button>
                      <button
                        onClick={() => openTicker(pos.ticker)}
                        className="text-left transition-all duration-200 active:scale-[0.98] hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-md -mx-1 px-1"
                      >
                        <p className="text-[13px] font-medium">{pos.name}</p>
                        <p className="text-[11px] text-muted font-mono">{pos.ticker} · {pos.totalQuantity}株</p>
                      </button>
                    </div>
                    <div className="text-right">
                      {pd ? (
                        <>
                          <p className="text-[13px] font-medium tabular-nums">{formatCurrency(pd.price)}</p>
                          <p className={`text-[11px] tabular-nums ${pl !== null && pl >= 0 ? "text-success" : "text-danger"}`}>
                            {pl !== null && pl >= 0 ? "+" : ""}{pl !== null ? formatCurrency(Math.round(pl)) : ""}
                            {plPct !== null && ` (${plPct >= 0 ? "+" : ""}${plPct.toFixed(1)}%)`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] tabular-nums">{formatCurrency(Math.round(pos.avgPrice))}</p>
                          <p className="text-[11px] text-muted">取得単価</p>
                        </>
                      )}
                    </div>
                  </div>
                  {showLinks && links.length > 0 && (
                    <div className="flex gap-1.5 mt-2 ml-11 flex-wrap">
                      {links.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] px-2 py-0.5 border border-border rounded-md text-muted hover:text-primary hover:border-primary transition"
                          title={link.description}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cost basis */}
          {hasPrices && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex justify-between text-[11px] text-muted">
                <span>投資総額</span>
                <span className="tabular-nums">{formatCurrency(totalInvested)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
