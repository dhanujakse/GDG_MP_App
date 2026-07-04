// ─────────────────────────────────────────────────────────────────────────────
// StatusTimeline — Civic Connect AI
// Vertical timeline of complaint status history visible to citizens
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle, Clock } from "lucide-react";
import type { StatusUpdate, ComplaintStatus } from "@/types";

const STATUS_ICONS: Record<ComplaintStatus, string> = {
  submitted:      "📥",
  ai_processing:  "🤖",
  pending_review: "👀",
  assigned:       "🏛️",
  in_progress:    "🔧",
  resolved:       "✅",
  rejected:       "❌",
  duplicate:      "🔁",
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface Props {
  history: StatusUpdate[];
  currentStatus: ComplaintStatus;
}

export function StatusTimeline({ history, currentStatus }: Props) {
  const isResolved = currentStatus === "resolved";

  return (
    <div className="space-y-0">
      {history.map((update, idx) => {
        const isLast = idx === history.length - 1;
        const icon = STATUS_ICONS[update.status] ?? "📋";

        return (
          <div key={update.id} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center w-6 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 ${
                isLast
                  ? isResolved
                    ? "bg-green-100"
                    : "bg-primary/10"
                  : "bg-muted"
              }`}>
                <span className="leading-none">{icon}</span>
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border mt-1 mb-1 min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
              <p className={`text-xs font-bold ${isLast ? "text-foreground" : "text-muted-foreground"}`}>
                {update.message}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{formatDate(update.updatedAt)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pending / in-progress indicator */}
      {currentStatus !== "resolved" && currentStatus !== "rejected" && (
        <div className="flex gap-3 mt-1">
          <div className="flex flex-col items-center w-6 shrink-0">
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-border flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
          <div className="pb-0 flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground italic">Waiting for next update…</p>
          </div>
        </div>
      )}
    </div>
  );
}
