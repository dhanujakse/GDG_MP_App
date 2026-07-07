// ─────────────────────────────────────────────────────────────────────────────
// ComplaintDetailCitizen — JanVaani
// Full complaint detail view for citizens — AI summary, impact score, photos
// Status timeline and Assigned To sections removed per product decision.
// ─────────────────────────────────────────────────────────────────────────────

import { ChevronLeft, MapPin, Users, Share2, Plus, Cpu } from "lucide-react";
import type { Complaint } from "@/types";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { StatusBadge } from "@/app/components/shared/StatusBadge";
import { CategoryIcon } from "@/app/components/shared/CategoryIcon";
import { ImpactScoreMeter } from "@/app/components/shared/ImpactScoreMeter";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

interface Props {
  complaint: Complaint;
  onBack: () => void;
  onJoin?: () => void;
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ComplaintDetailCitizen({ complaint, onBack, onJoin }: Props) {
  const citizenId = localStorage.getItem("onboard_phone") || "ctz_001";
  const isOwner = complaint.reportedBy === citizenId;
  const hasJoined = complaint.joinedCitizenIds.includes(citizenId);
  const canJoin = !isOwner && !hasJoined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 pt-5 pb-3 px-5 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ChevronLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Complaint Detail</p>
            <p className="text-xs font-mono font-bold text-foreground">{complaint.shortId}</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Share2 size={14} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-5">

        {/* Photo */}
        {complaint.photos.length > 0 && !complaint.photos[0].url.includes("unsplash.com") ? (
          <img src={complaint.photos[0].url} alt="Evidence" className="w-full h-44 object-cover" />
        ) : (
          <div className="px-5 pt-4">
            <div className="w-full py-8 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-secondary/10">
              <span className="text-xs text-muted-foreground font-semibold">No Evidence Uploaded</span>
            </div>
          </div>
        )}

        <div className="px-5 pt-4 space-y-4">
          {/* Title + badges */}
          <div>
            <h1 className="text-lg font-bold text-foreground mb-2 leading-snug" style={DF}>
              {complaint.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={complaint.severity} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin size={11} />{complaint.ward}</span>
            <span className="flex items-center gap-1"><Users size={11} />{complaint.citizensJoined + 1} joined</span>
            <span>{formatTimeAgo(complaint.reportedAt)}</span>
          </div>

          {/* AI Summary */}
          {complaint.aiAnalysis && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={13} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">AI Summary</span>
                <span className="text-[10px] text-blue-500">
                  {Math.round(complaint.aiAnalysis.confidenceScore * 100)}% confidence
                </span>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">{complaint.aiAnalysis.citizenSummary}</p>
              {complaint.aiAnalysis.suggestedAction && (
                <div className="mt-2 pt-2 border-t border-blue-100">
                  <p className="text-[11px] text-blue-700 font-semibold">{complaint.aiAnalysis.suggestedAction}</p>
                </div>
              )}
            </div>
          )}

          {/* Impact Score */}
          {complaint.impactScore && (
            <div className="p-4 bg-card rounded-2xl border border-border">
              <p className="text-xs font-bold text-foreground mb-3" style={DF}>Priority Score</p>
              <ImpactScoreMeter score={complaint.impactScore.total} />
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                {complaint.impactScore.explanation}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="p-4 bg-secondary rounded-2xl">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{complaint.description}</p>
          </div>

          {/* Join button */}
          {canJoin && (
            <button onClick={onJoin}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 active-press"
              style={DF}>
              <Plus size={18} />
              Join This Complaint
            </button>
          )}

          {hasJoined && (
            <div className="w-full py-3.5 bg-green-50 border border-green-200 rounded-2xl text-center">
              <p className="text-sm font-bold text-green-700">✓ You've joined this complaint</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
