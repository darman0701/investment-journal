"use client";
import { useState } from "react";

interface Scenario {
  id: string;
  label: string;
  icon: string;
  description: string;
  positive: string[];   // 恩恵大
  slightly: string[];   // やや恩恵
  neutral: string[];    // ほぼ中立
  negative: string[];   // 逆風
  insight: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "rate_up",
    label: "金利上昇",
    icon: "📈",
    description: "FRB利上げ・インフレ期待上昇・米10年債利回り↑",
    positive: ["銀行株", "保険株", "ドル（USD）"],
    slightly: ["エネルギー株", "素材株"],
    neutral: ["生活必需品", "ヘルスケア"],
    negative: ["REIT", "公益事業", "テクノロジー", "グロース株", "金", "米長期債", "新興国株"],
    insight: "金利上昇局面では「現在のキャッシュフローが大きい資産」が強く、「遠い将来の成長期待で買われている資産」が弱い。銀行は利ザヤ拡大で例外的な恩恵。",
  },
  {
    id: "rate_down",
    label: "金利低下",
    icon: "📉",
    description: "FRB利下げ・景気減速懸念・米10年債利回り↓",
    positive: ["米長期債", "REIT", "グロース株", "金"],
    slightly: ["テクノロジー", "公益事業", "新興国株"],
    neutral: ["ヘルスケア", "生活必需品"],
    negative: ["銀行株", "保険株", "ドル（USD）"],
    insight: "金利低下は債券価格上昇と同義。長期デュレーション資産（グロース株、長期債、REIT）が恩恵を受ける。",
  },
  {
    id: "inflation",
    label: "インフレ加速",
    icon: "🔥",
    description: "CPI上昇加速・コモディティ価格高騰・賃金上昇",
    positive: ["コモディティ", "エネルギー株", "金"],
    slightly: ["素材株", "REIT", "銀行株"],
    neutral: ["ヘルスケア", "生活必需品"],
    negative: ["長期債", "テクノロジー", "グロース株", "消費財"],
    insight: "実物資産（コモディティ、不動産）がインフレヘッジとして機能。名目金利上昇で長期債は下落。",
  },
  {
    id: "disinflation",
    label: "ディスインフレ",
    icon: "🧊",
    description: "CPI鈍化・需要減退・コモディティ価格安定",
    positive: ["長期債", "グロース株", "テクノロジー"],
    slightly: ["REIT", "公益事業"],
    neutral: ["ヘルスケア", "金融"],
    negative: ["コモディティ", "エネルギー株", "素材株"],
    insight: "インフレ鈍化は利下げ期待を高め、デュレーションの長い資産に追い風。実物資産には逆風。",
  },
  {
    id: "expansion",
    label: "景気拡大",
    icon: "🚀",
    description: "GDP成長率上昇・企業業績改善・失業率低下",
    positive: ["シクリカル株", "小型株", "新興国株", "エネルギー株"],
    slightly: ["テクノロジー", "金融", "素材株", "消費財"],
    neutral: ["ヘルスケア"],
    negative: ["国債", "金", "ディフェンシブ"],
    insight: "景気拡大期は「ベータの高い資産」が最もパフォーマンスを発揮。安全資産からリスク資産へ資金が流れる。",
  },
  {
    id: "recession",
    label: "景気後退",
    icon: "📛",
    description: "GDP縮小・企業業績悪化・失業率上昇",
    positive: ["国債", "金", "公益事業", "生活必需品"],
    slightly: ["ヘルスケア", "ドル（USD）"],
    neutral: [],
    negative: ["シクリカル株", "小型株", "新興国株", "エネルギー株", "ハイイールド債"],
    insight: "リセッション時はキャッシュと安全資産が王。業績耐性の高いディフェンシブセクターが相対的に堅調。",
  },
  {
    id: "qe",
    label: "QE（量的緩和）",
    icon: "🏦",
    description: "中央銀行による資産購入・流動性供給",
    positive: ["株式全般", "REIT", "ハイイールド債", "金"],
    slightly: ["テクノロジー", "新興国株"],
    neutral: ["生活必需品"],
    negative: ["現金", "ドル（USD）", "短期国債"],
    insight: "QEは流動性を大量供給し、あらゆるリスク資産を押し上げる。「Don't fight the Fed」。",
  },
  {
    id: "qt",
    label: "QT（量的引き締め）",
    icon: "🏦❌",
    description: "中央銀行の資産縮小・流動性吸収",
    positive: ["現金", "短期国債", "ドル（USD）"],
    slightly: [],
    neutral: ["ディフェンシブ"],
    negative: ["グロース株", "REIT", "新興国株", "ハイイールド債", "暗号資産"],
    insight: "QTは流動性を吸収し、レバレッジの高い資産・投機的資産に最も影響。ボラティリティ上昇に注意。",
  },
  {
    id: "usd_strong",
    label: "ドル高",
    icon: "💵",
    description: "ドルインデックス上昇・米金利優位",
    positive: ["米国債", "ドル建て資産"],
    slightly: ["米国輸入企業"],
    neutral: ["米国内需型"],
    negative: ["新興国株", "コモディティ", "金", "米国輸出企業"],
    insight: "ドル高は新興国のドル建て債務負担を増加させ、新興国資産の下落要因。コモディティはドル建て価格が下落。",
  },
  {
    id: "usd_weak",
    label: "ドル安",
    icon: "💹",
    description: "ドルインデックス下落・米金利低下",
    positive: ["新興国株", "コモディティ", "金", "米国輸出企業"],
    slightly: ["欧州株", "日本株（ドル建て）"],
    neutral: [],
    negative: ["米国債（外国人視点）", "ドル建て現金"],
    insight: "ドル安は国際分散投資のリターンを押し上げ、新興国の資本流入を促進。",
  },
  {
    id: "oil_up",
    label: "原油高",
    icon: "🛢",
    description: "原油価格上昇・地政学リスク・OPEC減産",
    positive: ["エネルギー株", "産油国通貨", "インフレ連動債"],
    slightly: ["素材株"],
    neutral: [],
    negative: ["航空・運輸", "消費財", "化学", "新興国（輸入国）"],
    insight: "原油高はエネルギーセクターに直接恩恵だが、消費者の実質購買力を圧迫。インフレ圧力を高める。",
  },
  {
    id: "oil_down",
    label: "原油安",
    icon: "🛢📉",
    description: "原油価格下落・需要減退・OPEC増産",
    positive: ["航空・運輸", "消費財", "化学"],
    slightly: ["テクノロジー", "小売"],
    neutral: [],
    negative: ["エネルギー株", "産油国通貨", "ハイイールド（エネルギー）"],
    insight: "原油安は消費者にとっての「減税効果」。ただしデフレ懸念につながる場合はリスクオフに転じることも。",
  },
  {
    id: "risk_on",
    label: "リスクオン",
    icon: "🟢",
    description: "市場心理好転・VIX低下・信用スプレッド縮小",
    positive: ["小型株", "新興国株", "ハイイールド債", "暗号資産"],
    slightly: ["テクノロジー", "シクリカル"],
    neutral: [],
    negative: ["国債", "金", "VIXロング", "円"],
    insight: "リスクオン環境ではベータの高い資産が最も恩恵を受ける。安全資産からリスク資産への資金シフト。",
  },
  {
    id: "risk_off",
    label: "リスクオフ",
    icon: "🔴",
    description: "市場心理悪化・VIX上昇・信用スプレッド拡大",
    positive: ["国債", "金", "円", "スイスフラン", "VIXロング"],
    slightly: ["生活必需品", "公益事業"],
    neutral: [],
    negative: ["小型株", "新興国株", "ハイイールド債", "暗号資産", "エネルギー株"],
    insight: "リスクオフ時は「質への逃避」が発生。流動性と安全性が最優先される。",
  },
  {
    id: "geopolitical",
    label: "地政学リスク",
    icon: "🌍",
    description: "戦争・制裁・貿易摩擦・政変",
    positive: ["金", "国債", "防衛関連", "エネルギー（短期）"],
    slightly: ["円", "スイスフラン"],
    neutral: [],
    negative: ["当事国株", "新興国", "グローバルサプライチェーン依存企業"],
    insight: "地政学リスクの初動は安全資産へ逃避。ただし長期的影響は事象の規模と波及経路に依存。",
  },
  {
    id: "yen_strong",
    label: "円高",
    icon: "🇯🇵📈",
    description: "円高進行・輸入物価低下",
    positive: ["日本の輸入企業", "日本の消費者", "内需株"],
    slightly: ["日本国債"],
    neutral: [],
    negative: ["日本の輸出企業（トヨタ等）", "日経225", "インバウンド関連"],
    insight: "円高は輸出企業の業績を圧迫し日経平均の下押し要因。ただし輸入コスト低下で内需企業には恩恵。",
  },
  {
    id: "yen_weak",
    label: "円安",
    icon: "🇯🇵📉",
    description: "円安進行・輸出競争力向上",
    positive: ["日本の輸出企業", "日経225", "インバウンド関連"],
    slightly: ["海外売上比率の高い企業"],
    neutral: [],
    negative: ["日本の輸入企業", "食品株", "エネルギー輸入コスト"],
    insight: "円安は外需企業の業績を押し上げるが、輸入コスト増でインフレ圧力。日本株の外国人投資家にとってはリターン目減り。",
  },
];

