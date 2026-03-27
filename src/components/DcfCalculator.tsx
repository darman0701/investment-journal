"use client";
import { useState, useMemo } from "react";

interface DcfInputs {
  currentRevenue: number;     // 億円
  revenueGrowth: number;      // %
  operatingMargin: number;    // %
  taxRate: number;            // %
  wacc: number;               // %
  terminalGrowth: number;     // %
  projectionYears: number;
  sharesOutstanding: number;  // 百万株
  netDebt: number;            // 億円
  currentPrice: number;       // 円
}

const DEFAULTS: DcfInputs = {
  currentRevenue: 500,
  revenueGrowth: 5,
  operatingMargin: 10,
  taxRate: 30,
  wacc: 7,
  terminalGrowth: 1,
  projectionYears: 5,
  sharesOutstanding: 100,
  netDebt: 0,
  currentPrice: 0,
};

function calcDcf(inputs: DcfInputs) {
  const {
    currentRevenue, revenueGrowth, operatingMargin, taxRate,
    wacc, terminalGrowth, projectionYears, sharesOutstanding, netDebt,
  } = inputs;

  const waccDecimal = wacc / 100;
  const growthDecimal = revenueGrowth / 100;
  const marginDecimal = operatingMargin / 100;
  const taxDecimal = taxRate / 100;
  const termGrowthDecimal = terminalGrowth / 100;

  const projections: { year: number; revenue: number; fcf: number; pvFcf: number }[] = [];
  let totalPV = 0;

  for (let i = 1; i <= projectionYears; i++) {
    const revenue = currentRevenue * Math.pow(1 + growthDecimal, i);
    const fcf = revenue * marginDecimal * (1 - taxDecimal);
    const pvFcf = fcf / Math.pow(1 + waccDecimal, i);
    totalPV += pvFcf;
    projections.push({ year: i, revenue: Math.round(revenue * 10) / 10, fcf: Math.round(fcf * 10) / 10, pvFcf: Math.round(pvFcf * 10) / 10 });
  }

  const lastFcf = projections[projections.length - 1]?.fcf || 0;
  const terminalValue = waccDecimal > termGrowthDecimal
    ? (lastFcf * (1 + termGrowthDecimal)) / (waccDecimal - termGrowthDecimal)
    : 0;
  const pvTerminal = terminalValue / Math.pow(1 + waccDecimal, projectionYears);

  const enterpriseValue = totalPV + pvTerminal;
  const equityValue = enterpriseValue - netDebt; // 億円
  const intrinsicPerShare = sharesOutstanding > 0
    ? (equityValue * 100000000) / (sharesOutstanding * 1000000)  // 億円→円 / 百万株→株
    : 0;

  return { projections, totalPV, terminalValue, pvTerminal, enterpriseValue, equityValue, intrinsicPerShare: Math.round(intrinsicPerShare) };
}

function calcSensitivity(inputs: DcfInputs): number[][] {
  const waccRange = [-2, -1, 0, 1, 2].map((d) => inputs.wacc + d);
  const tgRange = [-0.5, -0.25, 0, 0.25, 0.5].map((d) => inputs.terminalGrowth + d);

  return waccRange.map((w) =>
    tgRange.map((tg) => {
      if (w / 100 <= tg / 100) return 0;
      return calcDcf({ ...inputs, wacc: w, terminalGrowth: tg }).intrinsicPerShare;
    })
  );
}

