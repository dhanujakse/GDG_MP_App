// ─────────────────────────────────────────────────────────────────────────────
// ImpactScoreMeter — Civic Connect AI
// Visual meter showing 0–100 impact score with color gradient
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showBar?: boolean;
}

function getScoreColor(score: number): { text: string; bar: string; label: string } {
  if (score >= 80) return { text: "text-red-600",    bar: "bg-red-500",    label: "Critical Priority" };
  if (score >= 60) return { text: "text-orange-600", bar: "bg-orange-500", label: "High Priority" };
  if (score >= 40) return { text: "text-amber-600",  bar: "bg-amber-500",  label: "Medium Priority" };
  return               { text: "text-green-600",  bar: "bg-green-500",  label: "Standard" };
}

export function ImpactScoreMeter({ score, size = "md", showLabel = true, showBar = true }: Props) {
  const { text, bar, label } = getScoreColor(score);

  const scoreSize: Record<string, string> = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-1.5">
        <span className={`font-black leading-none ${scoreSize[size]} ${text}`}>{score}</span>
        <span className="text-xs text-muted-foreground font-semibold mb-1">/100</span>
      </div>
      {showLabel && (
        <span className={`text-xs font-bold ${text}`}>{label}</span>
      )}
      {showBar && (
        <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
