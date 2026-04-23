"use client";
import { useEffect, useMemo, useState } from "react";
import { Trade, WatchlistItem, Analysis, EMOTION_ICONS } from "@/lib/types";
import { computePositions } from "@/lib/positions";
import { usePrices } from "@/lib/usePrices";
import { CloseIcon, ExtIcon } from "@/components/ui/icons";
import { Tag } from "@/components/ui/primitives";
import { fmtDateShort, fmtPct, pseudoSpark } from "@/components/ui/format";

interface Props {
  ticker: string;
  trades: Trade[];
  watchlist: WatchlistItem[];
  analyses: Analysis[];
  onClose: () => void;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type TF = "1W" | "1M" | "3M" | "1Y";

const TF_TO_RANGE: Record<TF, string> = {
  "1W": "1mo",
  "1M": "3mo",
  "3M": "6mo",
  "1Y": "1y",
};

export default function StockDetailModal({
  ticker,
  trades,
  watchlist,
  analyses,
  onClose,
}: Props) {
  const [tf, setTf] = useState<TF>("1M");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const positions = useMemo(() => computePositions(trades), [trades]);
  const position = positions.find((p) => p.ticker === ticker);
  const { prices } = usePrices([ticker]);
  const priceData = prices[ticker];

  const stockTrades = useMemo(
    () =>
      trades
        .filter((t) => t.ticker === ticker)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [trades, ticker]
  );
  const stockAnalyses = useMemo(
    () => analyses.filter((a) => a.ticker === ticker),
    [analyses, ticker]
  );
  const watchItem = watchlist.find((w) => w.ticker === ticker);

  // Resolve name: prefer trade name, then watch, then analysis, then ticker
  const name =
    trades.find((t) => t.ticker === ticker && t.name)?.name ||
    watchItem?.name ||
    analyses.find((a) => a.ticker === ticker && a.name)?.name ||
    ticker;

  useEffect(() => {
    let cancelled = false;
    const range = TF_TO_RANGE[tf];
    const run = async () => {
      setLoadingChart(true);
      try {
        const r = await fetch(
          `/api/chart?ticker=${encodeURIComponent(ticker)}&range=${range}`
        );
        const d = r.ok ? await r.json() : null;
        if (cancelled) return;
        const c: Candle[] = d?.candles ?? d?.[ticker]?.candles ?? [];
        setCandles(Array.isArray(c) ? c : []);
      } catch {
        if (!cancelled) setCandles([]);
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [ticker, tf]);

  // Build chart path
  const chartData =
    candles.length > 1 ? candles.map((c) => c.close) : pseudoSpark(ticker, 30);
  const W = 334;
  const H = 160;
  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min || 1;
  const pts = chartData.map((v, i) => [
    (i / (chartData.length - 1)) * W,
    H - ((v - min) / range) * (H - 10) - 5,
  ]);
  const path = pts
    .map(
      (p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)
    )
    .join(" ");

  const displayPrice =
    priceData?.price ??
    candles[candles.length - 1]?.close ??
    position?.avgPrice ??
    0;
  const displayChange = priceData?.change ?? 0;
  const displayPct = priceData?.changePercent ?? 0;

  return (
    <div
      className="anim-sheet-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 8px) 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="tap"
          aria-label="閉じる"
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          <CloseIcon size={18} />
        </button>
        <div
          className="serif"
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <a
          href={`https://finance.yahoo.co.jp/quote/${ticker}.T`}
          target="_blank"
          rel="noreferrer"
          className="tap"
          aria-label="外部リンク"
          style={{ color: "var(--text-muted)" }}
        >
          <ExtIcon size={18} />
        </a>
      </div>

      <div
        className="scrollbar-none"
        style={{ flex: 1, overflowY: "auto", padding: "0 16px 40px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            className="tabular mono"
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {ticker}
          </div>
          {position && <Tag tone="success">保有中</Tag>}
          {watchItem && <Tag tone="primary">監視中</Tag>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div
            className="tabular serif"
            style={{
              fontSize: 42,
              fontWeight: 600,
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            ¥{Math.round(displayPrice).toLocaleString("ja-JP")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            <div
              className="tabular"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  displayChange >= 0 ? "var(--success)" : "var(--danger)",
              }}
            >
              {displayChange >= 0 ? "+" : "−"}¥
              {Math.abs(Math.round(displayChange)).toLocaleString("ja-JP")} (
              {fmtPct(displayPct)})
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>本日</div>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 10px 10px", marginBottom: 14 }}>
          {loadingChart ? (
            <div
              style={{
                height: H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-faint)",
                fontSize: 12,
              }}
            >
              読込中...
            </div>
          ) : (
            <svg width={W} height={H} style={{ display: "block" }}>
              <defs>
                <linearGradient id="sdg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={path + ` L ${W} ${H} L 0 ${H} Z`}
                fill="url(#sdg)"
              />
              <path
                d={path}
                stroke="var(--primary)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {(["1W", "1M", "3M", "1Y"] as TF[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTf(p)}
                className="tap"
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: tf === p ? "var(--primary-soft)" : "transparent",
                  color: tf === p ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {position && (
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 600,
                marginBottom: 10,
                letterSpacing: 0.5,
              }}
            >
              保有状況
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <Stat label="保有株数" value={`${position.totalQuantity}`} unit="株" />
              <Stat
                label="平均取得"
                value={`¥${Math.round(position.avgPrice).toLocaleString("ja-JP")}`}
              />
              <Stat
                label="評価額"
                value={`¥${Math.round(
                  displayPrice * position.totalQuantity
                ).toLocaleString("ja-JP")}`}
              />
              <Stat
                label="損益"
                value={`${displayPrice > position.avgPrice ? "+" : ""}¥${Math.round(
                  (displayPrice - position.avgPrice) * position.totalQuantity
                ).toLocaleString("ja-JP")}`}
                tone={displayPrice > position.avgPrice ? "success" : "danger"}
              />
            </div>
          </div>
        )}

        <DetailSection title={`取引履歴 (${stockTrades.length})`}>
          {stockTrades.length === 0 ? (
            <Empty text="この銘柄の取引記録はまだありません" />
          ) : (
            stockTrades.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderTop: "1px solid var(--border-soft)",
                }}
              >
                <div
                  style={{
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background:
                      t.type === "buy"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {t.type === "buy" ? "買" : "売"}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="tabular" style={{ fontSize: 12 }}>
                    {fmtDateShort(t.date)}
                  </div>
                  <div
                    className="tabular"
                    style={{ fontSize: 11, color: "var(--text-muted)" }}
                  >
                    ¥{t.price.toLocaleString("ja-JP")} × {t.quantity}株
                  </div>
                </div>
                {t.emotion && (
                  <div style={{ fontSize: 14 }}>{EMOTION_ICONS[t.emotion]}</div>
                )}
              </div>
            ))
          )}
        </DetailSection>

        <DetailSection title={`分析ノート (${stockAnalyses.length})`}>
          {stockAnalyses.length === 0 ? (
            <Empty text="分析ノートはまだありません" />
          ) : (
            stockAnalyses.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 0",
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  color: "var(--text)",
                  borderTop: "1px solid var(--border-soft)",
                }}
              >
                {a.summary}
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--text-faint)",
                    marginTop: 6,
                  }}
                >
                  {a.date}
                  {a.source ? ` · ${a.source}` : ""}
                </div>
              </div>
            ))
          )}
        </DetailSection>

        {watchItem && (
          <DetailSection title="監視メモ">
            <div
              style={{ padding: "10px 0", fontSize: 12.5, lineHeight: 1.7 }}
            >
              {watchItem.note || "(メモなし)"}
              {watchItem.targetPrice && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 6,
                  }}
                >
                  目標 ¥{watchItem.targetPrice.toLocaleString("ja-JP")}
                </div>
              )}
            </div>
          </DetailSection>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "success" | "danger";
}) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{label}</div>
      <div
        className="tabular"
        style={{
          fontSize: 16,
          fontWeight: tone ? 700 : 600,
          marginTop: 2,
          color:
            tone === "success"
              ? "var(--success)"
              : tone === "danger"
              ? "var(--danger)"
              : "var(--text)",
        }}
      >
        {value}
        {unit && (
          <span
            style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div className="serif" style={{ fontSize: 14, fontWeight: 600 }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "14px 0",
        fontSize: 12,
        color: "var(--text-faint)",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
