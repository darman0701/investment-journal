export type TradeType = "buy" | "sell";

export type Emotion = "confident" | "anxious" | "fomo" | "calm" | "greedy" | "fearful";

export const EMOTION_LABELS: Record<Emotion, string> = {
  confident: "自信あり",
  anxious: "不安",
  fomo: "乗り遅れ恐怖",
  calm: "冷静",
  greedy: "欲張り",
  fearful: "恐怖",
};

export const EMOTION_ICONS: Record<Emotion, string> = {
  confident: "💪",
  anxious: "😰",
  fomo: "🏃",
  calm: "😌",
  greedy: "🤑",
  fearful: "😱",
};

export type Rating = "excellent" | "good" | "fair" | "poor";

export const RATING_LABELS: Record<Rating, string> = {
  excellent: "◎",
  good: "○",
  fair: "△",
  poor: "×",
};

export interface Trade {
  id: string;
  ticker: string;
  name: string;
  type: TradeType;
  date: string;
  price: number;
  quantity: number;
  tags: string[];
  emotion: Emotion | "";
  reason: string;
  rating?: Rating;
  reviewNote?: string;
  reviewDate?: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  targetPrice?: number;
  note: string;
  tags: string[];
  createdAt: string;
}

export interface InvestmentRule {
  id: string;
  rule: string;
  active: boolean;
  createdAt: string;
}

export interface Analysis {
  id: string;
  ticker: string;
  name: string;
  date: string;
  summary: string;
  details: string;
  tags: string[];
  source: string;
  createdAt: string;
}

export interface EntriesData {
  trades: Trade[];
  watchlist: WatchlistItem[];
  rules: InvestmentRule[];
  analyses: Analysis[];
}
