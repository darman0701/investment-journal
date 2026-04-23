"use client";
import { useEffect, useState } from "react";

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
}

type PriceMap = Record<string, PriceData | null>;

// Simple module-level cache + in-flight dedup per ticker set.
let cache: PriceMap = {};
const listeners = new Set<() => void>();
let inflightKey: string | null = null;
let inflightPromise: Promise<PriceMap> | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

export async function fetchPrices(tickers: string[]): Promise<PriceMap> {
  const uniq = Array.from(new Set(tickers.filter(Boolean))).sort();
  if (uniq.length === 0) return {};
  const key = uniq.join(",");

  if (inflightKey === key && inflightPromise) return inflightPromise;

  inflightKey = key;
  inflightPromise = (async () => {
    try {
      const res = await fetch(`/api/prices?tickers=${encodeURIComponent(key)}`);
      if (!res.ok) return {};
      const data = (await res.json()) as PriceMap;
      cache = { ...cache, ...data };
      notify();
      return data;
    } catch {
      return {};
    } finally {
      inflightKey = null;
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

export function usePrices(tickers: string[]) {
  const [prices, setPrices] = useState<PriceMap>(cache);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    const handler = () => setPrices({ ...cache });
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const key = Array.from(new Set(tickers.filter(Boolean))).sort().join(",");

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    fetchPrices(key.split(",")).then((data) => {
      setPrices({ ...cache, ...data });
      setLoading(false);
      setUpdatedAt(
        new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      );
    });
  }, [key]);

  return { prices, loading, updatedAt, refresh: () => fetchPrices(key.split(",")) };
}
