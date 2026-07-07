// ─────────────────────────────────────────────────────────────────────────────
// MPMapScreen — Civic Connect AI
// Real interactive GIS map for MPs with complaint pins, filters, heatmap
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { Filter, List, Map as MapIcon, ChevronLeft } from "lucide-react";
import { complaintService } from "@/services/complaint.service";
import { MapView } from "@/app/components/shared/MapView";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { CategoryIcon } from "@/app/components/shared/CategoryIcon";
import type { ComplaintSummary, ComplaintCategory } from "@/types";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

const CATEGORY_FILTERS: { key: ComplaintCategory | "all"; label: string }[] = [
  { key: "all",         label: "All Categories" },
  { key: "water",       label: "Water" },
  { key: "sanitation",  label: "Sanitation" },
  { key: "roads",       label: "Roads" },
  { key: "electricity", label: "Electricity" },
  { key: "drainage",    label: "Drainage" },
];

interface Props {
  onComplaintSelect?: (complaint: ComplaintSummary) => void;
  initialCategoryFilter?: ComplaintCategory | "all";
  onBack?: () => void;
}

export function MPMapScreen({ onComplaintSelect, initialCategoryFilter = "all", onBack }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | "all">(initialCategoryFilter);
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
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
                <ChevronLeft size={18} className="text-foreground" />
              </button>
            )}
            <h1 className="text-lg font-bold text-foreground leading-none" style={DF}>Issue Map</h1>
          </div>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === f.key
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="shrink-0 px-5 py-2 bg-secondary/50 flex items-center gap-4 border-b border-border">
        <span className="text-xs font-bold text-foreground">
          {filteredComplaints.length} active report{filteredComplaints.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444] inline-block" /> 5+ (High)
          <span className="w-2.5 h-2.5 rounded-sm bg-[#f97316] inline-block ml-2" /> 3-4 (Moderate)
          <span className="w-2.5 h-2.5 rounded-sm bg-[#eab308] inline-block ml-2" /> 1-2 (Low)
          <span className="w-2.5 h-2.5 rounded-sm bg-[#22c55e] inline-block ml-2" /> 0 (Clear)
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
