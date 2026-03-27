import { NextRequest, NextResponse } from "next/server";

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "15m" },
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "2y": { range: "2y", interval: "1wk" },
  "5y": { range: "5y", interval: "1wk" },
  "10y": { range: "10y", interval: "1mo" },
  max: { range: "max", interval: "1mo" },
};

// Well-known tickers that don't need .T suffix
const GLOBAL_TICKERS = new Set([
  "^GSPC", "^IXIC", "^DJI", "^N225", "^HSI",
  "GC=F", "CL=F", "NG=F", "SI=F", "HG=F",
  "JPY=X", "EURUSD=X", "EURJPY=X", "DX-Y.NYB",
  "TLT", "IEF", "SHY",
  "XLE", "XLF", "XLK", "XLV", "XLB",
  "^VIX",
]);

function resolveSymbol(ticker: string, suffix: string): string {
  if (GLOBAL_TICKERS.has(ticker)) return ticker;
  if (ticker.includes("=") || ticker.startsWith("^") || ticker.includes(".")) return ticker;
  if (suffix) return `${ticker}.${suffix}`;
  return `${ticker}.T`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tickers = sp.get("tickers")?.split(",").map((t) => t.trim()) || [];
  const period = sp.get("range") || "6mo";
  const suffix = sp.get("suffix") || "";
  const explicitInterval = sp.get("interval") || "";

  if (!tickers.length) {
    return NextResponse.json({ error: "tickers required" }, { status: 400 });
  }

  const mapped = RANGE_MAP[period] || RANGE_MAP["6mo"];
  const range = mapped.range;
  const interval = explicitInterval || mapped.interval;

  // Shorter cache for intraday data
  const isIntraday = ["5m", "15m", "60m"].includes(interval);

  const results: Record<string, unknown> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const symbol = resolveSymbol(ticker, suffix);
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&events=div,split`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: isIntraday ? 60 : 300 },
        });

        if (!res.ok) { results[ticker] = null; return; }

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) { results[ticker] = null; return; }

        const meta = result.meta;
        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};
        const adjClose = result.indicators?.adjclose?.[0]?.adjclose;
        const splits = result.events?.splits || {};

        const candles = timestamps.map((t: number, i: number) => ({
          time: t,
          open: quote.open?.[i] ?? null,
          high: quote.high?.[i] ?? null,
          low: quote.low?.[i] ?? null,
          close: adjClose?.[i] ?? quote.close?.[i] ?? null,
          volume: quote.volume?.[i] ?? 0,
        })).filter((c: { close: number | null }) => c.close !== null);

        results[ticker] = {
          meta: {
            symbol: meta.symbol,
            shortName: meta.shortName || ticker,
            currency: meta.currency,
            regularMarketPrice: meta.regularMarketPrice,
            previousClose: meta.chartPreviousClose || meta.previousClose,
          },
          candles,
          splits: Object.values(splits),
        };
      } catch {
        results[ticker] = null;
      }
    })
  );

  return NextResponse.json(results);
}
