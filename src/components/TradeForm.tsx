"use client";
import { useState } from "react";
import { Trade, Emotion, EMOTION_LABELS } from "@/lib/types";
import { generateId } from "@/lib/utils";

const DEFAULT_TAGS = ["成長株", "高配当", "バリュー", "短期", "IPO", "ETF", "INDEX"];

interface Props {
  onSubmit: (trade: Trade) => void;
  onCancel: () => void;
  initial?: Trade;
}

export default function TradeForm({ onSubmit, onCancel, initial }: Props) {
  const [form, setForm] = useState({
    ticker: initial?.ticker ?? "", name: initial?.name ?? "",
    type: initial?.type ?? "buy" as "buy" | "sell",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    price: initial?.price?.toString() ?? "", quantity: initial?.quantity?.toString() ?? "",
    tags: initial?.tags ?? [] as string[], emotion: (initial?.emotion ?? "") as Emotion | "",
    reason: initial?.reason ?? "", customTag: "",
  });

  const toggleTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));

  const addCustomTag = () => {
    const tag = form.customTag.trim();
    if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag], customTag: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker || !form.price || !form.quantity) return;
    onSubmit({
      id: initial?.id ?? generateId(), ticker: form.ticker, name: form.name,
      type: form.type, date: form.date, price: Number(form.price), quantity: Number(form.quantity),
      tags: form.tags, emotion: form.emotion, reason: form.reason,
      rating: initial?.rating, reviewNote: initial?.reviewNote, reviewDate: initial?.reviewDate,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-muted mb-1">コード</label>
          <input value={form.ticker} onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))} placeholder="7203" className="w-full" required />
        </div>
        <div>
          <label className="block text-[11px] text-muted mb-1">銘柄名</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="トヨタ" className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-muted mb-1">売買</label>
          <div className="flex gap-1">
            {(["buy", "sell"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition ${
                  form.type === t
                    ? t === "buy" ? "bg-success/15 text-success border border-success/30" : "bg-danger/15 text-danger border border-danger/30"
                    : "bg-surface text-muted border border-border"
                }`}
              >
                {t === "buy" ? "買" : "売"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-muted mb-1">価格</label>
          <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full" required />
        </div>
        <div>
          <label className="block text-[11px] text-muted mb-1">数量</label>
          <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="w-full" required />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-muted mb-1">日付</label>
        <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full" />
      </div>

      <div>
        <label className="block text-[11px] text-muted mb-1.5">タグ</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {DEFAULT_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-md text-[10px] transition ${
                form.tags.includes(tag) ? "bg-primary/15 text-primary border border-primary/30" : "text-muted border border-border hover:border-muted"
              }`}
            >{tag}</button>
          ))}
          {form.tags.filter((t) => !DEFAULT_TAGS.includes(t)).map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className="px-2.5 py-1 rounded-md text-[10px] bg-primary/15 text-primary border border-primary/30">
              {tag} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={form.customTag} onChange={(e) => setForm((f) => ({ ...f, customTag: e.target.value }))} placeholder="カスタム" className="flex-1 text-[11px]"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }} />
          <button type="button" onClick={addCustomTag} className="px-3 py-1.5 text-[11px] text-muted border border-border rounded-lg">+</button>
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-muted mb-1.5">心理</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(EMOTION_LABELS) as Emotion[]).map((e) => (
            <button key={e} type="button" onClick={() => setForm((f) => ({ ...f, emotion: f.emotion === e ? "" : e }))}
              className={`px-2.5 py-1 rounded-md text-[10px] transition ${
                form.emotion === e ? "bg-warning/15 text-warning border border-warning/30" : "text-muted border border-border"
              }`}
            >{EMOTION_LABELS[e]}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-muted mb-1">理由</label>
        <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="投資判断の根拠" rows={3} className="w-full resize-none text-[12px]" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-[12px] font-medium rounded-xl transition-all active:scale-[0.98]">
          {initial ? "更新" : "記録"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-muted text-[12px] rounded-xl hover:bg-card transition">取消</button>
      </div>
    </form>
  );
}
