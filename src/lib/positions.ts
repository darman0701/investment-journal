import type { Trade } from "@/lib/types";

export interface Position {
  ticker: string;
  name: string;
  avgPrice: number;
  totalQuantity: number;
  totalCost: number;
  tags: string[];
}

// Walks trades in chronological order and reduces to aggregated positions.
// Mirrors the logic in Portfolio.tsx — extracted here so all new screens share it.
export function computePositions(trades: Trade[]): Position[] {
  const positions = new Map<string, Position>();
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const t of sorted) {
    const pos = positions.get(t.ticker) || {
      ticker: t.ticker,
      name: t.name || t.ticker,
      avgPrice: 0,
      totalQuantity: 0,
      totalCost: 0,
      tags: [] as string[],
    };
    if (t.type === "buy") {
      pos.totalCost += t.price * t.quantity;
      pos.totalQuantity += t.quantity;
      pos.avgPrice = pos.totalQuantity > 0 ? pos.totalCost / pos.totalQuantity : 0;
    } else {
      pos.totalQuantity -= t.quantity;
      if (pos.totalQuantity <= 0) {
        pos.totalQuantity = 0;
        pos.totalCost = 0;
        pos.avgPrice = 0;
      } else {
        pos.totalCost = pos.avgPrice * pos.totalQuantity;
      }
    }
    pos.tags = Array.from(new Set([...pos.tags, ...t.tags]));
    if (t.name) pos.name = t.name;
    positions.set(t.ticker, pos);
  }

  return Array.from(positions.values()).filter((p) => p.totalQuantity > 0);
}
