// ─────────────────────────────────────────────────────────────────────────────
// AIProcessingPanel — Civic Connect AI
// The animated step-by-step AI pipeline display shown during complaint analysis.
// This is the "wow" feature: gives citizens confidence the system is working.
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import type { AIPipelineStepResult } from "@/types";

interface Props {
  steps: AIPipelineStepResult[];
  compact?: boolean;
}

export function AIProcessingPanel({ steps, compact = false }: Props) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const isComplete = steps.every((s) => s.status === "done" || s.status === "error");

  return (
    <div className={`bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden ${compact ? "p-3" : "p-4"}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          {isComplete ? (
            <CheckCircle size={14} className="text-white" />
          ) : (
            <Loader2 size={13} className="text-white animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-blue-800">
            {isComplete ? "AI Analysis Complete" : "AI is Analysing Your Complaint…"}
          </p>
          {!compact && (
            <p className="text-[10px] text-blue-600 font-medium">
              {doneCount} of {steps.length} steps done
            </p>
          )}
        </div>
        {!isComplete && (
          <div className="flex gap-1 shrink-0">
            <span className="ai-processing-dot" />
            <span className="ai-processing-dot" />
            <span className="ai-processing-dot" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-1.5">
        {steps.map((step) => (
          <div
            key={step.step}
            className={`flex items-start gap-2.5 transition-all duration-300 ${
              step.status === "pending" ? "opacity-40" : "opacity-100"
            }`}
          >
            {/* Step icon */}
            <div className="w-5 h-5 shrink-0 flex items-center justify-center mt-0.5">
              {step.status === "done" && (
                <CheckCircle size={14} className="text-blue-600" />
              )}
              {step.status === "processing" && (
                <Loader2 size={13} className="text-blue-500 animate-spin" />
              )}
              {step.status === "error" && (
                <AlertCircle size={14} className="text-red-500" />
              )}
              {step.status === "pending" && (
                <div className="w-3 h-3 rounded-full border-2 border-blue-200" />
              )}
            </div>

            {/* Step info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{step.icon}</span>
                <span
                  className={`text-xs font-semibold ${
                    step.status === "done"
                      ? "text-blue-800"
                      : step.status === "processing"
                      ? "text-blue-700"
                      : "text-blue-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {step.status === "done" && step.result && (
                <p className="text-[10px] text-blue-600 mt-0.5 font-medium truncate">
                  {step.result}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
