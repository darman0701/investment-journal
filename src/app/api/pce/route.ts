import { NextResponse } from "next/server";

// FRED Series IDs for PCE Price Index
const SERIES = {
  headline: "PCEPI",      // PCE Price Index (SA)
  core: "PCEPILFE",       // PCE excluding Food & Energy (SA)
  housing: "DPCERG3Q086SBEA", // not monthly — use services proxy
  food: "DFXARG3Q086SBEA",
  energy: "DPCERG3Q086SBEA",
};

// For monthly component breakdown, FRED only provides headline + core reliably.
// Components use BEA NIPA Table 2.3.7 weight approximations.
const COMPONENT_WEIGHTS = {
  housing: 0.327,
  food: 0.082,
  energy: 0.040,
  medical: 0.171,
  transport: 0.036,
  education: 0.025,
  other: 0.319,
};

interface FredObservation {
  date: string;
  value: string;
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

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  startDate: string
): Promise<Map<string, number>> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&observation_start=${startDate}&frequency=m`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`FRED API error for ${seriesId}: ${res.status}`);

  const json = await res.json();
  const map = new Map<string, number>();

  for (const obs of json.observations as FredObservation[]) {
    if (obs.value === ".") continue;
    // FRED dates are YYYY-MM-DD, convert to YYYY-MM
    const month = obs.date.slice(0, 7);
    map.set(month, parseFloat(obs.value));
  }
  return map;
}

function computeChanges(
  headlineMap: Map<string, number>,
  coreMap: Map<string, number>,
  type: "yoy" | "mom"
): MonthlyRow[] {
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

    const headlineCurr = headlineMap.get(month);
    const headlineRef = headlineMap.get(refMonth);
    const coreCurr = coreMap.get(month);
    const coreRef = coreMap.get(refMonth);

    if (headlineCurr === undefined || headlineRef === undefined || headlineRef === 0) continue;

    const headlineChange = Math.round(((headlineCurr - headlineRef) / headlineRef) * 10000) / 100;
    const coreChange = coreCurr !== undefined && coreRef !== undefined && coreRef !== 0
      ? Math.round(((coreCurr - coreRef) / coreRef) * 10000) / 100
      : 0;

    // Approximate component contributions using BEA weights
    const row: MonthlyRow = {
      month,
      headline: headlineChange,
      core: coreChange,
      housing: Math.round(headlineChange * COMPONENT_WEIGHTS.housing * 100) / 100,
      food: Math.round(headlineChange * COMPONENT_WEIGHTS.food * 100) / 100,
      energy: Math.round((headlineChange - coreChange) * 0.45 * 100) / 100,
      medical: Math.round(headlineChange * COMPONENT_WEIGHTS.medical * 100) / 100,
      transport: Math.round(headlineChange * COMPONENT_WEIGHTS.transport * 100) / 100,
      education: Math.round(headlineChange * COMPONENT_WEIGHTS.education * 100) / 100,
      other: 0,
    };
    row.other = Math.round((headlineChange - row.housing - row.food - row.energy - row.medical - row.transport - row.education) * 100) / 100;

    results.push(row);
  }

  return results;
}

// Fallback hardcoded data (last updated: 2026-02)
const FALLBACK_YOY: MonthlyRow[] = [
  { month: "2025-03", headline: 2.15, core: 2.55, housing: 0.72, food: 0.18, energy: -0.12, medical: 0.32, transport: 0.14, education: 0.10, other: 0.12 },
  { month: "2025-04", headline: 2.08, core: 2.58, housing: 0.69, food: 0.19, energy: -0.18, medical: 0.33, transport: 0.12, education: 0.09, other: 0.14 },
  { month: "2025-05", headline: 2.11, core: 2.54, housing: 0.67, food: 0.17, energy: -0.10, medical: 0.31, transport: 0.15, education: 0.10, other: 0.11 },
  { month: "2025-06", headline: 2.28, core: 2.62, housing: 0.70, food: 0.19, energy: 0.04, medical: 0.34, transport: 0.14, education: 0.08, other: 0.11 },
  { month: "2025-07", headline: 2.39, core: 2.69, housing: 0.73, food: 0.20, energy: 0.09, medical: 0.30, transport: 0.17, education: 0.11, other: 0.10 },
  { month: "2025-08", headline: 2.33, core: 2.66, housing: 0.71, food: 0.18, energy: 0.06, medical: 0.32, transport: 0.15, education: 0.09, other: 0.12 },
  { month: "2025-09", headline: 2.18, core: 2.49, housing: 0.66, food: 0.16, energy: -0.04, medical: 0.33, transport: 0.13, education: 0.10, other: 0.13 },
  { month: "2025-10", headline: 2.14, core: 2.45, housing: 0.65, food: 0.15, energy: -0.06, medical: 0.31, transport: 0.14, education: 0.11, other: 0.12 },
  { month: "2025-11", headline: 2.25, core: 2.51, housing: 0.68, food: 0.17, energy: 0.02, medical: 0.32, transport: 0.15, education: 0.09, other: 0.11 },
  { month: "2025-12", headline: 2.30, core: 2.57, housing: 0.69, food: 0.19, energy: 0.05, medical: 0.33, transport: 0.14, education: 0.10, other: 0.12 },
  { month: "2026-01", headline: 2.24, core: 2.53, housing: 0.67, food: 0.18, energy: 0.01, medical: 0.32, transport: 0.15, education: 0.11, other: 0.11 },
  { month: "2026-02", headline: 2.19, core: 2.26, housing: 0.68, food: 0.18, energy: 0.03, medical: 0.35, transport: 0.10, education: 0.18, other: 0.03 },
];

const FALLBACK_MOM: MonthlyRow[] = [
  { month: "2025-03", headline: 0.18, core: 0.22, housing: 0.08, food: 0.02, energy: -0.01, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-04", headline: 0.25, core: 0.28, housing: 0.09, food: 0.02, energy: 0.01, medical: 0.03, transport: 0.03, education: 0.01, other: 0.01 },
  { month: "2025-05", headline: 0.14, core: 0.19, housing: 0.06, food: 0.01, energy: -0.02, medical: 0.04, transport: 0.01, education: 0.01, other: 0.01 },
  { month: "2025-06", headline: 0.23, core: 0.24, housing: 0.08, food: 0.02, energy: 0.02, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-07", headline: 0.29, core: 0.26, housing: 0.10, food: 0.02, energy: 0.04, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-08", headline: 0.17, core: 0.20, housing: 0.07, food: 0.02, energy: -0.01, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-09", headline: 0.13, core: 0.18, housing: 0.06, food: 0.01, energy: -0.02, medical: 0.03, transport: 0.01, education: 0.01, other: 0.01 },
  { month: "2025-10", headline: 0.20, core: 0.22, housing: 0.08, food: 0.02, energy: 0.01, medical: 0.03, transport: 0.01, education: 0.01, other: 0.01 },
  { month: "2025-11", headline: 0.24, core: 0.25, housing: 0.09, food: 0.02, energy: 0.02, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2025-12", headline: 0.21, core: 0.23, housing: 0.08, food: 0.02, energy: 0.01, medical: 0.03, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2026-01", headline: 0.26, core: 0.28, housing: 0.09, food: 0.02, energy: 0.02, medical: 0.04, transport: 0.02, education: 0.01, other: 0.01 },
  { month: "2026-02", headline: 0.15, core: 0.19, housing: 0.07, food: 0.01, energy: -0.01, medical: 0.03, transport: 0.01, education: 0.02, other: 0.01 },
];

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    // No FRED API key — return fallback data
    return NextResponse.json({
      pceYoY: FALLBACK_YOY,
      pceMoM: FALLBACK_MOM,
      source: "Fallback (FRED_API_KEY not configured)",
      updated: null,
    });
  }

  try {
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear - 3}-01-01`;

    const [headlineMap, coreMap] = await Promise.all([
      fetchFredSeries("PCEPI", apiKey, startDate),
      fetchFredSeries("PCEPILFE", apiKey, startDate),
    ]);

    const yoy = computeChanges(headlineMap, coreMap, "yoy");
    const mom = computeChanges(headlineMap, coreMap, "mom");

    const yoyRecent = yoy.slice(-12);
    const momRecent = mom.slice(-12);

    return NextResponse.json({
      pceYoY: yoyRecent,
      pceMoM: momRecent,
      source: "Federal Reserve Economic Data (FRED)",
      updated: new Date().toISOString(),
    });
  } catch (err) {
    // On FRED failure, return fallback
    console.error("FRED API error, using fallback:", err);
    return NextResponse.json({
      pceYoY: FALLBACK_YOY,
      pceMoM: FALLBACK_MOM,
      source: "Fallback (FRED API error)",
      updated: null,
    });
  }
}
