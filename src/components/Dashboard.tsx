"use client";
import { useEffect, useMemo, useState } from "react";
import { Trade, WatchlistItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openTicker } from "@/lib/useTickerDetail";

interface PriceData { price: number; change: number; changePercent: number }

interface EventData {
  name: string;
  earningsDate: string | null;
  earningsTimestampStart: number | null;
  earningsTimestampEnd: number | null;
  earningsMonths?: number[];
}

interface Position {
  ticker: string;
  name: string;
  totalQuantity: number;
  avgPrice: number;
  totalCost: number;
}

interface Props {
  trades: Trade[];
  watchlist: WatchlistItem[];
  onNavigate: (tab: string) => void;
}

function computePositions(trades: Trade[]): Position[] {
  const positions = new Map<string, Position>();
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const t of sorted) {
    const pos = positions.get(t.ticker) || { ticker: t.ticker, name: t.name || t.ticker, avgPrice: 0, totalQuantity: 0, totalCost: 0 };
    if (t.type === "buy") {
      pos.totalCost += t.price * t.quantity;
      pos.totalQuantity += t.quantity;
      pos.avgPrice = pos.totalQuantity > 0 ? pos.totalCost / pos.totalQuantity : 0;
    } else {
      pos.totalQuantity -= t.quantity;
      if (pos.totalQuantity <= 0) { pos.totalQuantity = 0; pos.totalCost = 0; pos.avgPrice = 0; }
      else { pos.totalCost = pos.avgPrice * pos.totalQuantity; }
    }
    if (t.name) pos.name = t.name;
    positions.set(t.ticker, pos);
  }
  return Array.from(positions.values()).filter((p) => p.totalQuantity > 0);
}

