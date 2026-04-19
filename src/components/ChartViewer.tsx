"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, SeriesType, Time } from "lightweight-charts";
import { TICKER_PRESETS, RANGE_OPTIONS, MA_OPTIONS, MA_COLORS, TIMEFRAME_OPTIONS } from "@/lib/chartConfig";

type DisplayMode = "individual" | "compare" | "ratio";
type ChartType = "candlestick" | "line";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TickerData {
  meta: { symbol: string; shortName: string; currency: string; regularMarketPrice: number; previousClose: number };
  candles: Candle[];
  splits: unknown[];
}

interface SelectedTicker {
  symbol: string;
  name: string;
  suffix?: string;
}

function toChartTime(ts: number): Time {
  return ts as Time;
}

function calcMA(candles: Candle[], period: number): { time: Time; value: number }[] {
  const result: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += candles[i - j].close;
    result.push({ time: toChartTime(candles[i].time), value: sum / period });
  }
  return result;
}

function normalizeData(candles: Candle[]): { time: Time; value: number }[] {
  if (!candles.length) return [];
  const base = candles[0].close;
  return candles.map((c) => ({ time: toChartTime(c.time), value: (c.close / base) * 100 }));
}

const LINE_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#a78bfa"];

interface ChartViewerProps {
  initialTicker?: { ticker: string; name?: string };
}

function resolveInitialSelected(initial?: { ticker: string; name?: string }): SelectedTicker[] {
  if (!initial?.ticker) return [{ symbol: "^GSPC", name: "S&P500" }];
  const t = initial.ticker.trim();
  // Japanese stock codes: 4 digits, optional letter suffix (e.g. 513A)
  const isJP = /^\d{4}[A-Z]?$/.test(t);
  const symbol = isJP ? `${t}.T` : t.toUpperCase();
  return [{ symbol, name: initial.name || t, suffix: isJP ? "T" : undefined }];
}

