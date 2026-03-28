"use client";
import { useState, useEffect } from "react";

interface TickerEvents {
  name: string;
  dividends: { date: string; amount: number }[];
  nextDividendMonth: number[];
  dividendNote: string;
  earningsDate: string | null;
  earningsTimestampStart: number | null;
  earningsTimestampEnd: number | null;
  fiscalYearEnd: number | null;
}

const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

interface Props {
  tickers: string[];
  tickerNames: Record<string, string>;
}

export default function EventCalendar({ tickers, tickerNames }: Props) {
  const [tab, setTab] = useState<"all" | "earnings" | "dividend">("all");
  const [data, setData] = useState<Record<string, TickerEvents | null>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    if (tickers.length === 0) return;
    setLoading(true);
    fetch(`/api/events?tickers=${tickers.join(",")}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLastUpdated(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tickers.join(",")]);

  if (tickers.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted">銘柄がありません</p>
        <p className="text-[11px] text-muted mt-1">保有・監視銘柄を追加すると表示されます</p>
      </div>
    );
  }

  // Build earnings list
  const earningsList = tickers
    .map((ticker) => {
      const d = data[ticker];
      if (!d || !d.earningsDate) return null;
      return { ticker, name: tickerNames[ticker] || d.name, date: d.earningsDate, start: d.earningsTimestampStart, end: d.earningsTimestampEnd };
    })
    .filter(Boolean)
    .sort((a, b) => a!.date.localeCompare(b!.date));

  // Build dividend list
  const dividendList = tickers
    .map((ticker) => {
      const d = data[ticker];
      if (!d) return null;
      const name = tickerNames[ticker] || d.name;
      const hasDividend = d.nextDividendMonth.length > 0;
      const months = d.nextDividendMonth.map((m) => MONTH_NAMES[m - 1]).join(" / ");
      const recentDivs = d.dividends.slice(-4);
      return { ticker, name, hasDividend, months, note: d.dividendNote, recentDivs };
    })
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "earnings", "dividend"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-[11px] rounded-lg transition ${
                tab === t ? "bg-card text-foreground border border-border" : "text-muted hover:text-foreground"
              }`}
            >
              {t === "all" ? "すべて" : t === "earnings" ? "決算" : "配当"}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted">
          {loading ? "取得中..." : lastUpdated ? `${lastUpdated} 更新` : ""}
        </span>
      </div>

      {loading && Object.keys(data).length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {(tab === "all" || tab === "earnings") && !loading && (
        <div>
          <h4 className="text-[13px] font-medium mb-3">次回決算発表</h4>
          <div className="space-y-1">
            {earningsList.length > 0 ? earningsList.map((event, i) => {
              const e = event!;
              const earningsDate = new Date(e.date);
              const now = new Date();
              const daysUntil = Math.ceil((earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isClose = daysUntil <= 14;
              const dateRange = e.start && e.end && e.start !== e.end
                ? `${new Date(e.start * 1000).toLocaleDateString("ja-JP")} 〜 ${new Date(e.end * 1000).toLocaleDateString("ja-JP")}`
                : new Date(e.date).toLocaleDateString("ja-JP");
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className="w-20 text-center">
                    <span className={`text-[12px] font-mono font-medium ${isClose ? "text-warning" : "text-primary"}`}>
                      {dateRange.length > 14 ? e.date : dateRange}
                    </span>
                  </div>
                  <div className={`w-1 h-6 rounded-full ${isClose ? "bg-warning/60" : "bg-primary/40"}`} />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium">{e.name}</p>
                    <p className="text-[11px] text-muted">
                      {e.ticker}
                      {daysUntil > 0 && <span className={`ml-2 ${isClose ? "text-warning font-medium" : ""}`}>あと{daysUntil}日</span>}
                      {daysUntil <= 0 && <span className="ml-2 text-danger font-medium">決算済み</span>}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-[11px] text-muted py-2">
                {Object.keys(data).length > 0 ? "決算日データが取得できませんでした" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {(tab === "all" || tab === "dividend") && !loading && (
        <div>
          <h4 className="text-[13px] font-medium mb-3">配当情報（自動取得）</h4>
          <div className="space-y-1">
            {dividendList.map((item) => {
              const d = item!;
              return (
                <div key={d.ticker} className="py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-center">
                      {d.hasDividend ? (
                        <span className="text-[11px] font-medium text-success">{d.months}</span>
                      ) : (
                        <span className="text-[11px] text-muted">—</span>
                      )}
                    </div>
                    <div className={`w-1 h-6 rounded-full ${d.hasDividend ? "bg-success/40" : "bg-border"}`} />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted">{d.ticker} / {d.note}</p>
                    </div>
                  </div>
                  {d.recentDivs.length > 0 && (
                    <div className="ml-24 mt-1.5 flex gap-2">
                      {d.recentDivs.map((div, i) => (
                        <span key={i} className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded">
                          {div.date.slice(5)} : {div.amount}円
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
