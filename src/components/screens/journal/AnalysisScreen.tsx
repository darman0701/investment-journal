"use client";
import { useMemo, useState } from "react";
import { Analysis } from "@/lib/types";
import { SearchIcon, ExtIcon } from "@/components/ui/icons";
import { Chip, Tag } from "@/components/ui/primitives";

interface Props {
  analyses: Analysis[];
  onOpenStock: (ticker: string) => void;
}

export default function AnalysisScreen({ analyses, onOpenStock }: Props) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("すべて");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    analyses.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return ["すべて", ...Array.from(set)];
  }, [analyses]);

  const filtered = useMemo(() => {
    let r = [...analyses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (tag !== "すべて") r = r.filter((a) => a.tags.includes(tag));
    if (query) {
      const q = query.toLowerCase();
      r = r.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.ticker.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
      );
    }
    return r;
  }, [analyses, query, tag]);

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
          placeholder="分析ノートを検索"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
          }}
        />
      </div>
      <div
        className="scrollbar-none"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          marginBottom: 14,
          paddingBottom: 2,
        }}
      >
        {allTags.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
            {t}
          </Chip>
        ))}
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
          分析ノートはまだありません
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpenStock(a.ticker)}
              className="card tap"
              style={{ padding: 16, textAlign: "left", width: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {a.name || a.ticker}
                  </div>
                  <div
                    className="tabular mono"
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 1,
                    }}
                  >
                    {a.ticker}
                  </div>
                </div>
                <div
                  className="tabular"
                  style={{ fontSize: 11, color: "var(--text-muted)" }}
                >
                  {a.date}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "var(--text)",
                  marginBottom: 10,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {a.summary}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {a.tags.map((t) => (
                  <Tag key={t} tone="primary">
                    {t}
                  </Tag>
                ))}
                <div style={{ flex: 1 }} />
                {a.source && (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--text-faint)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ExtIcon size={11} /> {a.source}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
