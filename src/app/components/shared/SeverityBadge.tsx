// ─────────────────────────────────────────────────────────────────────────────
// SeverityBadge — Civic Connect AI
// ─────────────────────────────────────────────────────────────────────────────

import type { SeverityLevel } from "@/types";

const CONFIG: Record<SeverityLevel, { label: string; bg: string; text: string; dot: string }> = {
  critical: { label: "Critical", bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500" },
  high:     { label: "High",     bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  medium:   { label: "Medium",   bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500" },
  low:      { label: "Low",      bg: "bg-green-50",  text: "text-green-600",  dot: "bg-green-500" },
};

interface Props {
  severity: SeverityLevel;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function SeverityBadge({ severity, size = "md", showDot = true }: Props) {
  const cfg = CONFIG[severity];
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding  = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${cfg.bg} ${cfg.text} ${textSize} ${padding} border-current/20`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}