export default function Dashboard({ trades, watchlist, onNavigate }: Props) {
  const positions = useMemo(() => computePositions(trades), [trades]);

  // All tickers we want prices for: holdings + watchlist (for alerts)
  const priceTickers = useMemo(() => {
    const set = new Set<string>();
    for (const p of positions) set.add(p.ticker);
    for (const w of watchlist) if (w.targetPrice != null) set.add(w.ticker);
    return Array.from(set);
  }, [positions, watchlist]);

  const priceTickersKey = priceTickers.join(",");
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [pricesLoaded, setPricesLoaded] = useState(() => priceTickers.length === 0);

  useEffect(() => {
    if (!priceTickersKey) return;
    let cancelled = false;
    fetch(`/api/prices?tickers=${priceTickersKey}`)
      .then((r) => r.ok ? r.json() : {})
      .then((d) => { if (!cancelled) { setPrices(d as Record<string, PriceData | null>); setPricesLoaded(true); } })
      .catch(() => { if (!cancelled) setPricesLoaded(true); });
    return () => { cancelled = true; };
  }, [priceTickersKey]);

  // Events for upcoming earnings
  const eventTickers = useMemo(() => {
    const set = new Set<string>();
    for (const p of positions) set.add(p.ticker);
    for (const w of watchlist) set.add(w.ticker);
    return Array.from(set);
  }, [positions, watchlist]);

  const eventTickersKey = eventTickers.join(",");
  const [events, setEvents] = useState<Record<string, EventData | null>>({});
  useEffect(() => {
    if (!eventTickersKey) return;
    let cancelled = false;
    fetch(`/api/events?tickers=${eventTickersKey}`)
      .then((r) => r.ok ? r.json() : {})
      .then((d) => { if (!cancelled) setEvents(d as Record<string, EventData | null>); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [eventTickersKey]);

  // 1. Today's P/L
  const todayPL = positions.reduce((sum, p) => {
    const pd = prices[p.ticker];
    if (!pd) return sum;
    return sum + pd.change * p.totalQuantity;
  }, 0);
  const hasAnyPrice = Object.values(prices).some((v) => v != null);

  // 2. Weekly P/L — TODO: no price history API available
  const weeklyPL: number | null = null;

  // 3. Recent 3 trades
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // 4. Unreviewed trades
  const unreviewedCount = trades.filter((t) => !t.rating).length;

  // 5. Watchlist alerts — within ±3% of current price
  const alerts = watchlist
    .map((w) => {
      if (w.targetPrice == null) return null;
      const pd = prices[w.ticker];
      if (!pd) return null;
      const diffPct = ((pd.price - w.targetPrice) / w.targetPrice) * 100;
      if (Math.abs(diffPct) > 3) return null;
      return { ...w, currentPrice: pd.price, diffPct };
    })
    .filter((x): x is WatchlistItem & { currentPrice: number; diffPct: number } => x !== null);

  // 6. Upcoming earnings within 14 days
  // `now` is captured once per events change; acceptable since the dashboard
  // is remounted per navigation and data changes frequently enough.
  const upcomingEarnings = useMemo(() => {
    const now = new Date().getTime();
    const within14 = 14 * 24 * 60 * 60 * 1000;
    return Object.entries(events)
      .map(([ticker, ev]) => {
        if (!ev || !ev.earningsDate) return null;
        const dt = new Date(ev.earningsDate).getTime();
        const diff = dt - now;
        if (diff < 0 || diff > within14) return null;
        return { ticker, name: ev.name, earningsDate: ev.earningsDate, daysUntil: Math.ceil(diff / (24 * 60 * 60 * 1000)) };
      })
      .filter((x): x is { ticker: string; name: string; earningsDate: string; daysUntil: number } => x !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events]);

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Today's P/L */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] text-muted mb-2">今日の損益</p>
        {!pricesLoaded && positions.length > 0 ? (
          <div className="h-7 bg-surface rounded animate-pulse" />
        ) : !hasAnyPrice ? (
          <p className="text-[13px] text-muted">データなし</p>
        ) : (
          <p className={`text-xl font-bold tabular-nums tracking-tight ${todayPL >= 0 ? "text-success" : "text-danger"}`}>
            {todayPL >= 0 ? "+" : ""}{formatCurrency(Math.round(todayPL))}
          </p>
        )}
      </div>

      {/* Weekly P/L */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] text-muted mb-2">週次損益</p>
        {/* TODO: requires price history API; currently not implemented */}
        <p className="text-[13px] text-muted">{weeklyPL == null ? "データなし" : formatCurrency(weeklyPL)}</p>
      </div>

      {/* Recent trades */}
      <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-muted">直近の取引</p>
          <button
            onClick={() => onNavigate("trades")}
            className="text-[11px] text-primary hover:underline transition-colors"
          >
            すべて →
          </button>
        </div>
        {recentTrades.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-[11px] text-muted">取引記録なし</p>
            <button
              onClick={() => onNavigate("trades")}
              className="mt-2 text-[11px] text-primary hover:underline"
            >
              取引を記録
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {recentTrades.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => openTicker(t.ticker)}
                  className="w-full flex items-center justify-between py-1.5 hover:bg-card-hover rounded-lg px-2 -mx-2 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1 h-6 rounded-full shrink-0 ${t.type === "buy" ? "bg-success" : "bg-danger"}`} />
                    <div className="text-left min-w-0">
                      <p className="text-[12px] font-medium truncate">{t.name || t.ticker}</p>
                      <p className="text-[10px] text-muted tabular-nums">{formatDate(t.date)} · {t.ticker}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-[12px] tabular-nums">{formatCurrency(t.price)}</p>
                    <p className="text-[10px] text-muted tabular-nums">{t.quantity}株</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unreviewed */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] text-muted mb-2">未レビュー取引</p>
        <div className="flex items-end justify-between">
          <p className={`text-xl font-bold tabular-nums tracking-tight ${unreviewedCount > 0 ? "text-warning" : "text-muted"}`}>
            {unreviewedCount}<span className="text-[11px] text-muted ml-1">件</span>
          </p>
          {unreviewedCount > 0 && (
            <button
              onClick={() => onNavigate("review")}
              className="text-[11px] text-primary hover:underline transition-colors"
            >
              振り返る →
            </button>
          )}
        </div>
      </div>

      {/* Watchlist alerts */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] text-muted mb-2">監視アラート <span className="text-[10px]">(目標±3%)</span></p>
        {alerts.length === 0 ? (
          <p className="text-[11px] text-muted">アラートなし</p>
        ) : (
          <ul className="space-y-1">
            {alerts.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => openTicker(a.ticker)}
                  className="w-full flex items-center justify-between text-left hover:bg-card-hover rounded-md px-2 -mx-2 py-1 transition-colors"
                >
                  <span className="text-[12px] font-medium truncate">{a.name || a.ticker}</span>
                  <span className="text-[10px] text-warning tabular-nums shrink-0 ml-2">
                    {formatCurrency(a.currentPrice)} / 目標 {formatCurrency(a.targetPrice!)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming earnings */}
      <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-muted">直近の決算イベント <span className="text-[10px]">(14日以内)</span></p>
          <button
            onClick={() => onNavigate("calendar")}
            className="text-[11px] text-primary hover:underline transition-colors"
          >
            予定 →
          </button>
        </div>
        {upcomingEarnings.length === 0 ? (
          <p className="text-[11px] text-muted">該当なし</p>
        ) : (
          <ul className="space-y-1">
            {upcomingEarnings.map((e) => (
              <li key={e.ticker}>
                <button
                  onClick={() => openTicker(e.ticker)}
                  className="w-full flex items-center justify-between text-left hover:bg-card-hover rounded-md px-2 -mx-2 py-1 transition-colors"
                >
                  <span className="text-[12px] font-medium truncate">{e.name || e.ticker}</span>
                  <span className={`text-[10px] tabular-nums shrink-0 ml-2 ${e.daysUntil <= 3 ? "text-warning font-medium" : "text-muted"}`}>
                    あと{e.daysUntil}日
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
