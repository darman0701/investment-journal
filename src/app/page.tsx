"use client";
import { useState, lazy, Suspense, useEffect } from "react";
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
import SearchBar from "@/components/SearchBar";
import TickerDetail from "@/components/TickerDetail";

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

// Bottom mobile tabs — main journal tabs for thumb reach on <md screens
const MOBILE_BOTTOM_TABS: { key: Tab; label: string }[] = [
  { key: "portfolio", label: "資産" },
  { key: "trades", label: "取引" },
  { key: "watchlist", label: "監視" },
  { key: "review", label: "振返り" },
  { key: "calendar", label: "予定" },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="h-20 rounded-2xl bg-surface" />
      <div className="h-20 rounded-2xl bg-surface" />
      <div className="h-20 rounded-2xl bg-surface" />
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
  const [scrolled, setScrolled] = useState(false);

  const isMarketTab = MARKET_TABS.some((t) => t.key === tab);

  // Scroll shadow for sticky nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const navigateToTab = (next: string) => {
    if (JOURNAL_TABS.some((t) => t.key === next) || MARKET_TABS.some((t) => t.key === next)) {
      setTab(next as Tab);
      setShowForm(false);
      setEditingTrade(undefined);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen mx-auto flex flex-col ${isMarketTab ? "max-w-4xl" : "max-w-2xl"}`}>
      <header className="px-5 pt-6 pb-2 flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold tracking-tight shrink-0">Journal</h1>
        <div className="flex-1 flex justify-end">
          <SearchBar
            trades={trades}
            watchlist={watchlist}
            analyses={analyses}
            rules={rules}
            onNavigate={navigateToTab}
          />
        </div>
        <span className="text-[11px] text-muted tabular-nums shrink-0 hidden sm:inline">
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </header>

      <nav
        className={`px-5 py-3 sticky top-0 z-20 bg-background/80 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "shadow-[0_1px_0_0_var(--border),0_4px_12px_-6px_rgba(0,0,0,0.06)]" : ""
        }`}
      >
        {/* Journal tabs */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-none">
          {JOURNAL_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); setEditingTrade(undefined); }}
              className={`pb-2.5 px-3 text-[13px] transition-colors relative whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm ${
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
              className={`pb-2.5 px-3 text-[13px] transition-colors relative whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm ${
                tab === t.key ? "text-foreground font-medium" : "text-muted hover:text-foreground/70"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-5 pb-24 md:pb-10 pt-1">
        {/* Journal Tabs */}
        {tab === "trades" && (
          <>
            {showForm ? (
              <div className="border border-border rounded-2xl p-5 mb-5 bg-card">
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
                className="w-full py-3 mb-5 bg-primary hover:bg-primary-hover text-white text-[13px] font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                取引を記録
              </button>
            )}
            <TradeList trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onReview={handleReview} />
          </>
        )}
        {tab === "analysis" && <AnalysisList analyses={analyses} />}
        {tab === "portfolio" && <Portfolio trades={trades} watchlist={watchlist} onNavigate={navigateToTab} />}
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
          <Suspense fallback={<LoadingSkeleton />}><ChartViewer /></Suspense>
        )}
        {tab === "ranking" && (
          <Suspense fallback={<LoadingSkeleton />}><StockRanking /></Suspense>
        )}
        {tab === "valuation" && (
          <Suspense fallback={<LoadingSkeleton />}><Valuation /></Suspense>
        )}
        {tab === "cpi" && (
          <Suspense fallback={<LoadingSkeleton />}><CpiAnalysis /></Suspense>
        )}
        {tab === "macro" && (
          <Suspense fallback={<LoadingSkeleton />}><MacroMatrix /></Suspense>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-stretch justify-around max-w-2xl mx-auto">
          {MOBILE_BOTTOM_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setShowForm(false); setEditingTrade(undefined); }}
                className={`flex-1 py-2.5 text-[11px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  active ? "text-primary font-medium" : "text-muted"
                }`}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <TickerDetail trades={trades} watchlist={watchlist} analyses={analyses} />
    </div>
  );
}
