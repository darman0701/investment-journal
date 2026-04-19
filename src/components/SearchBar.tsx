"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Trade, WatchlistItem, Analysis, InvestmentRule } from "@/lib/types";
import { openTicker } from "@/lib/useTickerDetail";

type Group = "trade" | "watchlist" | "analysis" | "rule";

interface SearchResult {
  id: string;
  group: Group;
  ticker?: string;
  title: string;
  subtitle?: string;
  tab?: string;
}

interface Props {
  trades: Trade[];
  watchlist: WatchlistItem[];
  analyses: Analysis[];
  rules: InvestmentRule[];
  onNavigate: (tab: string) => void;
}

const GROUP_LABEL: Record<Group, string> = {
  trade: "取引",
  watchlist: "監視",
  analysis: "分析",
  rule: "規律",
};

function matches(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export default function SearchBar({ trades, watchlist, analyses, rules, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // "/" focuses the search bar, unless typing in a field already
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (!q) return [];

    const out: SearchResult[] = [];

    // Trades: grouped by ticker to avoid dozens of duplicates
    const tradeTickerMap = new Map<string, Trade>();
    for (const t of trades) {
      const hit = matches(t.ticker, q) || matches(t.name, q) || matches(t.reason, q) || t.tags.some((tag) => matches(tag, q));
      if (!hit) continue;
      const key = t.ticker;
      const existing = tradeTickerMap.get(key);
      if (!existing || new Date(t.date).getTime() > new Date(existing.date).getTime()) {
        tradeTickerMap.set(key, t);
      }
    }
    for (const t of tradeTickerMap.values()) {
      out.push({
        id: `trade-${t.ticker}`,
        group: "trade",
        ticker: t.ticker,
        title: t.name || t.ticker,
        subtitle: t.ticker,
        tab: "trades",
      });
    }

    for (const w of watchlist) {
      const hit = matches(w.ticker, q) || matches(w.name, q) || matches(w.note, q) || w.tags.some((tag) => matches(tag, q));
      if (!hit) continue;
      out.push({
        id: `watchlist-${w.id}`,
        group: "watchlist",
        ticker: w.ticker,
        title: w.name || w.ticker,
        subtitle: w.ticker,
        tab: "watchlist",
      });
    }

    for (const a of analyses) {
      const hit = matches(a.ticker, q) || matches(a.name, q) || matches(a.summary, q) || matches(a.details, q) || a.tags.some((tag) => matches(tag, q));
      if (!hit) continue;
      out.push({
        id: `analysis-${a.id}`,
        group: "analysis",
        ticker: a.ticker,
        title: a.name || a.ticker,
        subtitle: `${a.ticker} · ${a.source || "分析"}`,
        tab: "analysis",
      });
    }

    for (const r of rules) {
      if (!matches(r.rule, q)) continue;
      out.push({
        id: `rule-${r.id}`,
        group: "rule",
        title: r.rule,
        tab: "rules",
      });
    }

    return out.slice(0, 30);
  }, [query, trades, watchlist, analyses, rules]);

  const choose = useCallback((r: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (r.ticker) {
      openTicker(r.ticker);
    } else if (r.tab) {
      onNavigate(r.tab);
    }
    inputRef.current?.blur();
  }, [onNavigate]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[highlight];
      if (r) choose(r);
    }
  };

  // Group results for rendering
  const grouped: Record<Group, SearchResult[]> = { trade: [], watchlist: [], analysis: [], rule: [] };
  for (const r of results) grouped[r.group].push(r);
  const orderedGroups: Group[] = ["trade", "watchlist", "analysis", "rule"];

  // Precompute flat index for highlight tracking
  const flatIndexOf = (id: string) => results.findIndex((r) => r.id === id);

  return (
    <div ref={containerRef} className="relative w-full max-w-[240px]">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlight(0); setOpen(true); }}
          onFocus={() => { if (query) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="検索  /"
          aria-label="検索"
          className="w-full !text-[12px] !py-1.5 !pl-8 !pr-3"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-full mt-1.5 w-[min(92vw,340px)] max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-40">
          {results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[12px] text-muted">該当なし</p>
            </div>
          ) : (
            orderedGroups.map((g) => {
              const items = grouped[g];
              if (!items.length) return null;
              return (
                <div key={g} className="border-b border-border/50 last:border-0">
                  <p className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-muted">{GROUP_LABEL[g]}</p>
                  <ul>
                    {items.map((r) => {
                      const idx = flatIndexOf(r.id);
                      const active = idx === highlight;
                      return (
                        <li key={r.id}>
                          <button
                            onMouseEnter={() => setHighlight(idx)}
                            onClick={() => choose(r)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 transition-colors ${
                              active ? "bg-card-hover" : "hover:bg-card-hover/60"
                            }`}
                          >
                            <span className="text-[12px] truncate">{r.title}</span>
                            {r.subtitle && <span className="text-[10px] font-mono text-muted shrink-0">{r.subtitle}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
