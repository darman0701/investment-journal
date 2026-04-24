"use client";
import { useMemo, useState } from "react";
import { Trade, WatchlistItem } from "@/lib/types";
import { computePositions } from "@/lib/positions";
import { usePrices } from "@/lib/usePrices";
import {
  SearchIcon,
  AlertIcon,
  CalendarIcon,
  ChevronIcon,
} from "@/components/ui/icons";
import { TickerLogo } from "@/components/ui/primitives";
import { Section } from "@/components/ui/Section";
import { StickyHeader, ThemeToggle, useScrollShadow } from "@/components/ui/Shell";
import { fmtYen, fmtPct, fmtDateShort } from "@/components/ui/format";

interface Props {
  trades: Trade[];
  watchlist: WatchlistItem[];
  onOpenStock: (ticker: string) => void;
  onNavigate: (tab: "home" | "journal" | "market", sub?: string) => void;
}

type Period = "今日" | "週" | "月";

export default function HomeScreen({
  trades,
  watchlist,
  onOpenStock,
  onNavigate,
}: Props) {
  const [period, setPeriod] = useState<Period>("今日");
  const [scrolled, onScroll] = useScrollShadow();

  const positions = useMemo(() => computePositions(trades), [trades]);
  const tickers = useMemo(() => positions.map((p) => p.ticker), [positions]);
  const { prices } = usePrices(tickers);

  const totalValue = positions.reduce((s, p) => {
    const px = prices[p.ticker]?.price ?? p.avgPrice;
    return s + px * p.totalQuantity;
  }, 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
  const totalPnL = totalValue - totalCost;
  const totalPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Today's change (based on price day-change if available)
  const todayChange = positions.reduce((s, p) => {
    const pd = prices[p.ticker];
    if (!pd) return s;
    return s + pd.change * p.totalQuantity;
  }, 0);
  const todayPct = totalValue > 0 ? (todayChange / (totalValue - todayChange)) * 100 : 0;

  const unreviewed = trades.filter((t) => !t.rating).length;

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  // Alerts: watchlist items within 5% of target
  const alerts = watchlist
    .map((w) => {
      const price = prices[w.ticker]?.price;
      if (!w.targetPrice || !price) return null;
      const dist = Math.abs(price - w.targetPrice) / w.targetPrice;
      if (dist <= 0.05) return { w, price };
      return null;
    })
    .filter((x): x is { w: WatchlistItem; price: number } => x !== null)
    .slice(0, 1);

  // Recent trades (latest 3 by date)
  const recentTrades = useMemo(
    () =>
      [...trades]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [trades]
  );

  return (
    <>
      <StickyHeader scrolled={scrolled}>
        <div
          className="serif"
          style={{ fontSize: 22, fontWeight: 600, letterSpacing: 0.5 }}
        >
          Journal
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--text-muted)",
          }}
        >
          <div
            className="tabular"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            {dateStr}
          </div>
          <ThemeToggle />
          <button
            type="button"
            aria-label="検索"
            className="tap"
            style={{ color: "var(--text-muted)" }}
          >
            <SearchIcon size={18} />
          </button>
        </div>
      </StickyHeader>

      <div
        className="scrollbar-none home-scroll"
        onScroll={onScroll}
        style={{ flex: 1, overflowY: "auto", padding: "8px 16px 140px" }}
      >
        {/* Hero card */}
        <div className="card" style={{ padding: "22px 22px 18px", marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-muted)",
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            <span>評価額</span>
            <span>·</span>
            <span>{period}</span>
          </div>
          <div
            className="tabular serif"
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: -1,
              lineHeight: 1.05,
              color: "var(--text)",
            }}
          >
            ¥{Math.round(totalValue).toLocaleString("ja-JP")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <div
              className="tabular"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: totalPnL >= 0 ? "var(--success)" : "var(--danger)",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <span>{fmtYen(Math.round(totalPnL), true)}</span>
            </div>
            <div
              className="tabular"
              style={{
                fontSize: 13,
                color: totalPnL >= 0 ? "var(--success)" : "var(--danger)",
                fontWeight: 500,
              }}
            >
              ({fmtPct(totalPct)})
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 16,
              padding: 3,
              background: "var(--border-soft)",
              borderRadius: 8,
            }}
          >
            {(["今日", "週", "月"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="tap"
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  color: period === p ? "var(--text)" : "var(--text-muted)",
                  background: period === p ? "var(--card)" : "transparent",
                  boxShadow:
                    period === p ? "0 1px 2px rgba(45,42,38,0.08)" : "none",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 2-col grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div className="card" style={{ padding: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              今日の損益
            </div>
            <div
              className="tabular"
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: todayChange >= 0 ? "var(--success)" : "var(--danger)",
                letterSpacing: -0.3,
              }}
            >
              {fmtYen(Math.round(todayChange), true)}
            </div>
            <div
              className="tabular"
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              {positions.length}銘柄 · {fmtPct(todayPct)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("journal", "振返り")}
            className="card tap"
            style={{ padding: 14, textAlign: "left" }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              未レビュー
            </div>
            <div
              className="tabular"
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: -0.3,
              }}
            >
              {unreviewed}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  marginLeft: 3,
                }}
              >
                件
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--primary)",
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              振り返り待ち →
            </div>
          </button>
        </div>

        {/* Alerts */}
        {alerts.map(({ w, price }) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onOpenStock(w.ticker)}
            className="card tap"
            style={{
              padding: "12px 14px 12px 16px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderLeft: "3px solid var(--primary)",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ color: "var(--primary)", flexShrink: 0 }}>
              <AlertIcon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                {w.name || w.ticker}が目標価格に接近
              </div>
              <div
                className="tabular"
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                ¥{price.toLocaleString("ja-JP")} → 目標 ¥
                {w.targetPrice?.toLocaleString("ja-JP")}
              </div>
            </div>
            <ChevronIcon size={14} />
          </button>
        ))}

        {/* Holdings */}
        {positions.length > 0 && (
          <Section
            title="保有銘柄"
            count={positions.length}
            onMore={() => onNavigate("journal", "取引")}
          >
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {positions.map((h, i) => {
                const pd = prices[h.ticker];
                const px = pd?.price ?? h.avgPrice;
                const chgPct = pd?.changePercent ?? 0;
                return (
                  <button
                    key={h.ticker}
                    type="button"
                    onClick={() => onOpenStock(h.ticker)}
                    className="tap"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                      textAlign: "left",
                    }}
                  >
                    <TickerLogo ticker={h.ticker} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: -0.1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {h.name}
                      </div>
                      <div
                        className="tabular mono"
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        {h.ticker} · {h.totalQuantity}株
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        className="tabular"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: -0.2,
                        }}
                      >
                        ¥{Math.round(px).toLocaleString("ja-JP")}
                      </div>
                      <div
                        className="tabular"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color:
                            chgPct >= 0 ? "var(--success)" : "var(--danger)",
                          marginTop: 1,
                        }}
                      >
                        {fmtPct(chgPct)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        <div className="xl:grid xl:grid-cols-2 xl:gap-3">
        {/* Watchlist preview (as a "decision" list - with targets) */}
        {watchlist.length > 0 && (
          <Section
            title="監視中"
            count={watchlist.length}
            onMore={() => onNavigate("journal", "監視")}
          >
            <div className="card" style={{ padding: 0 }}>
              {watchlist.slice(0, 3).map((w, i) => {
                const px = prices[w.ticker]?.price;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onOpenStock(w.ticker)}
                    className="tap"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderTop:
                        i === 0 ? "none" : "1px solid var(--border-soft)",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CalendarIcon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {w.name || w.ticker}
                      </div>
                      <div
                        className="tabular mono"
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        {w.ticker}
                        {w.targetPrice
                          ? ` · 目標 ¥${w.targetPrice.toLocaleString("ja-JP")}`
                          : ""}
                      </div>
                    </div>
                    {px != null && (
                      <div
                        className="tabular"
                        style={{ fontSize: 13, fontWeight: 600 }}
                      >
                        ¥{Math.round(px).toLocaleString("ja-JP")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Recent trades */}
        {recentTrades.length > 0 && (
          <Section
            title="直近の取引"
            onMore={() => onNavigate("journal", "取引")}
          >
            <div className="card" style={{ padding: 0 }}>
              {recentTrades.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenStock(t.ticker)}
                  className="tap"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderTop:
                      i === 0 ? "none" : "1px solid var(--border-soft)",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background:
                        t.type === "buy"
                          ? "var(--primary)"
                          : "var(--text-muted)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {t.type === "buy" ? "買" : "売"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.name || t.ticker}
                    </div>
                    <div
                      className="tabular"
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 1,
                      }}
                    >
                      {fmtDateShort(t.date)} · {t.quantity}株
                    </div>
                  </div>
                  <div
                    className="tabular"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    ¥{t.price.toLocaleString("ja-JP")}
                  </div>
                </button>
              ))}
            </div>
          </Section>
        )}
        </div>

        {positions.length === 0 &&
          watchlist.length === 0 &&
          recentTrades.length === 0 && (
            <div
              className="card"
              style={{
                padding: 28,
                textAlign: "center",
                marginTop: 24,
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                まだ取引が記録されていません
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                右下の + ボタンから最初の取引を記録しましょう
              </div>
            </div>
          )}
      </div>
    </>
  );
}
