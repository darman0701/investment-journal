"use client";
import { useState } from "react";
import {
  Trade,
  Emotion,
  EMOTION_ICONS,
  Horizon,
  HORIZON_LABELS,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { CloseIcon, CalendarIcon } from "@/components/ui/icons";

interface Props {
  onClose: () => void;
  onSubmit: (trade: Trade) => void;
  initial?: Trade;
}

const SUGGESTED_TAGS = [
  "成長株",
  "高配当",
  "バリュー",
  "短期",
  "長期",
  "半導体",
  "AI",
  "自動車",
];

export default function TradeFormModal({ onClose, onSubmit, initial }: Props) {
  const [side, setSide] = useState<"buy" | "sell">(initial?.type ?? "buy");
  const [ticker, setTicker] = useState(initial?.ticker ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [qty, setQty] = useState(initial?.quantity?.toString() ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [customTag, setCustomTag] = useState("");
  const [emotion, setEmotion] = useState<Emotion | "">(initial?.emotion ?? "");
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [stop, setStop] = useState(initial?.stopLoss?.toString() ?? "");
  const [horizon, setHorizon] = useState<Horizon | "">(
    initial?.horizon ?? "long"
  );

  const total = (parseFloat(price) || 0) * (parseFloat(qty) || 0);
  const emotions: Emotion[] = [
    "confident",
    "anxious",
    "fomo",
    "calm",
    "greedy",
    "fearful",
  ];

  const save = () => {
    if (!ticker.trim() || !price || !qty) return;
    const trade: Trade = {
      id: initial?.id ?? generateId(),
      ticker: ticker.trim(),
      name: name.trim(),
      type: side,
      date,
      price: Number(price),
      quantity: Number(qty),
      tags,
      emotion: emotion || "",
      reason,
      stopLoss: stop ? Number(stop) : undefined,
      horizon: horizon || undefined,
      rating: initial?.rating,
      reviewNote: initial?.reviewNote,
      reviewDate: initial?.reviewDate,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSubmit(trade);
  };

  const input: React.CSSProperties = {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 15,
    fontFamily: "inherit",
    width: "100%",
    color: "var(--text)",
  };

  const formatDateDisplay = () => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const m = d.getMonth() + 1;
    const dd = d.getDate();
    const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${m}/${dd} (${w})`;
  };

  return (
    <div
      className="anim-sheet-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 8px) 16px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="tap"
          aria-label="閉じる"
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          <CloseIcon size={18} />
        </button>
        <div
          className="serif"
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: 0.2,
          }}
        >
          {initial ? "取引を編集" : "新しい取引"}
        </div>
        <button
          type="button"
          onClick={save}
          className="tap"
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            background: "var(--primary)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          保存
        </button>
      </div>

      <div
        className="scrollbar-none"
        style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}
      >
        <div
          style={{
            display: "flex",
            padding: 3,
            background: "var(--border-soft)",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {(
            [
              ["買う", "buy"],
              ["売る", "sell"],
            ] as const
          ).map(([label, val]) => {
            const on = side === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSide(val)}
                className="tap"
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: on
                    ? val === "buy"
                      ? "var(--primary)"
                      : "var(--text)"
                    : "transparent",
                  color: on ? "#fff" : "var(--text-muted)",
                  boxShadow: on ? "0 1px 3px rgba(45,42,38,0.15)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <Field label="ティッカー">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="7203"
            className="mono tabular"
            style={{
              ...input,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          />
        </Field>

        <Field label="銘柄名">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="トヨタ自動車"
            style={input}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="日付">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
              }}
            >
              <CalendarIcon size={16} />
              <div className="tabular" style={{ fontSize: 15, flex: 1 }}>
                {formatDateDisplay()}
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </div>
          </Field>
          <Field label="株価 (¥)">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className="tabular"
              style={{ ...input, fontWeight: 600 }}
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="株数">
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
              className="tabular"
              style={{ ...input, fontWeight: 600 }}
            />
          </Field>
          <Field label="合計金額">
            <div
              className="tabular"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--primary)",
              }}
            >
              ¥{total.toLocaleString("ja-JP")}
            </div>
          </Field>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            タグ
          </div>
          <div className="card" style={{ padding: "10px 12px" }}>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {tags.map((t) => (
                <div
                  key={t}
                  style={{
                    padding: "3px 4px 3px 10px",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    style={{ opacity: 0.7, display: "flex" }}
                    aria-label="タグを削除"
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              ))}
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTag.trim()) {
                    e.preventDefault();
                    if (!tags.includes(customTag.trim()))
                      setTags([...tags, customTag.trim()]);
                    setCustomTag("");
                  }
                }}
                placeholder="追加..."
                style={{
                  ...input,
                  flex: 1,
                  minWidth: 60,
                  fontSize: 13,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                paddingTop: 8,
                borderTop: "1px dashed var(--border)",
              }}
            >
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags([...tags, t])}
                  className="tap"
                  style={{
                    padding: "3px 8px",
                    fontSize: 11.5,
                    borderRadius: 5,
                    background: "var(--chip)",
                    color: "var(--text-muted)",
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            感情
          </div>
          <div
            className="card"
            style={{
              padding: "8px 10px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {emotions.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmotion(emotion === e ? "" : e)}
                className="tap"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  fontSize: 22,
                  background:
                    emotion === e ? "var(--primary-soft)" : "transparent",
                  border:
                    emotion === e
                      ? "1.5px solid var(--primary)"
                      : "1.5px solid transparent",
                  transition: "all 150ms",
                }}
              >
                {EMOTION_ICONS[e]}
              </button>
            ))}
          </div>
        </div>

        <Field label="理由・根拠">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="なぜこの取引をするのか..."
            style={{
              ...input,
              resize: "none",
              lineHeight: 1.6,
              fontSize: 13.5,
            }}
          />
        </Field>

        {side === "buy" && (
          <Field
            label="損切りライン (¥)"
            hint={
              stop && price
                ? `現在値から ${(
                    (1 - parseFloat(stop) / parseFloat(price)) *
                    100
                  ).toFixed(1)}% 下`
                : undefined
            }
          >
            <input
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              inputMode="decimal"
              className="tabular"
              style={{ ...input, fontWeight: 600, color: "var(--danger)" }}
            />
          </Field>
        )}

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            保有期間
          </div>
          <div
            style={{
              display: "flex",
              padding: 3,
              background: "var(--border-soft)",
              borderRadius: 10,
            }}
          >
            {(Object.keys(HORIZON_LABELS) as Horizon[]).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(horizon === h ? "" : h)}
                className="tap"
                style={{
                  flex: 1,
                  padding: "9px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  background:
                    horizon === h ? "var(--card)" : "transparent",
                  color:
                    horizon === h ? "var(--text)" : "var(--text-muted)",
                  boxShadow:
                    horizon === h
                      ? "0 1px 2px rgba(45,42,38,0.08)"
                      : "none",
                }}
              >
                {HORIZON_LABELS[h]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          fontWeight: 600,
          marginBottom: 6,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
      <div className="card" style={{ padding: "10px 12px" }}>
        {children}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 10.5,
            color: "var(--text-faint)",
            marginTop: 4,
            padding: "0 4px",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
