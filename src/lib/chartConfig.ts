// Ticker presets for quick selection
interface TickerPresetItem { symbol: string; name: string; suffix?: string }
interface TickerPresetGroup { label: string; items: TickerPresetItem[] }
export const TICKER_PRESETS: Record<string, TickerPresetGroup> = {
  indices: {
    label: "株価指数",
    items: [
      { symbol: "^GSPC", name: "S&P500" },
      { symbol: "^IXIC", name: "NASDAQ総合" },
      { symbol: "^DJI", name: "ダウ平均" },
      { symbol: "^N225", name: "日経225" },
      { symbol: "1306", name: "TOPIX（ETF）", suffix: "T" },
      { symbol: "2516", name: "東証グロース250（ETF）", suffix: "T" },
      { symbol: "^HSI", name: "香港ハンセン" },
      { symbol: "^VIX", name: "VIX（恐怖指数）" },
    ],
  },
  fx: {
    label: "為替",
    items: [
      { symbol: "JPY=X", name: "ドル円" },
      { symbol: "EURUSD=X", name: "ユーロドル" },
      { symbol: "EURJPY=X", name: "ユーロ円" },
      { symbol: "DX-Y.NYB", name: "ドル指数(DXY)" },
    ],
  },
  commodities: {
    label: "コモディティ",
    items: [
      { symbol: "GC=F", name: "金（先物）" },
      { symbol: "CL=F", name: "WTI原油（先物）" },
      { symbol: "NG=F", name: "天然ガス（先物）" },
      { symbol: "SI=F", name: "銀（先物）" },
      { symbol: "HG=F", name: "銅（先物）" },
    ],
  },
  bonds: {
    label: "債券ETF",
    items: [
      { symbol: "TLT", name: "米20年超国債ETF" },
      { symbol: "IEF", name: "米7-10年国債ETF" },
      { symbol: "SHY", name: "米1-3年国債ETF" },
    ],
  },
  sectors: {
    label: "セクターETF",
    items: [
      { symbol: "XLE", name: "エネルギーETF" },
      { symbol: "XLF", name: "金融ETF" },
      { symbol: "XLK", name: "テクノロジーETF" },
      { symbol: "XLV", name: "ヘルスケアETF" },
      { symbol: "XLB", name: "素材ETF" },
    ],
  },
};

export const RANGE_OPTIONS = [
  { value: "1d", label: "1日" },
  { value: "5d", label: "5日" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
  { value: "10y", label: "10Y" },
  { value: "max", label: "MAX" },
];

// Timeframe (足種) options — primary selector for candle interval
export interface TimeframeOption {
  label: string;
  interval: string;
  ranges: { value: string; label: string }[];
  defaultRange: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: "5分足", interval: "5m", defaultRange: "1d", ranges: [
    { value: "1d", label: "1日" },
    { value: "5d", label: "5日" },
  ]},
  { label: "15分足", interval: "15m", defaultRange: "5d", ranges: [
    { value: "1d", label: "1日" },
    { value: "5d", label: "5日" },
  ]},
  { label: "1時間足", interval: "60m", defaultRange: "5d", ranges: [
    { value: "5d", label: "5日" },
    { value: "1mo", label: "1ヶ月" },
  ]},
  { label: "日足", interval: "1d", defaultRange: "6mo", ranges: [
    { value: "1mo", label: "1M" },
    { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "2y", label: "2Y" },
  ]},
  { label: "週足", interval: "1wk", defaultRange: "2y", ranges: [
    { value: "1y", label: "1Y" },
    { value: "2y", label: "2Y" },
    { value: "5y", label: "5Y" },
  ]},
  { label: "月足", interval: "1mo", defaultRange: "10y", ranges: [
    { value: "5y", label: "5Y" },
    { value: "10y", label: "10Y" },
    { value: "max", label: "MAX" },
  ]},
];

export const MA_OPTIONS = [
  { value: 5, label: "5日" },
  { value: 25, label: "25日" },
  { value: 50, label: "50日" },
  { value: 75, label: "75日" },
  { value: 200, label: "200日" },
];

export const MA_COLORS = ["#f59e0b", "#6366f1", "#10b981", "#f43f5e", "#a78bfa"];
