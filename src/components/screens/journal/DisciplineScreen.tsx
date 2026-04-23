"use client";
import { useState } from "react";
import { InvestmentRule } from "@/lib/types";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { generateId } from "@/lib/utils";

interface Props {
  rules: InvestmentRule[];
  onAdd: (rule: InvestmentRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DisciplineScreen({
  rules,
  onAdd,
  onToggle,
  onDelete,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAdd({
      id: generateId(),
      rule: text.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    });
    setText("");
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
          style={{ flex: 1, fontSize: 11.5, color: "var(--text-muted)" }}
        >
          自分で決めた{rules.filter((r) => r.active).length}つのルール
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
        <div className="card" style={{ padding: 14, marginBottom: 10 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例: 1銘柄の投資上限は総資産の15%"
            rows={2}
            style={{
              width: "100%",
              fontSize: 13,
              padding: "6px 10px",
              borderRadius: 8,
              background: "var(--border-soft)",
              border: "none",
              resize: "none",
              marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={submit}
              className="tap"
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                background: "var(--primary)",
                color: "#fff",
              }}
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

      {rules.length === 0 && !adding ? (
        <div
          className="card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          ルールはまだありません
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rules.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                padding: 14,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <button
                type="button"
                onClick={() => onToggle(r.id)}
                className="tap"
                aria-label={r.active ? "無効化" : "有効化"}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginTop: 6,
                  flexShrink: 0,
                  background: r.active
                    ? "var(--success)"
                    : "var(--text-faint)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: r.active ? "var(--text)" : "var(--text-muted)",
                    textDecoration: r.active ? "none" : "line-through",
                  }}
                >
                  {r.rule}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("このルールを削除しますか?")) onDelete(r.id);
                }}
                className="tap"
                aria-label="削除"
                style={{ color: "var(--text-faint)" }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
