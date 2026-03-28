import { NextRequest, NextResponse } from "next/server";

interface DividendEvent {
  date: string;
  amount: number;
}

interface TickerEvents {
  name: string;
  dividends: DividendEvent[];
  nextDividendMonth: number[];
  dividendNote: string;
  earningsDate: string | null;
  earningsTimestampStart: number | null;
  earningsTimestampEnd: number | null;
  fiscalYearEnd: number | null;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").map((t) => t.trim()) || [];
  if (!tickers.length) {
    return NextResponse.json({ error: "tickers required" }, { status: 400 });
  }

  const results: Record<string, TickerEvents | null> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const symbol = ticker.includes("=") || ticker.startsWith("^") || ticker.includes(".")
          ? ticker : `${ticker}.T`;

        // Fetch 2 years of data with dividend events
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1mo&events=div`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 3600 }, // cache 1 hour
        });

        if (!res.ok) { results[ticker] = null; return; }

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) { results[ticker] = null; return; }

        const meta = result.meta;
        const divEvents = result.events?.dividends || {};

        // Parse dividend history
        const dividends: DividendEvent[] = Object.values(divEvents)
          .map((d: unknown) => {
            const div = d as { date: number; amount: number };
            return {
              date: new Date(div.date * 1000).toISOString().slice(0, 10),
              amount: Math.round(div.amount * 100) / 100,
            };
          })
          .sort((a: DividendEvent, b: DividendEvent) => a.date.localeCompare(b.date));

        // Detect dividend months from history
        const divMonths = [...new Set(dividends.map((d) => new Date(d.date).getMonth() + 1))].sort((a, b) => a - b);

        // Build dividend note
        let dividendNote = "";
        if (dividends.length === 0) {
          dividendNote = "配当実績なし（無配の可能性）";
        } else {
          const latest = dividends[dividends.length - 1];
          const frequency = divMonths.length;
          dividendNote = `年${frequency}回 / 直近 ${latest.amount}円（${latest.date}）`;
        }

        // Earnings dates from meta
        const earningsStart = meta.earningsTimestampStart || null;
        const earningsEnd = meta.earningsTimestampEnd || null;
        let earningsDate: string | null = null;
        if (earningsStart) {
          earningsDate = new Date(earningsStart * 1000).toISOString().slice(0, 10);
        }

        results[ticker] = {
          name: meta.shortName || meta.longName || ticker,
          dividends,
          nextDividendMonth: divMonths,
          dividendNote,
          earningsDate,
          earningsTimestampStart: earningsStart,
          earningsTimestampEnd: earningsEnd,
          fiscalYearEnd: meta.fiscalYearEnd || null,
        };
      } catch {
        results[ticker] = null;
      }
    })
  );

  return NextResponse.json(results);
}