export default function ChartViewer({ initialTicker }: ChartViewerProps = {}) {
  const [selected, setSelected] = useState<SelectedTicker[]>(() => resolveInitialSelected(initialTicker));
  const [timeframeIdx, setTimeframeIdx] = useState(3); // 日足 default
  const [range, setRange] = useState("6mo");
  const [mode, setMode] = useState<DisplayMode>("individual");

  const currentTimeframe = TIMEFRAME_OPTIONS[timeframeIdx];
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showVolume, setShowVolume] = useState(true);
  const [maList, setMaList] = useState<number[]>([25, 75]);
  const [tickerInput, setTickerInput] = useState("");
  const [inputTab, setInputTab] = useState<"presets" | "jp" | "direct">("presets");
  const [data, setData] = useState<Record<string, TickerData>>({});
  const [loading, setLoading] = useState(false);
  const [latestPrices, setLatestPrices] = useState<Record<string, { price: number; change: number; changePercent: number }>>({});

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<SeriesType>[]>([]);

  const fetchData = useCallback(async () => {
    if (!selected.length) return;
    setLoading(true);
    try {
      const tickers = selected.map((s) => s.symbol).join(",");
      const res = await fetch(`/api/chart?tickers=${encodeURIComponent(tickers)}&range=${range}&interval=${currentTimeframe.interval}`);
      const json = await res.json();
      setData(json);

      const prices: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const [key, val] of Object.entries(json)) {
        const d = val as TickerData | null;
        if (d?.meta) {
          const prev = d.meta.previousClose || 0;
          const curr = d.meta.regularMarketPrice || 0;
          prices[key] = {
            price: curr,
            change: curr - prev,
            changePercent: prev > 0 ? ((curr - prev) / prev) * 100 : 0,
          };
        }
      }
      setLatestPrices(prices);
    } catch { /* ignore */ }
    setLoading(false);
  }, [selected, range, currentTimeframe.interval]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Render chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    seriesRefs.current = [];

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 420,
      layout: {
        background: { color: "#f5f6fa" },
        textColor: "#7c8091",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#e0e3ea" },
        horzLines: { color: "#e0e3ea" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "#e0e3ea" },
      timeScale: {
        borderColor: "#e0e3ea",
        timeVisible: ["5m", "15m", "60m"].includes(currentTimeframe.interval),
      },
    });
    chartRef.current = chart;

    const activeTickers = selected.filter((s) => data[s.symbol]);

    if (mode === "individual" && activeTickers.length === 1) {
      const tickerData = data[activeTickers[0].symbol];
      if (!tickerData?.candles?.length) return;
      const candles = tickerData.candles;

      if (chartType === "candlestick") {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: "#10b981",
          downColor: "#f43f5e",
          borderUpColor: "#10b981",
          borderDownColor: "#f43f5e",
          wickUpColor: "#10b981",
          wickDownColor: "#f43f5e",
        });
        series.setData(candles.map((c) => ({
          time: toChartTime(c.time),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })));
        seriesRefs.current.push(series as ISeriesApi<SeriesType>);
      } else {
        const series = chart.addSeries(LineSeries, { color: "#6366f1", lineWidth: 2 });
        series.setData(candles.map((c) => ({ time: toChartTime(c.time), value: c.close })));
        seriesRefs.current.push(series as ISeriesApi<SeriesType>);
      }

      // Moving averages
      maList.forEach((period, idx) => {
        const maData = calcMA(candles, period);
        if (maData.length) {
          const maSeries = chart.addSeries(LineSeries, {
            color: MA_COLORS[idx % MA_COLORS.length],
            lineWidth: 1,
          });
          maSeries.setData(maData);
          seriesRefs.current.push(maSeries as ISeriesApi<SeriesType>);
        }
      });

      // Volume
      if (showVolume) {
        const volSeries = chart.addSeries(HistogramSeries, {
          color: "#6366f180",
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
        chart.priceScale("vol").applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        volSeries.setData(candles.map((c) => ({
          time: toChartTime(c.time),
          value: c.volume,
          color: c.close >= c.open ? "#10b98140" : "#f43f5e40",
        })));
        seriesRefs.current.push(volSeries as ISeriesApi<SeriesType>);
      }
    } else if (mode === "compare" || (mode === "individual" && activeTickers.length > 1)) {
      activeTickers.forEach((ticker, idx) => {
        const tickerData = data[ticker.symbol];
        if (!tickerData?.candles?.length) return;

        const normalized = normalizeData(tickerData.candles);
        const series = chart.addSeries(LineSeries, {
          color: LINE_COLORS[idx % LINE_COLORS.length],
          lineWidth: 2,
          title: ticker.name,
        });
        series.setData(normalized);
        seriesRefs.current.push(series as ISeriesApi<SeriesType>);
      });
    } else if (mode === "ratio" && activeTickers.length >= 2) {
      const dataA = data[activeTickers[0].symbol]?.candles || [];
      const dataB = data[activeTickers[1].symbol]?.candles || [];
      if (dataA.length && dataB.length) {
        const minLen = Math.min(dataA.length, dataB.length);
        const ratioData = [];
        for (let i = 0; i < minLen; i++) {
          if (dataB[i].close > 0) {
            ratioData.push({
              time: toChartTime(dataA[i].time),
              value: Math.round((dataA[i].close / dataB[i].close) * 10000) / 10000,
            });
          }
        }
        const series = chart.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 2, title: `${activeTickers[0].name} / ${activeTickers[1].name}` });
        series.setData(ratioData);
        seriesRefs.current.push(series as ISeriesApi<SeriesType>);
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, selected, mode, chartType, showVolume, maList, range, currentTimeframe]);

  const addTicker = (symbol: string, name: string, suffix?: string) => {
    if (selected.find((s) => s.symbol === symbol)) return;
    setSelected((prev) => [...prev, { symbol, name, suffix }]);
  };

  const removeTicker = (symbol: string) => {
    setSelected((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const addDirectTicker = () => {
    const t = tickerInput.trim().toUpperCase();
    if (!t) return;
    addTicker(t, t, "T");
    setTickerInput("");
  };

  const toggleMA = (period: number) => {
    setMaList((prev) => prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period]);
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Ticker Selection */}
      <section>
        <h3 className="text-sm font-medium mb-3">銘柄を選択</h3>
        <div className="flex gap-2 mb-3 text-[12px]">
          <button onClick={() => setInputTab("presets")} className={`px-3 py-1.5 rounded-lg transition-colors ${inputTab === "presets" ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"}`}>
            よく使うティッカー
          </button>
          <button onClick={() => setInputTab("jp")} className={`px-3 py-1.5 rounded-lg transition-colors ${inputTab === "jp" ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"}`}>
            JP 日本株検索
          </button>
          <button onClick={() => setInputTab("direct")} className={`px-3 py-1.5 rounded-lg transition-colors ${inputTab === "direct" ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"}`}>
            直接入力
          </button>
        </div>

        {inputTab === "presets" && (
          <div className="space-y-3">
            {Object.entries(TICKER_PRESETS).map(([key, group]) => (
              <div key={key}>
                <p className="text-[11px] text-muted mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => addTicker(item.symbol, item.name, item.suffix)}
                      className={`px-2.5 py-1 text-[12px] rounded-lg border transition-colors ${
                        selected.find((s) => s.symbol === item.symbol)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-muted"
                      }`}
                    >
                      {selected.find((s) => s.symbol === item.symbol) && "✓ "}{item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(inputTab === "jp" || inputTab === "direct") && (
          <div className="flex gap-2">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDirectTicker()}
              placeholder={inputTab === "jp" ? "証券コード（例: 7203）" : "ティッカー（例: AAPL, ^GSPC, JPY=X）"}
              className="flex-1 !text-[12px]"
            />
            <button onClick={addDirectTicker} className="px-4 py-2 bg-primary text-white text-[12px] rounded-xl">
              追加
            </button>
          </div>
        )}
      </section>

      {/* Section 2: Selected Tickers */}
      {selected.length > 0 && (
        <section>
          <p className="text-[11px] text-muted mb-2">選択中の銘柄 — クリックで削除</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <button
                key={s.symbol}
                onClick={() => removeTicker(s.symbol)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-[12px] hover:border-danger transition-colors"
              >
                <span className="text-muted">×</span> {s.name}
              </button>
            ))}
          </div>
          {selected.length > 1 && (
            <button onClick={() => setSelected([])} className="mt-2 text-[11px] text-muted hover:text-danger flex items-center gap-1">
              すべて削除
            </button>
          )}
        </section>
      )}

      {/* Section 3: Chart Settings */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">チャート設定</h3>

        <div>
          <p className="text-[11px] text-muted mb-1.5">表示モード</p>
          <div className="flex gap-2 text-[12px]">
            {([["individual", "個別表示"], ["compare", "比較表示"], ["ratio", "倍率（A÷B）"]] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mode" checked={mode === val} onChange={() => setMode(val)} className="!w-3.5 !h-3.5 !p-0 accent-primary" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] text-muted mb-1.5">グラフ形式</p>
            <div className="flex gap-3 text-[12px]">
              {([["candlestick", "ローソク足"], ["line", "折れ線"]] as const).map(([val, label]) => (
                <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="chartType" checked={chartType === val} onChange={() => setChartType(val)} className="!w-3.5 !h-3.5 !p-0 accent-primary" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[12px] cursor-pointer mt-4">
            <input type="checkbox" checked={showVolume} onChange={() => setShowVolume(!showVolume)} className="!w-3.5 !h-3.5 !p-0 accent-primary" />
            出来高
          </label>
        </div>

        {mode === "individual" && selected.length <= 1 && (
          <div>
            <p className="text-[11px] text-muted mb-1.5">移動平均（個別表示）</p>
            <div className="flex flex-wrap gap-1.5">
              {MA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleMA(opt.value)}
                  className={`px-2.5 py-1 text-[12px] rounded-lg border transition-colors ${
                    maList.includes(opt.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeframe (足種) selector */}
        <div>
          <p className="text-[11px] text-muted mb-1.5">足種</p>
          <div className="flex flex-wrap gap-1.5">
            {TIMEFRAME_OPTIONS.map((tf, idx) => (
              <button
                key={tf.interval}
                onClick={() => { setTimeframeIdx(idx); setRange(tf.defaultRange); }}
                className={`px-2.5 py-1 text-[12px] rounded-lg transition-colors ${
                  timeframeIdx === idx ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Range sub-selector */}
        <div>
          <p className="text-[11px] text-muted mb-1.5">表示期間</p>
          <div className="flex flex-wrap gap-1">
            {currentTimeframe.ranges.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-2.5 py-1 text-[12px] rounded-lg transition-colors ${
                  range === opt.value ? "bg-primary text-white" : "bg-card text-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden border border-border" />
      </section>

      {/* Latest Prices Summary */}
      {Object.keys(latestPrices).length > 0 && (
        <section>
          <h3 className="text-sm font-medium mb-3">最新値サマリー</h3>
          <div className="grid grid-cols-2 gap-3">
            {selected.map((s) => {
              const p = latestPrices[s.symbol];
              if (!p) return null;
              return (
                <div key={s.symbol} className="bg-card rounded-xl p-3 border border-border">
                  <p className="text-[11px] text-muted mb-1">{s.symbol} — {s.name}</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[12px] tabular-nums ${p.change >= 0 ? "text-success" : "text-danger"}`}>
                    {p.change >= 0 ? "↑" : "↓"} {Math.abs(p.change).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {" "}({p.changePercent >= 0 ? "+" : ""}{p.changePercent.toFixed(2)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
