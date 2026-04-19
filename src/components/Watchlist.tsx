"use client";
import { useState } from "react";
import { WatchlistItem } from "@/lib/types";
import { generateId, formatCurrency } from "@/lib/utils";
import { openTicker } from "@/lib/useTickerDetail";

interface Props {
  items: WatchlistItem[];
  onAdd: (item: WatchlistItem) => void;
  onDelete: (id: string) => void;
  onUpdate?: (item: WatchlistItem) => void;
}

const PRESET_TAGS = ["注目", "割安", "成長", "高配当", "テーマ", "短期", "長期", "ETF"];

export default function Watchlist({ items, onAdd, onDelete, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ticker: "", name: "", targetPrice: "", note: "", tags: [] as string[] });
  const [tagInput, setTagInput] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const allTags = Array.from(new Set(items.flatMap((i) => i.tags)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker) return;
    onAdd({
      id: generateId(),
      ticker: form.ticker,
      name: form.name,
      targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
      note: form.note,
      tags: form.tags,
      createdAt: new Date().toISOString(),
    });
    setForm({ ticker: "", name: "", targetPrice: "", note: "", tags: [] });
    setAdding(false);
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeFormTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const toggleItemTag = (item: WatchlistItem, tag: string) => {
    if (!onUpdate) return;
    const newTags = item.tags.includes(tag) ? item.tags.filter((t) => t !== tag) : [...item.tags, tag];
    onUpdate({ ...item, tags: newTags });
  };

  const filtered = filterTag ? items.filter((i) => i.tags.includes(filterTag)) : items;

  return (
    <div>
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          <button
            onClick={() => setFilterTag("")}
            className={`px-2.5 py-1 text-[11px] rounded-md transition ${filterTag === "" ? "bg-card-hover text-foreground" : "text-muted hover:text-foreground"}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition ${filterTag === tag ? "bg-card-hover text-foreground" : "text-muted hover:text-foreground"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 mb-4 space-y-3">
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
          <div>
            <label className="block text-[11px] text-muted mb-1">目標価格</label>
            <input type="number" value={form.targetPrice} onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))} className="w-full" />
          </div>
          <div>
            <label className="block text-[11px] text-muted mb-1">メモ</label>
            <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2} className="w-full resize-none text-[12px]" />
          </div>

          {/* Tag input */}
          <div>
            <label className="block text-[11px] text-muted mb-1">タグ</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => form.tags.includes(tag) ? removeFormTag(tag) : addTag(tag)}
                  className={`px-2 py-0.5 text-[10px] rounded-md border transition ${
                    form.tags.includes(tag)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                placeholder="カスタムタグを入力"
                className="flex-1 !text-[11px]"
              />
              <button type="button" onClick={() => addTag(tagInput)} className="px-3 py-1 text-[11px] bg-card border border-border rounded-lg hover:text-foreground text-muted">追加</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-md border border-primary/30">
                    {tag}
                    <button type="button" onClick={() => removeFormTag(tag)} className="text-primary/60 hover:text-primary">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white text-[11px] rounded-lg">追加</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-muted text-[11px]">取消</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full py-3 mb-4 border border-dashed border-border rounded-xl text-[12px] text-muted hover:border-muted hover:text-foreground transition">
          銘柄を追加
        </button>
      )}

      {filtered.length === 0 && !adding ? (
        <div className="text-center py-20"><p className="text-sm text-muted">{filterTag ? `「${filterTag}」タグの銘柄はありません` : "ウォッチリストは空です"}</p></div>
      ) : (
        <div className="space-y-px">
          {filtered.map((item) => (
            <div key={item.id} className="py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openTicker(item.ticker)}
                      className="text-[13px] font-medium hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm"
                    >
                      {item.name || item.ticker}
                    </button>
                    <span className="text-[11px] text-muted font-mono">{item.ticker}</span>
                  </div>
                  {item.targetPrice && (
                    <p className="text-[11px] text-warning mt-0.5 tabular-nums">
                      目標 {formatCurrency(item.targetPrice)}
                    </p>
                  )}
                </div>
                <button onClick={() => { if (confirm("削除？")) onDelete(item.id); }} className="text-[11px] text-muted hover:text-danger">
                  削除
                </button>
              </div>
              {item.note && <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{item.note}</p>}
              {/* Tags display + inline add */}
              <div className="flex gap-1.5 flex-wrap mt-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => toggleItemTag(item, tag)}
                    className="px-2 py-0.5 text-[10px] border border-border/60 rounded text-muted/70 cursor-pointer hover:border-danger hover:text-danger transition"
                    title="クリックで削除"
                  >
                    {tag}
                  </span>
                ))}
                {onUpdate && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) toggleItemTag(item, e.target.value); e.target.value = ""; }}
                    className="!text-[10px] !py-0 !px-1 !rounded-md !bg-transparent !border-border/40 text-muted"
                  >
                    <option value="">+タグ</option>
                    {PRESET_TAGS.filter((t) => !item.tags.includes(t)).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
