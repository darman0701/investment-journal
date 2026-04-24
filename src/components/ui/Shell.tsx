"use client";
import { useEffect, useState, type ReactNode } from "react";
import { BookIcon, ChartIcon, HomeIcon, MoonIcon, PlusIcon, SunIcon } from "./icons";

export type MainTab = "home" | "journal" | "market";

const MAIN_TABS: { id: MainTab; label: string; Ic: (p: { size?: number }) => React.JSX.Element }[] = [
  { id: "home", label: "ホーム", Ic: HomeIcon },
  { id: "journal", label: "記録", Ic: BookIcon },
  { id: "market", label: "マーケット", Ic: ChartIcon },
];

export function BottomNav({
  tab,
  onTab,
}: {
  tab: MainTab;
  onTab: (t: MainTab) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] justify-around border-t pt-2 md:hidden"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderColor: "var(--border-soft)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 8px)",
      }}
      aria-label="メインナビゲーション"
    >
      {MAIN_TABS.map(({ id, label, Ic }) => {
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

// Desktop sidebar nav, visible at md+. Mirrors BottomNav but as a vertical rail
// with optional nested sub-tabs under the active section.
export function Sidebar({
  tab,
  onTab,
  subTabs,
  activeSub,
  onSubChange,
}: {
  tab: MainTab;
  onTab: (t: MainTab) => void;
  subTabs?: readonly string[];
  activeSub?: string;
  onSubChange?: (s: string) => void;
}) {
  return (
    <aside
      className="hidden md:flex md:flex-col shrink-0 border-r"
      style={{
        width: 248,
        background: "var(--bg)",
        borderColor: "var(--border-soft)",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
      aria-label="メインナビゲーション"
    >
      <div
        className="serif"
        style={{
          padding: "22px 24px 20px",
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        Journal
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 12px" }} className="scrollbar-none">
        {MAIN_TABS.map(({ id, label, Ic }) => {
          const active = tab === id;
          return (
            <div key={id}>
              <button
                type="button"
                onClick={() => onTab(id)}
                className="tap"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: active ? "var(--primary-soft)" : "transparent",
                  color: active ? "var(--primary)" : "var(--text)",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  textAlign: "left",
                  marginBottom: 2,
                }}
                aria-current={active ? "page" : undefined}
              >
                <Ic size={18} />
                <span>{label}</span>
              </button>
              {active && subTabs && subTabs.length > 0 && onSubChange && (
                <div style={{ padding: "4px 0 8px 30px" }}>
                  {subTabs.map((s) => {
                    const on = s === activeSub;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onSubChange(s)}
                        className="tap"
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "7px 12px",
                          fontSize: 13,
                          fontWeight: on ? 600 : 500,
                          color: on ? "var(--text)" : "var(--text-muted)",
                          borderRadius: 8,
                          borderLeft: on
                            ? "2px solid var(--primary)"
                            : "2px solid var(--border-soft)",
                          marginBottom: 1,
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>v1.0</div>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
  hideOnDesktop = false,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  hideOnDesktop?: boolean;
}) {
  return (
    <div
      className={`scrollbar-none sticky top-0 z-[8] flex shrink-0 gap-1 overflow-x-auto border-b px-4 ${
        hideOnDesktop ? "md:hidden" : ""
      }`}
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
      className="fab-btn tap fixed z-[35] flex h-14 w-14 items-center justify-center rounded-full text-white md:h-12 md:w-12"
      style={{
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
