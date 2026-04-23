// Formatting helpers — match prototype signature

export function fmtYen(n: number, signed = false): string {
  const s = signed && n > 0 ? "+" : n < 0 ? "−" : "";
  return s + "¥" + Math.abs(n).toLocaleString("ja-JP");
}

export function fmtPct(n: number, signed = true): string {
  const s = signed && n > 0 ? "+" : n < 0 ? "−" : "";
  return s + Math.abs(n).toFixed(2) + "%";
}

export function fmtInt(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${m}/${day} (${w})`;
}

export function daysBetween(dateStr: string, ref: Date = new Date()): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 0;
  const ms = d.getTime() - ref.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function relativeDay(dateStr: string, ref: Date = new Date()): string {
  const n = daysBetween(dateStr, ref);
  if (n === 0) return "本日";
  if (n > 0) return `${n}日後`;
  return `${Math.abs(n)}日前`;
}

// Deterministic "sparkline" data seeded by a string — used as placeholder
// when real historical data is not available.
export function pseudoSpark(seed: string, len = 16): number[] {
  const base = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const out: number[] = [];
  let v = 50;
  for (let i = 0; i < len; i++) {
    v += Math.sin(base + i * 0.7) * 4 + Math.cos(base * i * 0.3) * 2;
    out.push(v);
  }
  return out;
}

// Deterministic disc color per ticker
const DISC_COLORS = [
  "#E8B64C",
  "#6D8BAD",
  "#8F9A5D",
  "#C15F3C",
  "#A5735A",
  "#5E8B7A",
  "#B88A5B",
  "#4A6B8A",
];
export function tickerColor(ticker: string): string {
  const n = (ticker.charCodeAt(0) || 0) + ticker.length;
  return DISC_COLORS[n % DISC_COLORS.length];
}
