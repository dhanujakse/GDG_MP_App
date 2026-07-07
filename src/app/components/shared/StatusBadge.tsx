// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — Civic Connect AI
// ─────────────────────────────────────────────────────────────────────────────

import type { ComplaintStatus } from "@/types";

const CONFIG: Record<ComplaintStatus, { label: string; bg: string; text: string; border: string }> = {
  submitted:      { label: "Submitted",       bg: "bg-slate-100/80", text: "text-slate-700",  border: "border-slate-200" },
  ai_processing:  { label: "AI Processing",   bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200" },
  in_progress:    { label: "Analysed by AI",  bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200" },
  resolved:       { label: "Analysed by AI",  bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200" },
  rejected:       { label: "Analysed by AI",  bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200" },
  duplicate:      { label: "Duplicate",       bg: "bg-gray-50",    text: "text-gray-600",   border: "border-gray-200" },
};

interface Props {
  status: ComplaintStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const cfg = CONFIG[status] || { label: status, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding  = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${textSize} ${padding}`}>
      {cfg.label}
    </span>
  );
}
