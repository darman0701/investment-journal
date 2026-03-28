import { NextRequest, NextResponse } from "next/server";

// Nikkei 225 representative + popular stocks
const JP_STOCKS = [
  "7203","6758","9984","8306","6861","7974","4063","9433","6098","8035",
  "6501","7267","4502","6367","8058","3382","9432","2914","4568","6594",
  "7741","8001","4661","6902","7751","6954","8316","9983","2802","6273",
  "4507","8411","6762","7269","3407","6752","8766","5108","4543","7911",
  "6301","3086","4911","6702","9020","9022","2413","4519","6326","7832",
];

const JP_NAMES: Record<string, string> = {
  "7203":"トヨタ自動車","6758":"ソニーグループ","9984":"ソフトバンクグループ","8306":"三菱UFJ","6861":"キーエンス",
  "7974":"任天堂","4063":"信越化学工業","9433":"KDDI","6098":"リクルートHD","8035":"東京エレクトロン",
  "6501":"日立製作所","7267":"ホンダ","4502":"武田薬品工業","6367":"ダイキン工業","8058":"三菱商事",
  "3382":"セブン&アイHD","9432":"NTT","2914":"日本たばこ産業","4568":"第一三共","6594":"日本電産",
  "7741":"HOYA","8001":"伊藤忠商事","4661":"オリエンタルランド","6902":"デンソー","7751":"キヤノン",
  "6954":"ファナック","8316":"三井住友FG","9983":"ファーストリテイリング","2802":"味の素","6273":"SMC",
  "4507":"塩野義製薬","8411":"みずほFG","6762":"TDK","7269":"スズキ","3407":"旭化成",
  "6752":"パナソニックHD","8766":"東京海上HD","5108":"ブリヂストン","4543":"テルモ","7911":"凸版印刷",
  "6301":"コマツ","3086":"J.フロント リテイリング","4911":"資生堂","6702":"富士通","9020":"JR東日本",
  "9022":"JR東海","2413":"エムスリー","4519":"中外製薬","6326":"クボタ","7832":"バンダイナムコHD",
};

interface StockData {
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
}

const PERIOD_RANGE: Record<string, { range: string; interval: string }> = {
  daily: { range: "5d", interval: "1d" },
  weekly: { range: "1mo", interval: "1d" },
  monthly: { range: "3mo", interval: "1d" },
  "3m": { range: "6mo", interval: "1d" },
  "6m": { range: "1y", interval: "1d" },
  "1y": { range: "2y", interval: "1wk" },
};

async function fetchBatch(tickers: string[], period: string = "daily"): Promise<StockData[]> {
  const results: StockData[] = [];
  const { range, interval } = PERIOD_RANGE[period] || PERIOD_RANGE.daily;

  // For longer periods, we calculate change from N days ago
  const periodDays: Record<string, number> = { daily: 1, weekly: 5, monthly: 20, "3m": 60, "6m": 120, "1y": 250 };
  const targetDays = periodDays[period] || 1;

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const symbol = `${ticker}.T`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 600 },
        });
        if (!res.ok) return;

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) return;

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        const adjclose = result.indicators?.adjclose?.[0]?.adjclose;
        const timestamps = result.timestamp || [];

        if (!timestamps.length || !quote) return;

        // Current price from meta
        const currentPrice = meta.regularMarketPrice;
        const closes = quote.close || [];
        const adjcloses = adjclose || closes;
        const lastIdx = timestamps.length - 1;

        if (!currentPrice || lastIdx < 0) return;

        // Check for stock splits - skip if split happened in the period
        const splits = result.events?.splits;
        if (splits && Object.keys(splits).length > 0) return;

        // Also check adjclose vs close divergence as split indicator
        if (adjclose && closes[lastIdx]) {
          const ratio = adjclose[lastIdx] / closes[lastIdx];
          if (Math.abs(ratio - 1) > 0.05) return;
        }

        // For daily, use chartPreviousClose. For longer periods, use close from N days back
        let basePrice: number;
        if (period === "daily") {
          basePrice = meta.chartPreviousClose || meta.previousClose;
        } else {
          // Find the close from targetDays ago
          const targetIdx = Math.max(0, lastIdx - targetDays);
          basePrice = adjcloses[targetIdx] || closes[targetIdx];
        }

        if (!basePrice) return;

        const change = currentPrice - basePrice;
        const changePercent = (change / basePrice) * 100;

        // Skip extreme outliers (likely data errors or corporate actions)
        const maxChange = period === "daily" ? 30 : period === "weekly" ? 50 : 200;
        if (Math.abs(changePercent) > maxChange) return;

        const lastVolume = quote.volume?.[lastIdx] || 0;

        results.push({
          ticker,
          name: JP_NAMES[ticker] || meta.shortName || meta.longName || ticker,
          price: Math.round(currentPrice * 10) / 10,
          prevClose: basePrice,
          change: Math.round(change * 10) / 10,
          changePercent: Math.round(changePercent * 100) / 100,
          volume: lastVolume,
        });
      } catch {
        // Skip failed tickers
      }
    })
  );

  return results;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || "gainers";
  const count = Math.min(parseInt(sp.get("count") || "20"), 50);
  const period = sp.get("period") || "daily";

  try {
    // Fetch all stocks in parallel batches
    const batchSize = 10;
    const allStocks: StockData[] = [];

    const batches: string[][] = [];
    for (let i = 0; i < JP_STOCKS.length; i += batchSize) {
      batches.push(JP_STOCKS.slice(i, i + batchSize));
    }

    const batchResults = await Promise.all(batches.map((b) => fetchBatch(b, period)));
    for (const batch of batchResults) {
      allStocks.push(...batch);
    }

    // Sort by change percent
    allStocks.sort((a, b) => {
      return type === "losers"
        ? a.changePercent - b.changePercent
        : b.changePercent - a.changePercent;
    });

    const quotes = allStocks.slice(0, count).map((s, i) => ({
      rank: i + 1,
      ticker: s.ticker,
      name: s.name,
      sector: "",
      market: "東証",
      price: s.price,
      change: s.change,
      changePercent: s.changePercent,
      volume: s.volume,
      marketCap: 0,
    }));

    return NextResponse.json({
      quotes,
      type,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      quotes: [],
      type,
      updatedAt: new Date().toISOString(),
      error: "Failed to fetch data",
    });
  }
}
