import { NextResponse } from "next/server";

// Fallback values used when Yahoo quoteSummary is unavailable
const FALLBACK_PE = { trailingPE: 28.1, forwardPE: 22.5, priceToBook: 5.18 };

interface SummaryMetrics {
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
}

async function fetchValuationMetrics(): Promise<SummaryMetrics> {
  try {
    const url =
      "https://query1.finance.yahoo.com/v10/finance/quoteSummary/%5EGSPC?modules=defaultKeyStatistics,summaryDetail";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return { ...FALLBACK_PE };

    const json = await res.json();
    const stats = json?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
    const detail = json?.quoteSummary?.result?.[0]?.summaryDetail;

    return {
      trailingPE: detail?.trailingPE?.raw ?? stats?.trailingPE?.raw ?? FALLBACK_PE.trailingPE,
      forwardPE: detail?.forwardPE?.raw ?? stats?.forwardPE?.raw ?? FALLBACK_PE.forwardPE,
      priceToBook: detail?.priceToBook?.raw ?? stats?.priceToBook?.raw ?? FALLBACK_PE.priceToBook,
    };
  } catch {
    return { ...FALLBACK_PE };
  }
}

export async function GET() {
  try {
    // Fetch chart history, daily change, and valuation metrics in parallel
    const [histRes, dayRes, metrics] = await Promise.all([
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=10y&interval=1mo", {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      }),
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=5d&interval=1d", {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 300 },
      }),
      fetchValuationMetrics(),
    ]);

    if (!histRes.ok) {
      return NextResponse.json({ sp500: null, peHistory: [], updatedAt: new Date().toISOString() });
    }

    const data = await histRes.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ sp500: null, peHistory: [], updatedAt: new Date().toISOString() });
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];

    // Get daily change from 5d chart
    const currentPrice = meta.regularMarketPrice || 0;
    let change = 0;
    let changePercent = 0;
    if (dayRes.ok) {
      const dayData = await dayRes.json();
      const dayResult = dayData?.chart?.result?.[0];
      if (dayResult) {
        const prevClose = dayResult.meta?.chartPreviousClose || dayResult.meta?.previousClose || 0;
        change = currentPrice - prevClose;
        changePercent = prevClose ? (change / prevClose) * 100 : 0;
      }
    }

    // Calculate 52-week high/low from last 12 months of data
    const last12 = timestamps.length >= 12 ? timestamps.length - 12 : 0;
    let fiftyTwoWeekHigh = 0;
    let fiftyTwoWeekLow = Infinity;
    for (let i = last12; i < timestamps.length; i++) {
      if (highs[i] && highs[i] > fiftyTwoWeekHigh) fiftyTwoWeekHigh = highs[i];
      if (lows[i] && lows[i] < fiftyTwoWeekLow) fiftyTwoWeekLow = lows[i];
    }

    const sp500Data = {
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      trailingPE: metrics.trailingPE ? Math.round(metrics.trailingPE * 100) / 100 : null,
      forwardPE: metrics.forwardPE ? Math.round(metrics.forwardPE * 100) / 100 : null,
      priceToBook: metrics.priceToBook ? Math.round(metrics.priceToBook * 100) / 100 : null,
      fiftyTwoWeekHigh: Math.round(fiftyTwoWeekHigh * 100) / 100,
      fiftyTwoWeekLow: Math.round(fiftyTwoWeekLow * 100) / 100,
    };

    // Build price history
    const peHistory = timestamps.map((t: number, i: number) => ({
      time: t,
      price: closes[i] ? Math.round(closes[i] * 100) / 100 : null,
    })).filter((d: { price: number | null }) => d.price !== null);

    return NextResponse.json({
      sp500: sp500Data,
      peHistory,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ sp500: null, peHistory: [], updatedAt: new Date().toISOString() });
  }
}
