import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function HomeIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
export function BookIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
      <path d="M4 16a4 4 0 0 1 4-4h10" />
    </svg>
  );
}
export function ChartIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </svg>
  );
}
export function SearchIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
export function PlusIcon({ size = 22, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="2.2" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function ArrowUpIcon({ size = 12, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="2.4" {...p}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}
export function ArrowDownIcon({ size = 12, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="2.4" {...p}>
      <path d="M17 7L7 17M15 17H7V9" />
    </svg>
  );
}
export function ChevronIcon({ size = 14, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="2" {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function CloseIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="2" {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
export function AlertIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M12 3l10 17H2z" />
      <path d="M12 10v4M12 17v.5" />
    </svg>
  );
}
export function CalendarIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
export function ExtIcon({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M14 4h6v6M20 4L10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
export function FilterIcon({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M3 5h18l-7 9v6l-4-2v-4z" />
    </svg>
  );
}
export function MoonIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
export function SunIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
export function TrashIcon({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  );
}
export function EditIcon({ size = 16, ...p }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth="1.8" {...p}>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
