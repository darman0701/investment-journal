"use client";
import { useState, lazy, Suspense } from "react";
import { useCloudStorage } from "@/lib/useCloudStorage";
import { Trade, WatchlistItem, InvestmentRule, Analysis, Rating } from "@/lib/types";
import TradeForm from "@/components/TradeForm";
import TradeList from "@/components/TradeList";
import Portfolio from "@/components/Portfolio";
import ReviewStats from "@/components/ReviewStats";
import Watchlist from "@/components/Watchlist";
import RuleManager from "@/components/RuleManager";
import AnalysisList from "@/components/AnalysisList";
import EventCalendar from "@/components/EventCalendar";

// Lazy load heavy market components
const ChartViewer = lazy(() => import("@/components/ChartViewer"));
const StockRanking = lazy(() => import("@/components/StockRanking"));
const Valuation = lazy(() => import("@/components/Valuation"));
const CpiAnalysis = lazy(() => import("@/components/CpiAnalysis"));
const MacroMatrix = lazy(() => import("@/components/MacroMatrix"));

type Tab = "portfolio" | "trades" | "analysis" | "review" | "watchlist" | "rules" | "calendar" | "chart" | "ranking" | "valuation" | "cpi" | "macro";

const JOURNAL_TABS: { key: Tab; label: string }[] = [
  { key: "portfolio", label: "資産" },
  { key: "trades", label: "取引" },
  { key: "analysis", label: "分析" },
  { key: "review", label: "振返り" },
  { key: "watchlist", label: "監視" },
  { key: "rules", label: "規律" },
  { key: "calendar", label: "予定" },
];

const MARKET_TABS: { key: Tab; label: string }[] = [
  { key: "chart", label: "チャート" },
  { key: "ranking", label: "ランキング" },
  { key: "valuation", label: "指標" },
  { key: "cpi", label: "CPI" },
  { key: "macro", label: "マクロ" },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Home() {
  const { data: cloudData, update: updateCloud, isLoaded } = useCloudStorage();
  const trades = cloudData.trades as Trade[];
  const watchlist = cloudData.watchlist as WatchlistItem[];
  const rules = cloudData.rules as InvestmentRule[];
  const analyses = cloudData.analyses as Analysis[];
  const [tab, setTab] = useState<Tab>("portfolio");
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>();

  const isMarketTab = MARKET_TABS.some((t) => t.key === tab);

  const setTrades = (fn: (prev: Trade[]) => Trade[]) => updateCloud((d) => ({ ...d, trades: fn(d.trades as Trade[]) }));
  const setWatchlist = (fn: (prev: WatchlistItem[]) => WatchlistItem[]) => updateCloud((d) => ({ ...d, watchlist: fn(d.watchlist as WatchlistItem[]) }));
  const setRules = (fn: (prev: InvestmentRule[]) => InvestmentRule[]) => updateCloud((d) => ({ ...d, rules: fn(d.rules as InvestmentRule[]) }));

  const handleAddTrade = (trade: Trade) => {
    setTrades((prev) => {
      const idx = prev.findIndex((t) => t.id === trade.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = trade; return u; }
      return [...prev, trade];
    });
    setShowForm(false);
    setEditingTrade(undefined);
  };

  const handleDeleteTrade = (id: string) => setTrades((prev) => prev.filter((t) => t.id !== id));

  const handleReview = (id: string, rating: Rating, note: string) => {
    setTrades((prev) =>
      prev.map((t) => t.id === id ? { ...t, rating, reviewNote: note, reviewDate: new Date().toISOString() } : t)
    );
  };

  const handleEditTrade = (trade: Trade) => { setEditingTrade(trade); setShowForm(true); };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen mx-auto flex flex-col ${isMarketTab ? "max-w-4xl" : "max-w-2xl"}`}>
      <header className="px-5 pt-6 pb-2 flex items-baseline justify-between">
        <h1 className="text-base font-semibold tracking-tight">Journal</h1>
        <span className="text-[11px] text-muted tabular-nums">
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </header>

      <nav className="px-5 py-3 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        {/* Journal tabs */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-none">
          {JOURNAL_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); setEditingTrade(undefined); }}
              className={`pb-2.5 px-3 text-[13px] transition-colors relative whitespace-nowrap shrink-0 ${
                tab === t.key ? "text-foreground font-medium" : "text-muted hover:text-foreground/70"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
          <span className="mx-1 self-center text-border">|</span>
          {MARKET_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); setEditingTrade(undefined); }}
              className={`pb-2.5 px-3 text-[13px] transition-colors relative whitespace-nowrap shrink-0 ${
                tab === t.key ? "text-foreground font-medium" : "text-muted hover:text-foreground/70"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-5 pb-10 pt-1">
        {/* Journal Tabs */}
        {tab === "trades" && (
          <>
            {showForm ? (
              <div className="border border-border rounded-2xl p-5 mb-5">
                <p className="text-[13px] font-medium mb-4 text-muted">
                  {editingTrade ? "取引を編集" : "新しい取引を記録"}
                </p>
                <TradeForm
                  onSubmit={handleAddTrade}
                  onCancel={() => { setShowForm(false); setEditingTrade(undefined); }}
                  initial={editingTrade}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 mb-5 bg-primary hover:bg-primary-hover text-white text-[13px] font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                取引を記録
              </button>
            )}
            <TradeList trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onReview={handleReview} />
          </>
        )}
        {tab === "analysis" && <AnalysisList analyses={analyses} />}
        {tab === "portfolio" && <Portfolio trades={trades} />}
        {tab === "review" && <ReviewStats trades={trades} />}
        {tab === "watchlist" && (
          <Watchlist items={watchlist} onAdd={(item) => setWatchlist((prev) => [...prev, item])} onDelete={(id) => setWatchlist((prev) => prev.filter((i) => i.id !== id))} onUpdate={(item) => setWatchlist((prev) => prev.map((i) => i.id === item.id ? item : i))} />
        )}
        {tab === "rules" && (
          <RuleManager rules={rules} onAdd={(rule) => setRules((prev) => [...prev, rule])} onToggle={(id) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))} onDelete={(id) => setRules((prev) => prev.filter((r) => r.id !== id))} />
        )}
        {tab === "calendar" && (() => {
          const allTickers = [...new Set([...trades.map((t) => t.ticker), ...watchlist.map((w) => w.ticker)])];
          const nameMap: Record<string, string> = {};
          for (const t of trades) if (t.name) nameMap[t.ticker] = t.name;
          for (const w of watchlist) if (w.name) nameMap[w.ticker] = w.name;
          return <EventCalendar tickers={allTickers} tickerNames={nameMap} />;
        })()}

        {/* Market Tabs */}
        {tab === "chart" && (
          <Suspense fallback={<Spinner />}><ChartViewer /></Suspense>
        )}
        {tab === "ranking" && (
          <Suspense fallback={<Spinner />}><StockRanking /></Suspense>
        )}
        {tab === "valuation" && (
          <Suspense fallback={<Spinner />}><Valuation /></Suspense>
        )}
        {tab === "cpi" && (
          <Suspense fallback={<Spinner />}><CpiAnalysis /></Suspense>
        )}
        {tab === "macro" && (
          <Suspense fallback={<Spinner />}><MacroMatrix /></Suspense>
        )}
      </main>
    </div>
  );
}
