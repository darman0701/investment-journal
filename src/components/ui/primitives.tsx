"use client";
import type { ReactNode, CSSProperties } from "react";
import { tickerColor } from "./format";

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap whitespace-nowrap rounded-full border text-[12.5px] font-medium"
      style={{
        padding: "6px 12px",
        background: active ? "var(--chip-active)" : "var(--chip)",
        color: active ? "var(--card)" : "var(--text-muted)",
        borderColor: active ? "transparent" : "var(--border-soft)",
      }}
    >
      {children}
    </button>
  );
}

export function Tag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "primary" | "success" | "danger";
}) {
  const styles: Record<string, { bg: string; fg: string }> = {
    default: { bg: "var(--chip)", fg: "var(--text-muted)" },
    primary: { bg: "var(--primary-soft)", fg: "var(--primary)" },
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  };
  const s = styles[tone];
  return (
    <span
      className="whitespace-nowrap rounded-md text-[11px] font-medium"
      style={{ padding: "3px 8px", background: s.bg, color: s.fg, letterSpacing: 0.1 }}
    >
      {children}
    </span>
  );
}

export function TickerLogo({
  ticker,
  size = 36,
  color,
}: {
  ticker: string;
  size?: number;
  color?: string;
}) {
  const bg = color ?? tickerColor(ticker);
  return (
    <div
      className="flex shrink-0 items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: bg,
        fontSize: size * 0.34,
        letterSpacing: -0.5,
      }}
    >
      {ticker.slice(0, 2)}
    </div>
  );
}

export function Card({
  children,
  className = "",
  style,
  onClick,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  as?: "div" | "button";
}) {
  const cls = `card ${onClick ? "tap" : ""} ${className}`;
  if (as === "button" || onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} style={{ textAlign: "left", width: "100%", ...style }}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

export function Sparkline({
  data,
  color = "var(--primary)",
  width = 60,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 2) - 1,
  ]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={area} fill={color} opacity="0.1" />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
