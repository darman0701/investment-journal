"use client";
import { useState, useCallback } from "react";

interface RankingQuote {
  rank: number;
  ticker: string;
  name: string;
  sector: string;
  market: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

type Period = "daily" | "weekly" | "monthly" | "3m" | "6m" | "1y";

export default function StockRanking() {
  const [type, setType] = useState<"gainers" | "losers">("gainers");
  const [quotes, setQuotes] = useState<RankingQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [period, setPeriod] = useState<Period>("daily");
  const [count, setCount] = useState(20);
  const [error, setError] = useState("");

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ranking?type=${type}&count=${count}&period=${period}`);
      const data = await res.json();
      if (data.error) {
        setError("データ取得に失敗しました。しばらく後に再試行してください。");
      }
      setQuotes(data.quotes || []);
      setUpdatedAt(data.updatedAt || "");
    } catch {
      setError("データ取得に失敗しました");
    }
    setLoading(false);
  }, [type, count, period]);

  const formatVolume = (v: number) => {
    if (v >= 1e8) return `${(v / 1e8).toFixed(1)}億`;
    if (v >= 1e4) return `${(v / 1e4).toFixed(0)}万`;
    return v.toLocaleString();
  };

  const formatMarketCap = (v: number) => {
    if (!v) return "-";
    if (v >= 1e12) return `${(v / 1e12).toFixed(1)}兆`;
    if (v >= 1e8) return `${(v / 1e8).toFixed(0)}億`;
    return `${(v / 1e4).toFixed(0)}万`;
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold">日本株 騰落率ランキング</h3>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Period */}
          <div>
            <p className="text-[11px] text-muted mb-1.5">集計期間</p>
            <div className="flex gap-1.5 text-[12px]">
              {([["daily", "日次"], ["weekly", "週次"], ["monthly", "月次"], ["3m", "3ヶ月"], ["6m", "6ヶ月"], ["1y", "1年"]] as const).map(([val, label]) => (
                <label key={val} className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="period" checked={period === val} onChange={() => setPeriod(val)} className="!w-3.5 !h-3.5 !p-0 accent-primary" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Count */}
          <div>
            <p className="text-[11px] text-muted mb-1.5">表示件数</p>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="!text-[12px] !py-1 !px-2 !rounded-lg">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Type Toggle + Fetch Button */}
        <div className="flex items-center gap-3">
          <div className="flex border border-border rounded-lg overflow-hidden text-[12px]">
            <button
              onClick={() => setType("gainers")}
              className={`px-3 py-1.5 transition-colors ${type === "gainers" ? "bg-success text-white" : "bg-card text-muted hover:text-foreground"}`}
            >
              上昇率 TOP
            </button>
            <button
              onClick={() => setType("losers")}
              className={`px-3 py-1.5 transition-colors ${type === "losers" ? "bg-danger text-white" : "bg-card text-muted hover:text-foreground"}`}
            >
              下落率 TOP
            </button>
          </div>

          <button
            onClick={fetchRanking}
            disabled={loading}
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-[12px] rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "取得中..." : "ランキング取得"}
          </button>
        </div>

        <p className="text-[10px] text-muted">
          ※ 株式分割・併合によるデータの歪みは調整済み株価（Adjusted Close）を使用して除外しています
        </p>

        {updatedAt && (
          <p className="text-[11px] text-muted">
            最終更新: {new Date(updatedAt).toLocaleString("ja-JP")}
          </p>
        )}
      </div>

      {error && <p className="text-[12px] text-danger">{error}</p>}

      {/* Ranking Table */}
      {quotes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 px-2 text-left font-medium w-8">順位</th>
                <th className="py-2 px-2 text-left font-medium">銘柄名</th>
                <th className="py-2 px-2 text-left font-medium w-16">コード</th>
                <th className="py-2 px-2 text-left font-medium hidden sm:table-cell">業種</th>
                <th className="py-2 px-2 text-right font-medium">現在株価</th>
                <th className="py-2 px-2 text-right font-medium w-20">騰落率(%)</th>
                <th className="py-2 px-2 text-right font-medium hidden sm:table-cell">出来高</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.ticker} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="py-2.5 px-2 text-muted tabular-nums">{q.rank}</td>
                  <td className="py-2.5 px-2 font-medium truncate max-w-[140px]">{q.name}</td>
                  <td className="py-2.5 px-2 text-muted tabular-nums">{q.ticker}</td>
                  <td className="py-2.5 px-2 text-muted text-[11px] hidden sm:table-cell truncate max-w-[100px]">{q.sector || "-"}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">¥{q.price.toLocaleString()}</td>
                  <td className={`py-2.5 px-2 text-right tabular-nums font-medium ${q.changePercent >= 0 ? "text-success" : "text-danger"}`}>
                    {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-2 text-right text-muted tabular-nums hidden sm:table-cell">{formatVolume(q.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!quotes.length && !loading && !error && (
        <div className="text-center py-12 text-muted text-[13px]">
          「ランキング取得」をクリックしてデータを取得してください
        </div>
      )}
    </div>
  );
}
