import { NextResponse } from "next/server";

// BLS Series IDs (CPI-U, Seasonally Adjusted)
const SERIES = {
  headline: "CUSR0000SA0",
  core: "CUSR0000SA0L1E",
  housing: "CUSR0000SAH1",
  food: "CUSR0000SAF1",
  energy: "CUSR0000SA0E",
  medical: "CUSR0000SAM",
  transport: "CUSR0000SAT",
  education: "CUSR0000SAE",
};

interface BlsDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
}

interface BlsSeriesResult {
  seriesID: string;
  data: BlsDataPoint[];
}

interface MonthlyRow {
  month: string;
  headline: number;
  core: number;
  housing: number;
  food: number;
  energy: number;
  medical: number;
  transport: number;
  education: number;
  other: number;
}

function computeChanges(
  seriesData: Record<string, Map<string, number>>,
  type: "yoy" | "mom"
): MonthlyRow[] {
  const headlineMap = seriesData["headline"];
  if (!headlineMap) return [];

  // Get sorted months
  const allMonths = [...headlineMap.keys()].sort();
  const results: MonthlyRow[] = [];

  for (const month of allMonths) {
    const [y, m] = month.split("-").map(Number);
    let refMonth: string;

    if (type === "yoy") {
      refMonth = `${y - 1}-${String(m).padStart(2, "0")}`;
    } else {
      const prevM = m === 1 ? 12 : m - 1;
      const prevY = m === 1 ? y - 1 : y;
      refMonth = `${prevY}-${String(prevM).padStart(2, "0")}`;
    }

    // Check if reference month exists for all series
    const headlineRef = seriesData["headline"]?.get(refMonth);
    if (headlineRef === undefined) continue;

    const row: MonthlyRow = {
      month,
      headline: 0, core: 0, housing: 0, food: 0, energy: 0, medical: 0, transport: 0, education: 0, other: 0,
    };

    for (const key of Object.keys(SERIES) as (keyof typeof SERIES)[]) {
      const current = seriesData[key]?.get(month);
      const ref = seriesData[key]?.get(refMonth);
      if (current !== undefined && ref !== undefined && ref !== 0) {
        row[key] = Math.round(((current - ref) / ref) * 10000) / 100;
      }
    }

    // Compute "other" as headline minus known components (approximate)
    const knownSum = row.housing + row.food + row.energy + row.medical + row.transport + row.education;
    // For YoY, "other" doesn't make sense as simple subtraction of component YoY rates
    // Just set to 0 for simplicity since component rates aren't additive
    row.other = 0;

    results.push(row);
  }

  return results;
}

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 2;

    const body = {
      seriesid: Object.values(SERIES),
      startyear: String(startYear),
      endyear: String(currentYear),
    };

    const res = await fetch("https://api.bls.gov/publicAPI/v1/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 86400 }, // cache 24 hours (CPI updates monthly)
    });

    if (!res.ok) {
      return NextResponse.json({ error: "BLS API error", status: res.status }, { status: 502 });
    }

    const json = await res.json();

    if (json.status !== "REQUEST_SUCCEEDED") {
      return NextResponse.json({ error: "BLS request failed", message: json.message }, { status: 502 });
    }

    // Parse series data into maps
    const seriesData: Record<string, Map<string, number>> = {};
    const seriesIdToKey = Object.fromEntries(
      Object.entries(SERIES).map(([k, v]) => [v, k])
    );

    for (const series of json.Results?.series as BlsSeriesResult[] || []) {
      const key = seriesIdToKey[series.seriesID];
      if (!key) continue;

      const map = new Map<string, number>();
      for (const dp of series.data) {
        if (!dp.period.startsWith("M")) continue; // skip annual
        const monthNum = dp.period.replace("M", "");
        const month = `${dp.year}-${monthNum}`;
        map.set(month, parseFloat(dp.value));
      }
      seriesData[key] = map;
    }

    // Compute YoY and MoM
    const yoy = computeChanges(seriesData, "yoy");
    const mom = computeChanges(seriesData, "mom");

    // Take last 12 months
    const yoyRecent = yoy.slice(-12);
    const momRecent = mom.slice(-12);

    // Get latest raw values for context
    const headlineMap = seriesData["headline"];
    const latestMonth = headlineMap ? [...headlineMap.keys()].sort().pop() : null;

    return NextResponse.json({
      cpiYoY: yoyRecent,
      cpiMoM: momRecent,
      latestMonth,
      source: "U.S. Bureau of Labor Statistics",
      updated: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch CPI data", detail: String(err) }, { status: 500 });
  }
}