type ViewMode = "scenario" | "asset";

const IMPACT_STYLES = {
  positive: { bg: "bg-emerald-900/40", border: "border-emerald-700/40", label: "◎ 恩恵大", labelColor: "text-emerald-400" },
  slightly: { bg: "bg-sky-900/30", border: "border-sky-700/30", label: "○ やや恩恵", labelColor: "text-sky-400" },
  neutral: { bg: "bg-zinc-800/40", border: "border-zinc-700/40", label: "△ ほぼ中立", labelColor: "text-zinc-400" },
  negative: { bg: "bg-rose-900/30", border: "border-rose-700/30", label: "× 逆風", labelColor: "text-rose-400" },
};

export default function MacroMatrix() {
  const [viewMode, setViewMode] = useState<ViewMode>("scenario");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">マクロ早見表</h3>
        <p className="text-[11px] text-muted">シナリオ→資産、または資産→シナリオの2方向で検索できます。</p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex border-b border-border text-[12px]">
        <button
          onClick={() => setViewMode("scenario")}
          className={`pb-2 px-3 transition-colors relative ${viewMode === "scenario" ? "text-foreground font-medium" : "text-muted hover:text-foreground/70"}`}
        >
          シナリオから探す
          {viewMode === "scenario" && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setViewMode("asset")}
          className={`pb-2 px-3 transition-colors relative ${viewMode === "asset" ? "text-foreground font-medium" : "text-muted hover:text-foreground/70"}`}
        >
          資産から探す
          {viewMode === "asset" && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
        </button>
      </div>

      {viewMode === "scenario" && (
        <>
          {/* Scenario Selection Grid */}
          <div className="space-y-1">
            <p className="text-[12px] font-medium mb-2">シナリオを選択</p>
            <div className="grid grid-cols-1 gap-px bg-border/30 rounded-xl overflow-hidden">
              {[
                { label: "金利", items: SCENARIOS.filter((s) => s.id.startsWith("rate")) },
                { label: "物価", items: SCENARIOS.filter((s) => ["inflation", "disinflation"].includes(s.id)) },
                { label: "景気", items: SCENARIOS.filter((s) => ["expansion", "recession"].includes(s.id)) },
                { label: "金融政策", items: SCENARIOS.filter((s) => ["qe", "qt"].includes(s.id)) },
                { label: "為替（ドル）", items: SCENARIOS.filter((s) => s.id.startsWith("usd")) },
                { label: "原油", items: SCENARIOS.filter((s) => s.id.startsWith("oil")) },
                { label: "センチメント", items: SCENARIOS.filter((s) => s.id.startsWith("risk")) },
                { label: "その他", items: SCENARIOS.filter((s) => ["geopolitical", "yen_strong", "yen_weak"].includes(s.id)) },
              ].map((group) => (
                <div key={group.label} className="flex items-stretch">
                  <div className="w-20 shrink-0 bg-surface flex items-center justify-center text-[11px] text-muted px-2">
                    {group.label}
                  </div>
                  <div className="flex-1 flex flex-wrap">
                    {group.items.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedScenario(selectedScenario === s.id ? null : s.id)}
                        className={`flex-1 min-w-[100px] px-3 py-2.5 text-[12px] text-left transition-colors ${
                          selectedScenario === s.id
                            ? "bg-primary/15 text-primary"
                            : "bg-card hover:bg-card-hover text-foreground"
                        }`}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Result */}
          {scenario ? (
            <div className="space-y-3">
              <div className="bg-surface rounded-xl border border-border p-4">
                <h4 className="text-sm font-semibold mb-1">{scenario.icon} {scenario.label}</h4>
                <p className="text-[11px] text-muted">{scenario.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["positive", "slightly", "neutral", "negative"] as const).map((level) => {
                  const items = scenario[level];
                  if (!items.length) return null;
                  const style = IMPACT_STYLES[level];
                  return (
                    <div key={level} className={`${style.bg} border ${style.border} rounded-xl p-3`}>
                      <p className={`text-[11px] font-medium mb-2 ${style.labelColor}`}>{style.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item) => (
                          <span key={item} className="px-2 py-0.5 bg-background/30 rounded text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-card/50 border border-border/50 rounded-xl p-3">
                <p className="text-[11px] text-warning">💡 {scenario.insight}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted text-[12px] bg-card/30 rounded-xl border border-border/30">
              上のボタンからシナリオを選んでください。
            </div>
          )}
        </>
      )}

      {viewMode === "asset" && (
        <AssetView />
      )}
    </div>
  );
}

// Asset-centric view: search by asset class
function AssetView() {
  const [query, setQuery] = useState("");

  // Collect all unique assets
  const assetMap = new Map<string, { positive: string[]; slightly: string[]; neutral: string[]; negative: string[] }>();

  for (const s of SCENARIOS) {
    for (const a of s.positive) {
      if (!assetMap.has(a)) assetMap.set(a, { positive: [], slightly: [], neutral: [], negative: [] });
      assetMap.get(a)!.positive.push(`${s.icon} ${s.label}`);
    }
    for (const a of s.slightly) {
      if (!assetMap.has(a)) assetMap.set(a, { positive: [], slightly: [], neutral: [], negative: [] });
      assetMap.get(a)!.slightly.push(`${s.icon} ${s.label}`);
    }
    for (const a of s.neutral) {
      if (!assetMap.has(a)) assetMap.set(a, { positive: [], slightly: [], neutral: [], negative: [] });
      assetMap.get(a)!.neutral.push(`${s.icon} ${s.label}`);
    }
    for (const a of s.negative) {
      if (!assetMap.has(a)) assetMap.set(a, { positive: [], slightly: [], neutral: [], negative: [] });
      assetMap.get(a)!.negative.push(`${s.icon} ${s.label}`);
    }
  }

  const allAssets = Array.from(assetMap.keys()).sort();
  const filtered = query
    ? allAssets.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
    : allAssets;

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="資産名で検索（例: 金, テクノロジー, 新興国）"
        className="w-full !text-[12px]"
      />

      <div className="space-y-2">
        {filtered.map((asset) => {
          const data = assetMap.get(asset)!;
          return (
            <details key={asset} className="bg-card rounded-xl border border-border overflow-hidden group">
              <summary className="px-4 py-3 cursor-pointer text-[13px] font-medium hover:bg-card-hover transition-colors flex items-center justify-between">
                {asset}
                <span className="text-[11px] text-muted">
                  {data.positive.length > 0 && <span className="text-emerald-400 mr-2">◎{data.positive.length}</span>}
                  {data.negative.length > 0 && <span className="text-rose-400">×{data.negative.length}</span>}
                </span>
              </summary>
              <div className="px-4 pb-3 space-y-2">
                {data.positive.length > 0 && (
                  <div>
                    <p className="text-[10px] text-emerald-400 mb-1">恩恵を受けるシナリオ</p>
                    <div className="flex flex-wrap gap-1">{data.positive.map((s) => <span key={s} className="px-2 py-0.5 bg-emerald-900/30 text-[11px] rounded">{s}</span>)}</div>
                  </div>
                )}
                {data.slightly.length > 0 && (
                  <div>
                    <p className="text-[10px] text-sky-400 mb-1">やや恩恵</p>
                    <div className="flex flex-wrap gap-1">{data.slightly.map((s) => <span key={s} className="px-2 py-0.5 bg-sky-900/30 text-[11px] rounded">{s}</span>)}</div>
                  </div>
                )}
                {data.negative.length > 0 && (
                  <div>
                    <p className="text-[10px] text-rose-400 mb-1">逆風となるシナリオ</p>
                    <div className="flex flex-wrap gap-1">{data.negative.map((s) => <span key={s} className="px-2 py-0.5 bg-rose-900/30 text-[11px] rounded">{s}</span>)}</div>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
