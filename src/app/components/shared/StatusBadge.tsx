// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — Civic Connect AI
// ─────────────────────────────────────────────────────────────────────────────

import type { ComplaintStatus } from "@/types";

const CONFIG: Record<ComplaintStatus, { label: string; bg: string; text: string; border: string }> = {
  submitted:      { label: "Submitted",       bg: "bg-slate-50",   text: "text-slate-600",  border: "border-slate-200" },
  ai_processing:  { label: "AI Processing",   bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200" },
  pending_review: { label: "Pending Review",  bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  assigned:       { label: "Assigned",        bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  in_progress:    { label: "In Progress",     bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200" },
  resolved:       { label: "Resolved",        bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200" },
  rejected:       { label: "Rejected",        bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200" },
  duplicate:      { label: "Duplicate",       bg: "bg-gray-50",    text: "text-gray-600",   border: "border-gray-200" },
};

interface Props {
  status: ComplaintStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const cfg = CONFIG[status];
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding  = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${textSize} ${padding}`}>
      {cfg.label}
    </span>
  );
}
