"use client";
import { useState } from "react";
import { Analysis } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getExternalLinks } from "@/lib/edinetLinks";
import { openTicker } from "@/lib/useTickerDetail";

interface Props {
  analyses: Analysis[];
}

function parseMetricsTable(lines: string[]): { label: string; value: string }[] {
  const metrics: { label: string; value: string }[] = [];
  for (const line of lines) {
    if (!line.startsWith("│")) continue;
    const parts = line.replace(/│/g, "|").split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      metrics.push({ label: parts[0], value: parts[1] });
    }
  }
  return metrics;
}

function isWarningValue(value: string): boolean {
  return value.includes("赤字") || value.includes("無配") || value.includes("0%（無配）") || value.includes("算出不可");
}

function isGoodValue(label: string, value: string): boolean {
  if (label.includes("配当利回り") && !value.includes("0%") && !value.includes("無配")) return true;
  if (label.includes("PBR") && parseFloat(value) < 1 && parseFloat(value) > 0) return true;
  return false;
}

function renderDetails(text: string) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect metrics table block (┌...│...└)
    if (line.startsWith("┌")) {
      const tableLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith("└")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) { tableLines.push(lines[i]); i++; }

      const metrics = parseMetricsTable(tableLines);
      if (metrics.length > 0) {
        result.push(
          <div key={`metrics-${i}`} className="grid grid-cols-2 gap-px bg-border/50 rounded-lg overflow-hidden my-2">
            {metrics.map((m, j) => (
              <div key={j} className="bg-surface p-2.5 flex justify-between items-baseline">
                <span className="text-[10px] text-muted">{m.label}</span>
                <span className={`text-[12px] font-medium tabular-nums ml-2 ${
                  isWarningValue(m.value) ? "text-danger" : isGoodValue(m.label, m.value) ? "text-success" : "text-foreground"
                }`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        );
      }
      continue;
    }

    // Section headers (■)
    if (line.startsWith("■")) {
      result.push(
        <p key={i} className="mt-5 first:mt-0 mb-1.5 text-[11px] font-semibold text-primary uppercase tracking-widest">
          {line.replace("■ ", "")}
        </p>
      );
      i++;
      continue;
    }

    // Sub-headers (【】)
    if (line.includes("【") && line.includes("】")) {
      result.push(<p key={i} className="mt-3 mb-1 text-[11px] font-medium text-accent">{line}</p>);
      i++;
      continue;
    }

    // Bullet points
    if (line.startsWith("・")) {
      result.push(
        <p key={i} className="text-[12px] pl-2 leading-7 text-foreground/80 relative before:content-[''] before:absolute before:left-0 before:top-[13px] before:w-1 before:h-1 before:rounded-full before:bg-muted">
          {line.slice(1)}
        </p>
      );
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      result.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    // Regular text
    result.push(<p key={i} className="text-[12px] leading-7 text-foreground/80">{line}</p>);
    i++;
  }

  return result;
}

export default function AnalysisList({ analyses }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState("");

  const allTags = Array.from(new Set(analyses.flatMap((a) => a.tags)));
  const filtered = filterTag ? analyses.filter((a) => a.tags.includes(filterTag)) : analyses;
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (analyses.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted">分析データなし</p>
        <p className="text-[11px] text-muted/60 mt-1">Claude Code で銘柄を調べてください</p>
      </div>
    );
  }

  return (
    <div>
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

      <div className="space-y-2">
        {sorted.map((a) => {
          const open = expandedId === a.id;
          return (
            <div key={a.id} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(open ? null : a.id)}
                className="w-full px-4 py-3.5 text-left hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openTicker(a.ticker); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openTicker(a.ticker); } }}
                      className="text-[11px] font-mono font-semibold text-primary hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm"
                    >
                      {a.ticker}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openTicker(a.ticker); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openTicker(a.ticker); } }}
                      className="text-[13px] font-medium hover:text-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm"
                    >
                      {a.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted tabular-nums">{formatDate(a.date)}</span>
                </div>
                <p className="text-[11px] text-muted leading-5 mt-1">{a.summary}</p>
                <div className="flex gap-1.5 mt-2">
                  {a.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-muted/70 border border-border/60 rounded px-1.5 py-px">{tag}</span>
                  ))}
                </div>
              </button>

              {open && (
                <div className="px-4 pb-5 border-t border-border">
                  <div className="pt-3">{renderDetails(a.details)}</div>
                  {/* External Links */}
                  {(() => {
                    const links = getExternalLinks(a.ticker);
                    if (links.length === 0) return null;
                    return (
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <p className="text-[10px] text-muted mb-1.5">外部リンク</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {links.map((link) => (
                            <a
                              key={link.label}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-2 py-0.5 border border-border rounded-md text-muted hover:text-primary hover:border-primary transition"
                              title={link.description}
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="mt-3 pt-3 border-t border-border/50 flex gap-3 text-[10px] text-muted">
                    <span>{a.source}</span>
                    <span>{formatDate(a.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
