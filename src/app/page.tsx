"use client";
import { useState } from "react";
import { useCloudStorage } from "@/lib/useCloudStorage";
import { useTickerDetail, openTicker } from "@/lib/useTickerDetail";
import {
  Trade,
  WatchlistItem,
  InvestmentRule,
  Analysis,
} from "@/lib/types";
import { BottomNav, FAB, Sidebar, SubTabs, type MainTab } from "@/components/ui/Shell";
import HomeScreen from "@/components/screens/HomeScreen";
import TradesScreen from "@/components/screens/journal/TradesScreen";
import AnalysisScreen from "@/components/screens/journal/AnalysisScreen";
import WatchScreen from "@/components/screens/journal/WatchScreen";
import ReviewScreen from "@/components/screens/journal/ReviewScreen";
import DisciplineScreen from "@/components/screens/journal/DisciplineScreen";
import {
  ChartScreen,
  RankingsScreen,
  IndicatorsScreen,
  CPIScreen,
  MacroScreen,
} from "@/components/screens/market/MarketScreens";
import TradeFormModal from "@/components/modals/TradeFormModal";
import StockDetailModal from "@/components/modals/StockDetailModal";

const JOURNAL_SUBS = ["取引", "分析", "監視", "振返り", "規律"] as const;
const MARKET_SUBS = ["チャート", "ランキング", "指標", "CPI", "マクロ"] as const;

type JournalSub = (typeof JOURNAL_SUBS)[number];
type MarketSub = (typeof MARKET_SUBS)[number];

function Spinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          border: "2px solid var(--primary)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "pulse 1s linear infinite",
        }}
      />
    </div>
  );
}

export default function Home() {
  const { data, update, isLoaded } = useCloudStorage();
  const trades = data.trades as Trade[];
  const watchlist = data.watchlist as WatchlistItem[];
  const rules = data.rules as InvestmentRule[];
  const analyses = data.analyses as Analysis[];

  const [tab, setTab] = useState<MainTab>("home");
  const [journalSub, setJournalSub] = useState<JournalSub>("取引");
  const [marketSub, setMarketSub] = useState<MarketSub>("チャート");
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>();
  const { ticker, close: closeTicker } = useTickerDetail();

  const setTrades = (fn: (prev: Trade[]) => Trade[]) =>
    update((d) => ({ ...d, trades: fn(d.trades as Trade[]) }));
  const setWatchlist = (fn: (prev: WatchlistItem[]) => WatchlistItem[]) =>
    update((d) => ({ ...d, watchlist: fn(d.watchlist as WatchlistItem[]) }));
  const setRules = (fn: (prev: InvestmentRule[]) => InvestmentRule[]) =>
    update((d) => ({ ...d, rules: fn(d.rules as InvestmentRule[]) }));

  const handleSaveTrade = (trade: Trade) => {
    setTrades((prev) => {
      const i = prev.findIndex((t) => t.id === trade.id);
      if (i >= 0) {
        const u = [...prev];
        u[i] = trade;
        return u;
      }
      return [...prev, trade];
    });
    setShowTradeForm(false);
    setEditingTrade(undefined);
  };

  const handleEditTrade = (t: Trade) => {
    setEditingTrade(t);
    setShowTradeForm(true);
  };

  const handleDeleteTrade = (id: string) =>
    setTrades((prev) => prev.filter((t) => t.id !== id));

  const openStock = (t: string) => openTicker(t);

  const navigate = (next: MainTab, sub?: string) => {
    setTab(next);
    if (next === "journal" && sub && JOURNAL_SUBS.includes(sub as JournalSub))
      setJournalSub(sub as JournalSub);
    if (next === "market" && sub && MARKET_SUBS.includes(sub as MarketSub))
      setMarketSub(sub as MarketSub);
  };

  if (!isLoaded) return <Spinner />;

  let body: React.ReactNode = null;
  if (tab === "home") {
    body = (
      <HomeScreen
        trades={trades}
        watchlist={watchlist}
        onOpenStock={openStock}
        onNavigate={navigate}
      />
    );
  } else if (tab === "journal") {
    const screens: Record<JournalSub, React.ReactNode> = {
      取引: (
        <TradesScreen
          trades={trades}
          onOpenStock={openStock}
          onEdit={handleEditTrade}
          onDelete={handleDeleteTrade}
        />
      ),
      分析: <AnalysisScreen analyses={analyses} onOpenStock={openStock} />,
      監視: (
        <WatchScreen
          items={watchlist}
          onOpenStock={openStock}
          onAdd={(w) => setWatchlist((prev) => [...prev, w])}
          onDelete={(id) => setWatchlist((prev) => prev.filter((i) => i.id !== id))}
        />
      ),
      振返り: <ReviewScreen trades={trades} />,
      規律: (
        <DisciplineScreen
          rules={rules}
          onAdd={(r) => setRules((prev) => [...prev, r])}
          onToggle={(id) =>
            setRules((prev) =>
              prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
            )
          }
          onDelete={(id) => setRules((prev) => prev.filter((r) => r.id !== id))}
        />
      ),
    };
    body = (
      <>
        <SubTabs
          tabs={JOURNAL_SUBS}
          active={journalSub}
          onChange={setJournalSub}
          hideOnDesktop
        />
        {screens[journalSub]}
      </>
    );
  } else if (tab === "market") {
    const screens: Record<MarketSub, React.ReactNode> = {
      チャート: <ChartScreen />,
      ランキング: <RankingsScreen />,
      指標: <IndicatorsScreen trades={trades} watchlist={watchlist} />,
      CPI: <CPIScreen />,
      マクロ: <MacroScreen />,
    };
    body = (
      <>
        <SubTabs
          tabs={MARKET_SUBS}
          active={marketSub}
          onChange={setMarketSub}
          hideOnDesktop
        />
        {screens[marketSub]}
      </>
    );
  }

  const sidebarSubs =
    tab === "journal"
      ? JOURNAL_SUBS
      : tab === "market"
      ? MARKET_SUBS
      : undefined;
  const sidebarActiveSub =
    tab === "journal" ? journalSub : tab === "market" ? marketSub : undefined;
  const sidebarOnSubChange =
    tab === "journal"
      ? (s: string) => setJournalSub(s as JournalSub)
      : tab === "market"
      ? (s: string) => setMarketSub(s as MarketSub)
      : undefined;

  return (
    <div className="app-root">
      <Sidebar
        tab={tab}
        onTab={setTab}
        subTabs={sidebarSubs}
        activeSub={sidebarActiveSub}
        onSubChange={sidebarOnSubChange}
      />
      <div className="app-main">
        <div className="app-content">{body}</div>
      </div>
      <FAB onClick={() => setShowTradeForm(true)} />
      <BottomNav tab={tab} onTab={setTab} />
      {showTradeForm && (
        <TradeFormModal
          onClose={() => {
            setShowTradeForm(false);
            setEditingTrade(undefined);
          }}
          onSubmit={handleSaveTrade}
          initial={editingTrade}
        />
      )}
      {ticker && (
        <StockDetailModal
          ticker={ticker}
          trades={trades}
          watchlist={watchlist}
          analyses={analyses}
          onClose={closeTicker}
        />
      )}
    </div>
  );
}
