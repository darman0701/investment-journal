import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers");
  if (!tickers) {
    return NextResponse.json({ error: "tickers parameter required" }, { status: 400 });
  }

  const symbols = tickers.split(",").map((t) => t.trim());
  const results: Record<string, { price: number; change: number; changePercent: number } | null> = {};

  await Promise.all(
    symbols.map(async (ticker) => {
      try {
        const symbol = `${ticker}.T`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
          next: { revalidate: 300 }, // cache 5 minutes
        });

        if (!res.ok) {
          results[ticker] = null;
          return;
        }

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta) {
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          const change = price - prevClose;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
          results[ticker] = {
            price: Math.round(price * 10) / 10,
            change: Math.round(change * 10) / 10,
            changePercent: Math.round(changePercent * 100) / 100,
          };
        } else {
          results[ticker] = null;
        }
      } catch {
        results[ticker] = null;
      }
    })
  );

  return NextResponse.json(results);
}
