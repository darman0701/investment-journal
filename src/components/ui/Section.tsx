"use client";
import type { ReactNode } from "react";
import { ChevronIcon } from "./icons";

export function Section({
  title,
  subtitle,
  count,
  onMore,
  moreLabel = "すべて",
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  onMore?: () => void;
  moreLabel?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 4px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div
            className="serif"
            style={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}
          >
            {title}
          </div>
          {count != null && (
            <div
              className="tabular"
              style={{ fontSize: 11, color: "var(--text-faint)" }}
            >
              {count}
            </div>
          )}
          {subtitle && (
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {subtitle}
            </div>
          )}
        </div>
        {onMore && (
          <button
            type="button"
            onClick={onMore}
            style={{
              fontSize: 11.5,
              color: "var(--text-muted)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {moreLabel} <ChevronIcon size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
