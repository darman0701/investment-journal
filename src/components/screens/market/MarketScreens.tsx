"use client";
import { lazy, Suspense, type ReactNode } from "react";
import { Trade, WatchlistItem } from "@/lib/types";

const ChartViewer = lazy(() => import("@/components/ChartViewer"));
const StockRanking = lazy(() => import("@/components/StockRanking"));
const Valuation = lazy(() => import("@/components/Valuation"));
const CpiAnalysis = lazy(() => import("@/components/CpiAnalysis"));
const MacroMatrix = lazy(() => import("@/components/MacroMatrix"));
const EventCalendar = lazy(() => import("@/components/EventCalendar"));

function ScreenWrap({ children }: { children: ReactNode }) {
  return (
    <div
      className="scrollbar-none"
      style={{ flex: 1, overflowY: "auto", padding: "14px 16px 140px" }}
    >
      {children}
    </div>
  );
}

function Skel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="card"
          style={{
            height: 80,
            opacity: 0.5,
            animation: "pulse 1.2s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

export function ChartScreen() {
  return (
    <ScreenWrap>
      <Suspense fallback={<Skel />}>
        <ChartViewer />
      </Suspense>
    </ScreenWrap>
  );
}

export function RankingsScreen() {
  return (
    <ScreenWrap>
      <Suspense fallback={<Skel />}>
        <StockRanking />
      </Suspense>
    </ScreenWrap>
  );
}

export function IndicatorsScreen({
  trades,
  watchlist,
}: {
  trades: Trade[];
  watchlist: WatchlistItem[];
}) {
  const tickers = Array.from(
    new Set([...trades.map((t) => t.ticker), ...watchlist.map((w) => w.ticker)])
  );
  const names: Record<string, string> = {};
  for (const t of trades) if (t.name) names[t.ticker] = t.name;
  for (const w of watchlist) if (w.name) names[w.ticker] = w.name;
  return (
    <ScreenWrap>
      <Suspense fallback={<Skel />}>
        <Valuation />
      </Suspense>
      <div style={{ height: 18 }} />
      <Suspense fallback={<Skel />}>
        <EventCalendar tickers={tickers} tickerNames={names} />
      </Suspense>
    </ScreenWrap>
  );
}

export function CPIScreen() {
  return (
    <ScreenWrap>
      <Suspense fallback={<Skel />}>
        <CpiAnalysis />
      </Suspense>
    </ScreenWrap>
  );
}

export function MacroScreen() {
  return (
    <ScreenWrap>
      <Suspense fallback={<Skel />}>
        <MacroMatrix />
      </Suspense>
    </ScreenWrap>
  );
}
