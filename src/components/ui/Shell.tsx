"use client";
import { useEffect, useState, type ReactNode } from "react";
import { BookIcon, ChartIcon, HomeIcon, MoonIcon, PlusIcon, SunIcon } from "./icons";

export type MainTab = "home" | "journal" | "market";

export function BottomNav({
  tab,
  onTab,
}: {
  tab: MainTab;
  onTab: (t: MainTab) => void;
}) {
  const tabs: { id: MainTab; label: string; Ic: (p: { size?: number }) => React.JSX.Element }[] = [
    { id: "home", label: "ホーム", Ic: HomeIcon },
    { id: "journal", label: "記録", Ic: BookIcon },
    { id: "market", label: "マーケット", Ic: ChartIcon },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] justify-around border-t pt-2"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderColor: "var(--border-soft)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 8px)",
      }}
      aria-label="メインナビゲーション"
    >
      {tabs.map(({ id, label, Ic }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className="tap flex min-w-[72px] flex-col items-center gap-[3px] px-4 py-1"
            style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
            aria-current={active ? "page" : undefined}
          >
            <Ic size={22} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: active ? 600 : 500,
                letterSpacing: 0.3,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div
      className="scrollbar-none sticky top-0 z-[8] flex shrink-0 gap-1 overflow-x-auto border-b px-4"
      style={{
        background: "var(--bg)",
        borderColor: "var(--border-soft)",
      }}
    >
      {tabs.map((t) => {
        const on = t === active;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="shrink-0 whitespace-nowrap px-[10px] py-[14px] text-[14px]"
            style={{
              fontWeight: on ? 600 : 500,
              color: on ? "var(--text)" : "var(--text-muted)",
              borderBottom: on ? "2px solid var(--primary)" : "2px solid transparent",
              transition: "color 200ms",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="新しい取引を記録"
      className="tap fixed z-[35] flex h-14 w-14 items-center justify-center rounded-full text-white"
      style={{
        right: "max(18px, calc((100vw - 480px)/2 + 18px))",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
        background: "var(--primary)",
        boxShadow:
          "0 10px 24px rgba(193,95,60,0.35), 0 2px 6px rgba(193,95,60,0.25)",
      }}
    >
      <PlusIcon size={24} />
    </button>
  );
}

// Respects prefers-color-scheme on first load, then follows user toggle.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("ij-theme") : null;
    const prefer = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : !!prefer;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("ij-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "ライトモードに切替" : "ダークモードに切替"}
      className="tap flex h-9 w-9 items-center justify-center rounded-full"
      style={{ color: "var(--text-muted)" }}
    >
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}

// Sticky header with scroll shadow
export function StickyHeader({ children, scrolled }: { children: ReactNode; scrolled: boolean }) {
  return (
    <header
      className={`app-header sticky top-0 z-[9] flex items-center justify-between px-5 transition-all duration-200 ${
        scrolled ? "scrolled" : ""
      }`}
      style={{
        padding: "8px 20px 10px",
        background: "var(--bg)",
        borderBottom: "1px solid transparent",
      }}
    >
      {children}
    </header>
  );
}

export function useScrollShadow() {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrolled(e.currentTarget.scrollTop > 4);
  };
  return [scrolled, onScroll] as const;
}
