"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { EntriesData } from "@/lib/types";

const EMPTY: EntriesData = { trades: [], watchlist: [], rules: [], analyses: [] };
const LS_KEYS = { trades: "ij-trades", watchlist: "ij-watchlist", rules: "ij-rules", analyses: "ij-analyses" } as const;

let cachedData: EntriesData | null = null;
let fetchPromise: Promise<EntriesData> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

// Migrate localStorage data to cloud on first load
function getLocalStorageData(): EntriesData | null {
  try {
    const trades = JSON.parse(localStorage.getItem(LS_KEYS.trades) || "[]");
    const watchlist = JSON.parse(localStorage.getItem(LS_KEYS.watchlist) || "[]");
    const rules = JSON.parse(localStorage.getItem(LS_KEYS.rules) || "[]");
    const analyses = JSON.parse(localStorage.getItem(LS_KEYS.analyses) || "[]");
    if (trades.length || watchlist.length || rules.length || analyses.length) {
      return { trades, watchlist, rules, analyses };
    }
  } catch {}
  return null;
}

function mergeById<T extends { id: string }>(cloud: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of cloud) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeData(cloud: EntriesData, local: EntriesData): EntriesData {
  return {
    trades: mergeById(cloud.trades as { id: string }[], local.trades as { id: string }[]) as EntriesData["trades"],
    watchlist: mergeById(cloud.watchlist as { id: string }[], local.watchlist as { id: string }[]) as EntriesData["watchlist"],
    rules: mergeById(cloud.rules as { id: string }[], local.rules as { id: string }[]) as EntriesData["rules"],
    analyses: mergeById(cloud.analyses as { id: string }[], local.analyses as { id: string }[]) as EntriesData["analyses"],
  };
}

async function loadData(): Promise<EntriesData> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      let cloud: EntriesData = res.ok ? await res.json() : EMPTY;

      // Migrate localStorage data
      const local = getLocalStorageData();
      if (local) {
        cloud = mergeData(cloud, local);
        // Save merged data to cloud
        await fetch("/api/data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cloud),
        });
        // Clear localStorage after successful migration
        Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
      }

      cachedData = cloud;
      return cloud;
    } catch {
      // Fallback to localStorage if API fails
      const local = getLocalStorageData();
      cachedData = local || EMPTY;
      return cachedData;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function saveToCloud(data: EntriesData) {
  cachedData = data;
  notify();

  // Debounce saves to avoid excessive API calls
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    fetch("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, 500);
}

export function useCloudStorage() {
  const [data, setData] = useState<EntriesData>(cachedData || EMPTY);
  const [isLoaded, setIsLoaded] = useState(!!cachedData);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setIsLoaded(true);
    });
  }, []);

  // Subscribe to changes from other hook instances
  useEffect(() => {
    const handler = () => {
      if (cachedData && cachedData !== dataRef.current) {
        setData(cachedData);
      }
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const update = useCallback((updater: (prev: EntriesData) => EntriesData) => {
    setData((prev) => {
      const next = updater(prev);
      saveToCloud(next);
      return next;
    });
  }, []);

  return { data, update, isLoaded };
}