export default function DcfCalculator() {
  const [inputs, setInputs] = useState<DcfInputs>(DEFAULTS);
  const [showSensitivity, setShowSensitivity] = useState(false);

  const result = useMemo(() => calcDcf(inputs), [inputs]);
  const sensitivity = useMemo(() => showSensitivity ? calcSensitivity(inputs) : null, [inputs, showSensitivity]);

  const upside = inputs.currentPrice > 0
    ? ((result.intrinsicPerShare - inputs.currentPrice) / inputs.currentPrice) * 100
    : null;

  const update = (key: keyof DcfInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const waccRange = [-2, -1, 0, 1, 2].map((d) => inputs.wacc + d);
  const tgRange = [-0.5, -0.25, 0, 0.25, 0.5].map((d) => inputs.terminalGrowth + d);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">DCF バリュエーション</h3>
        <p className="text-[11px] text-muted">割引キャッシュフロー法による理論株価の算出。日本国債利回り（約1%）をベースにしたWACC設定推奨。</p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InputField label="現在の売上高（億円）" value={inputs.currentRevenue} onChange={(v) => update("currentRevenue", v)} />
        <InputField label="売上成長率（%）" value={inputs.revenueGrowth} onChange={(v) => update("revenueGrowth", v)} step={0.5} />
        <InputField label="営業利益率（%）" value={inputs.operatingMargin} onChange={(v) => update("operatingMargin", v)} step={0.5} />
        <InputField label="実効税率（%）" value={inputs.taxRate} onChange={(v) => update("taxRate", v)} />
        <InputField label="WACC（%）" value={inputs.wacc} onChange={(v) => update("wacc", v)} step={0.5} />
        <InputField label="永続成長率（%）" value={inputs.terminalGrowth} onChange={(v) => update("terminalGrowth", v)} step={0.25} />
        <InputField label="予測期間（年）" value={inputs.projectionYears} onChange={(v) => update("projectionYears", v)} min={1} max={15} step={1} />
        <InputField label="発行済株数（百万株）" value={inputs.sharesOutstanding} onChange={(v) => update("sharesOutstanding", v)} />
        <InputField label="純有利子負債（億円）" value={inputs.netDebt} onChange={(v) => update("netDebt", v)} />
        <InputField label="現在の株価（円）" value={inputs.currentPrice} onChange={(v) => update("currentPrice", v)} step={1} />
      </div>

      {/* Result */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-muted">理論株価</p>
            <p className="text-2xl font-bold tabular-nums">{result.intrinsicPerShare > 0 ? `¥${result.intrinsicPerShare.toLocaleString()}` : "-"}</p>
          </div>
          {upside !== null && (
            <div>
              <p className="text-[10px] text-muted">アップサイド</p>
              <p className={`text-2xl font-bold tabular-nums ${upside >= 0 ? "text-success" : "text-danger"}`}>
                {upside >= 0 ? "+" : ""}{upside.toFixed(1)}%
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted">企業価値（億円）</p>
            <p className="text-lg font-semibold tabular-nums">{result.enterpriseValue.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">株主価値（億円）</p>
            <p className="text-lg font-semibold tabular-nums">{result.equityValue.toFixed(0)}</p>
          </div>
        </div>

        {inputs.currentPrice > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="h-2 bg-surface rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${upside !== null && upside >= 0 ? "bg-success" : "bg-danger"}`}
                style={{ width: `${Math.min(Math.max((result.intrinsicPerShare / (inputs.currentPrice * 2)) * 100, 5), 100)}%` }}
              />
              <div
                className="absolute top-0 w-0.5 h-full bg-foreground"
                style={{ left: `${Math.min((inputs.currentPrice / (inputs.currentPrice * 2)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>¥0</span>
              <span>現在 ¥{inputs.currentPrice.toLocaleString()}</span>
              <span>¥{(inputs.currentPrice * 2).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* FCF Projections Table */}
      <div>
        <h4 className="text-[13px] font-medium mb-2">キャッシュフロー予測</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-1.5 px-2 text-left font-medium">年</th>
                <th className="py-1.5 px-2 text-right font-medium">売上高</th>
                <th className="py-1.5 px-2 text-right font-medium">FCF</th>
                <th className="py-1.5 px-2 text-right font-medium">PV(FCF)</th>
              </tr>
            </thead>
            <tbody>
              {result.projections.map((p) => (
                <tr key={p.year} className="border-b border-border/30">
                  <td className="py-1.5 px-2 tabular-nums">{p.year}年目</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{p.revenue.toLocaleString()}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{p.fcf.toLocaleString()}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{p.pvFcf.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-b border-border/30 text-muted">
                <td className="py-1.5 px-2">ターミナル</td>
                <td className="py-1.5 px-2 text-right">-</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{Math.round(result.terminalValue).toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{Math.round(result.pvTerminal).toLocaleString()}</td>
              </tr>
              <tr className="font-medium">
                <td className="py-1.5 px-2">合計</td>
                <td className="py-1.5 px-2 text-right">-</td>
                <td className="py-1.5 px-2 text-right">-</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{Math.round(result.totalPV + result.pvTerminal).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity */}
      <div>
        <button
          onClick={() => setShowSensitivity(!showSensitivity)}
          className="text-[12px] text-primary hover:text-primary-hover transition"
        >
          {showSensitivity ? "▼ 感度分析を閉じる" : "▶ 感度分析（WACC × 永続成長率）"}
        </button>

        {showSensitivity && sensitivity && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="py-1.5 px-1.5 text-left text-muted font-medium">WACC ＼ 永続成長</th>
                  {tgRange.map((tg) => (
                    <th key={tg} className={`py-1.5 px-1.5 text-center font-medium ${tg === inputs.terminalGrowth ? "text-primary" : "text-muted"}`}>
                      {tg.toFixed(2)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivity.map((row, ri) => (
                  <tr key={ri} className="border-t border-border/30">
                    <td className={`py-1.5 px-1.5 font-medium ${waccRange[ri] === inputs.wacc ? "text-primary" : "text-muted"}`}>
                      {waccRange[ri].toFixed(1)}%
                    </td>
                    {row.map((val, ci) => {
                      const isCurrent = waccRange[ri] === inputs.wacc && tgRange[ci] === inputs.terminalGrowth;
                      const pctDiff = inputs.currentPrice > 0 ? ((val - inputs.currentPrice) / inputs.currentPrice) * 100 : null;
                      return (
                        <td
                          key={ci}
                          className={`py-1.5 px-1.5 text-center tabular-nums ${
                            isCurrent ? "bg-primary/20 font-bold" : ""
                          } ${val === 0 ? "text-muted" : pctDiff !== null ? (pctDiff >= 0 ? "text-success" : "text-danger") : ""}`}
                        >
                          {val > 0 ? `¥${val.toLocaleString()}` : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Japan Context */}
      <div className="bg-surface rounded-lg border border-border p-3 text-[11px] text-muted space-y-1">
        <p className="font-medium text-foreground/70">日本市場の参考値</p>
        <p>・リスクフリーレート（10年国債）: 約1.0%</p>
        <p>・エクイティリスクプレミアム: 5-7%</p>
        <p>・一般的なWACC: 6-9%</p>
        <p>・実効税率: 約30%</p>
        <p>・PBR1倍割れ: 東証が改善要請中。純資産以下の企業価値は市場評価の低さを示す</p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, step = 1, min, max }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        max={max}
        className="w-full !text-[12px] !py-1.5 !px-2 tabular-nums"
      />
    </div>
  );
}
