// ─────────────────────────────────────────────────────────────────────────────
// MPMapScreen — Civic Connect AI
// Real interactive GIS map for MPs with complaint pins, filters, heatmap
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { Filter, List, Map as MapIcon } from "lucide-react";
import { complaintService } from "@/services/complaint.service";
import { MapView } from "@/app/components/shared/MapView";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { CategoryIcon } from "@/app/components/shared/CategoryIcon";
import type { ComplaintSummary, ComplaintCategory } from "@/types";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

const CATEGORY_FILTERS: { key: ComplaintCategory | "all"; label: string; emoji: string }[] = [
  { key: "all",         label: "All",     emoji: "📍" },
  { key: "water",       label: "Water",   emoji: "💧" },
  { key: "sanitation",  label: "Garbage", emoji: "🗑️" },
  { key: "roads",       label: "Roads",   emoji: "🛣️" },
  { key: "electricity", label: "Lights",  emoji: "💡" },
  { key: "drainage",    label: "Drain",   emoji: "🌊" },
];

interface Props {
  onComplaintSelect?: (complaint: ComplaintSummary) => void;
}

export function MPMapScreen({ onComplaintSelect }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | "all">("all");
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintSummary | null>(null);

  const allComplaints = useMemo(() => complaintService.getAll(), []);
  const filteredComplaints = useMemo(() =>
    selectedCategory === "all"
      ? allComplaints
      : allComplaints.filter((c) => c.category === selectedCategory),
    [allComplaints, selectedCategory]
  );

  const handleComplaintClick = (c: ComplaintSummary) => {
    setSelectedComplaint(c);
    onComplaintSelect?.(c);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 pt-5 pb-3 px-5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-foreground" style={DF}>Issue Map</h1>
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setView("map")}
              className={`p-1.5 rounded-lg transition-all ${view === "map" ? "bg-card shadow-sm" : ""}`}>
              <MapIcon size={15} className={view === "map" ? "text-primary" : "text-muted-foreground"} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-all ${view === "list" ? "bg-card shadow-sm" : ""}`}>
              <List size={15} className={view === "list" ? "text-primary" : "text-muted-foreground"} />
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedCategory(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === f.key
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}>
              <span>{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="shrink-0 px-5 py-2 bg-secondary/50 flex items-center gap-4 border-b border-border">
        <span className="text-xs font-bold text-foreground">
          {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          {filteredComplaints.filter((c) => c.severity === "critical").length} critical
        </span>
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block ml-2" /> High
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-2" /> Medium
        </span>
      </div>

      {/* Map / List view */}
      <div className="flex-1 overflow-hidden relative">
        {view === "map" ? (
          <>
            <MapView
              complaints={filteredComplaints}
              height="100%"
              selectedCategory={selectedCategory}
              onComplaintClick={handleComplaintClick}
            />
            {/* Mini complaint card on click */}
            {selectedComplaint && (
              <div className="absolute bottom-3 left-3 right-3 z-[1000] animate-slideInRight">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-3">
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={selectedComplaint.category} size={16} showBg bgSize="w-9 h-9" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate" style={DF}>
                        {selectedComplaint.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedComplaint.ward} · {selectedComplaint.citizensJoined + 1} citizens
                      </p>
                    </div>
                    <SeverityBadge severity={selectedComplaint.severity} size="sm" />
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => onComplaintSelect?.(selectedComplaint)}
                      className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                      style={DF}>
                      View Details
                    </button>
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="px-3 py-2 bg-secondary rounded-xl text-xs font-semibold text-muted-foreground">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* List view */
          <div className="h-full overflow-y-auto scrollbar-none px-4 py-3 space-y-2">
            {filteredComplaints.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No complaints in this category</p>
              </div>
            )}
            {filteredComplaints.map((c) => (
              <button
                key={c.id}
                onClick={() => onComplaintSelect?.(c)}
                className="w-full flex items-start gap-3 p-3.5 bg-card rounded-2xl border border-border text-left active-press transition-all">
                <CategoryIcon category={c.category} size={16} showBg bgSize="w-9 h-9" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate" style={DF}>{c.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {c.ward} · {c.citizensJoined + 1} citizens · Score: {c.impactScore}
                  </p>
                </div>
                <SeverityBadge severity={c.severity} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
