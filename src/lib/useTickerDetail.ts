"use client";
import { useEffect, useState, useCallback } from "react";

// Module-level state with subscribe pattern.
// Any component can call openTicker() to show the detail overlay,
// and any component can subscribe via useTickerDetail() to re-render.

let currentTicker: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function readFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const p = new URL(window.location.href).searchParams.get("ticker");
    return p && p.trim() ? p.trim() : null;
  } catch {
    return null;
  }
}

function writeToUrl(ticker: string | null) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (ticker) {
      if (url.searchParams.get("ticker") === ticker) return;
      url.searchParams.set("ticker", ticker);
      window.history.pushState({ ticker }, "", url.toString());
    } else {
      if (!url.searchParams.has("ticker")) return;
      url.searchParams.delete("ticker");
      window.history.pushState({ ticker: null }, "", url.toString());
    }
  } catch {}
}

export function openTicker(ticker: string) {
  const t = ticker.trim();
  if (!t) return;
  currentTicker = t;
  writeToUrl(t);
  notify();
}

export function closeTicker() {
  if (currentTicker === null) return;
  currentTicker = null;
  writeToUrl(null);
  notify();
}

let popstateBound = false;
function ensurePopstateBinding() {
  if (popstateBound || typeof window === "undefined") return;
  popstateBound = true;
  window.addEventListener("popstate", () => {
    const fromUrl = readFromUrl();
    if (fromUrl !== currentTicker) {
      currentTicker = fromUrl;
      notify();
    }
  });
}

export function useTickerDetail() {
  const [ticker, setTicker] = useState<string | null>(() => {
    // Initialize from module-level state, falling back to URL for shareable links
    if (currentTicker !== null) return currentTicker;
    const fromUrl = readFromUrl();
    if (fromUrl) currentTicker = fromUrl;
    return currentTicker;
  });

  useEffect(() => {
    ensurePopstateBinding();
    const handler = () => setTicker(currentTicker);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const open = useCallback((t: string) => openTicker(t), []);
  const close = useCallback(() => closeTicker(), []);

  return { ticker, open, close };
}
