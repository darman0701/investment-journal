"use client";
import { useMemo, useState } from "react";
import { WatchlistItem } from "@/lib/types";
import { usePrices } from "@/lib/usePrices";
import { Tag } from "@/components/ui/primitives";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { generateId } from "@/lib/utils";

interface Props {
  items: WatchlistItem[];
  onOpenStock: (ticker: string) => void;
  onAdd: (item: WatchlistItem) => void;
  onDelete: (id: string) => void;
}

export default function WatchScreen({ items, onOpenStock, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    ticker: "",
    name: "",
    targetPrice: "",
    note: "",
  });
  const tickers = useMemo(() => items.map((w) => w.ticker), [items]);
  const { prices } = usePrices(tickers);

  const withProgress = items.map((w) => {
    const price = prices[w.ticker]?.price;
    const progress =
      w.targetPrice && price
        ? Math.min(100, Math.round((price / w.targetPrice) * 100))
        : null;
    return { ...w, currentPrice: price, progress };
  });

  const avg =
    withProgress.filter((w) => w.progress != null).length > 0
      ? Math.round(
          withProgress
            .filter((w) => w.progress != null)
            .reduce((s, w) => s + (w.progress || 0), 0) /
            withProgress.filter((w) => w.progress != null).length
        )
      : null;

  const submit = () => {
    if (!form.ticker.trim()) return;
    onAdd({
      id: generateId(),
      ticker: form.ticker.trim(),
      name: form.name.trim(),
      targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
      note: form.note,
      tags: [],
      createdAt: new Date().toISOString(),
    });
    setForm({ ticker: "", name: "", targetPrice: "", note: "" });
    setAdding(false);
  };

  return (
    <div
      className="scrollbar-none"
      style={{ flex: 1, overflowY: "auto", padding: "14px 16px 140px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "0 4px",
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: 11.5,
            color: "var(--text-muted)",
          }}
        >
          {items.length}銘柄を監視中
          {avg != null && (
            <>
              {" · 平均到達度 "}
              <span
                style={{ color: "var(--text)", fontWeight: 600 }}
                className="tabular"
              >
                {avg}%
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "5px 10px",
            borderRadius: 999,
            background: "var(--primary-soft)",
            color: "var(--primary)",
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          <PlusIcon size={13} /> 追加
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 8 }}>
            <input
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder="コード"
              style={{ fontSize: 13, padding: "6px 10px", borderRadius: 8, background: "var(--border-soft)", border: "none" }}
            />
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="銘柄名"
              style={{ fontSize: 13, padding: "6px 10px", borderRadius: 8, background: "var(--border-soft)", border: "none" }}
            />
          </div>
          <input
            value={form.targetPrice}
            onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))}
            placeholder="目標価格 (任意)"
            type="number"
            style={{ width: "100%", fontSize: 13, padding: "6px 10px", borderRadius: 8, background: "var(--border-soft)", border: "none", marginBottom: 8 }}
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="メモ"
            rows={2}
            style={{ width: "100%", fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "var(--border-soft)", border: "none", resize: "none", marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={submit}
              className="tap"
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, borderRadius: 8, background: "var(--primary)", color: "#fff" }}
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              style={{ padding: "8px 14px", fontSize: 12, color: "var(--text-muted)" }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div
          className="card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          まだ監視銘柄はありません
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {withProgress.map((w) => (
            <div
              key={w.id}
              className="card"
              style={{ padding: 16 }}
            >
              <button
                type="button"
                onClick={() => onOpenStock(w.ticker)}
                className="tap"
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                      {w.name || w.ticker}
                    </div>
                    <div
                      className="tabular mono"
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 1,
                      }}
                    >
                      {w.ticker}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {w.currentPrice != null && (
                      <div
                        className="tabular"
                        style={{ fontSize: 14, fontWeight: 600 }}
                      >
                        ¥{Math.round(w.currentPrice).toLocaleString("ja-JP")}
                      </div>
                    )}
                    {w.targetPrice && (
                      <div
                        className="tabular"
                        style={{
                          fontSize: 10.5,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        目標 ¥{w.targetPrice.toLocaleString("ja-JP")}
                      </div>
                    )}
                  </div>
                </div>
                {w.progress != null && (
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10.5,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      <span>到達度</span>
                      <span
                        className="tabular"
                        style={{
                          color:
                            w.progress > 80
                              ? "var(--primary)"
                              : "var(--text)",
                          fontWeight: 600,
                        }}
                      >
                        {w.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "var(--border-soft)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${w.progress}%`,
                          height: "100%",
                          background:
                            w.progress > 80
                              ? "var(--primary)"
                              : "var(--text-muted)",
                          borderRadius: 3,
                          transition: "width 400ms",
                        }}
                      />
                    </div>
                  </div>
                )}
                {w.note && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {w.note}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  {w.tags.map((t) => (
                    <Tag key={t} tone="primary">
                      {t}
                    </Tag>
                  ))}
                  <div style={{ flex: 1 }} />
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("この監視銘柄を削除しますか?")) onDelete(w.id);
                }}
                className="tap"
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--text-faint)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <TrashIcon size={12} /> 削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
