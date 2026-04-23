"use client";
import { useMemo, useState } from "react";
import { Trade, EMOTION_ICONS, RATING_LABELS } from "@/lib/types";
import { SearchIcon, FilterIcon, EditIcon, TrashIcon } from "@/components/ui/icons";
import { Chip, Tag } from "@/components/ui/primitives";
import { fmtDateShort } from "@/components/ui/format";

interface Props {
  trades: Trade[];
  onOpenStock: (ticker: string) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

type Filter = "すべて" | "買い" | "売り";

export default function TradesScreen({ trades, onOpenStock, onEdit, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("すべて");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = [...trades].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (filter === "買い") r = r.filter((t) => t.type === "buy");
    if (filter === "売り") r = r.filter((t) => t.type === "sell");
    if (query) {
      const q = query.toLowerCase();
      r = r.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.ticker.toLowerCase().includes(q) ||
          t.tags.some((tg) => tg.toLowerCase().includes(q))
      );
    }
    return r;
  }, [trades, query, filter]);

  return (
    <div
      className="scrollbar-none"
      style={{ flex: 1, overflowY: "auto", padding: "14px 16px 140px" }}
    >
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 12px",
          marginBottom: 10,
        }}
      >
        <SearchIcon size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="銘柄・タグで絞り込み"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["すべて", "買い", "売り"] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="tap"
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 999,
            background: "var(--chip)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FilterIcon size={13} /> 並び替え
        </button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          {trades.length === 0
            ? "まだ取引が記録されていません"
            : "条件に一致する取引はありません"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((t) => {
            const isOpen = expanded === t.id;
            return (
              <div
                key={t.id}
                className="card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="tap"
                  style={{
                    width: "100%",
                    padding: 14,
                    textAlign: "left",
                    background: "transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        padding: "3px 8px",
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        background:
                          t.type === "buy"
                            ? "var(--primary)"
                            : "var(--text-muted)",
                      }}
                    >
                      {t.type === "buy" ? "買" : "売"}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStock(t.ticker);
                      }}
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        flex: 1,
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "left",
                      }}
                    >
                      {t.name || t.ticker}
                    </button>
                    <div
                      className="tabular mono"
                      style={{ fontSize: 11, color: "var(--text-muted)" }}
                    >
                      {t.ticker}
                    </div>
                  </div>
                  <div
                    className="tabular"
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 10,
                    }}
                  >
                    <div>{fmtDateShort(t.date)}</div>
                    <div style={{ color: "var(--text)" }}>
                      ¥{t.price.toLocaleString("ja-JP")}
                    </div>
                    <div>{t.quantity}株</div>
                    <div
                      style={{
                        marginLeft: "auto",
                        color: "var(--text)",
                        fontWeight: 600,
                      }}
                    >
                      ¥{(t.price * t.quantity).toLocaleString("ja-JP")}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {t.tags.map((tg) => (
                      <Tag key={tg}>{tg}</Tag>
                    ))}
                    <div style={{ flex: 1 }} />
                    {t.rating && (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            t.rating === "excellent"
                              ? "var(--primary)"
                              : "var(--text-muted)",
                        }}
                      >
                        {RATING_LABELS[t.rating]}
                      </div>
                    )}
                    {t.emotion && (
                      <div style={{ fontSize: 16 }}>
                        {EMOTION_ICONS[t.emotion]}
                      </div>
                    )}
                  </div>
                  {isOpen && (
                    <div
                      className="anim-fade-in"
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px dashed var(--border)",
                        fontSize: 12.5,
                        lineHeight: 1.7,
                        color: "var(--text)",
                      }}
                    >
                      {t.reason && (
                        <>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              marginBottom: 4,
                              letterSpacing: 0.5,
                            }}
                          >
                            理由
                          </div>
                          <div style={{ marginBottom: 10 }}>{t.reason}</div>
                        </>
                      )}
                      {t.stopLoss && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginBottom: 10,
                          }}
                        >
                          損切りライン: ¥{t.stopLoss.toLocaleString("ja-JP")}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(t);
                          }}
                          className="tap"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            borderRadius: 8,
                            background: "var(--chip)",
                            color: "var(--text)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <EditIcon size={13} /> 編集
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("この取引を削除しますか?"))
                              onDelete(t.id);
                          }}
                          className="tap"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            borderRadius: 8,
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <TrashIcon size={13} /> 削除
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
