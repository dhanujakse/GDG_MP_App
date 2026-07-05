// ─────────────────────────────────────────────────────────────────────────────
// AIProcessingPanel — Civic Connect AI
// Simplified, professional progress card displayed during complaint analysis.
// Shows a clean status indicator and progress bar suitable for government portal.
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle, Loader2 } from "lucide-react";
import type { AIPipelineStepResult } from "@/types";

interface Props {
  steps: AIPipelineStepResult[];
  compact?: boolean;
}

export function AIProcessingPanel({ steps, compact = false }: Props) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const isComplete = steps.every((s) => s.status === "done" || s.status === "error");

  // Determine standard message based on progress
  let statusMessage = "Verifying report details...";
  if (doneCount > 1) statusMessage = "Cross-referencing matching reports...";
  if (doneCount > 3) statusMessage = "Determining category and priority routing...";
  if (isComplete) statusMessage = "Verification successfully completed.";

  return (
    <div className={`bg-secondary border border-border rounded-2xl overflow-hidden ${compact ? "p-4" : "p-5"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {isComplete ? (
            <CheckCircle size={15} className="text-primary" />
          ) : (
            <Loader2 size={15} className="text-primary animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">
            {isComplete ? "Processing Complete" : "Administrative Processing..."}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
