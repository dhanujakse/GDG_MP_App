// ─────────────────────────────────────────────────────────────────────────────
// MPComplaintDetail — Civic Connect AI
// MP decision-making view: AI summary, action panel, key facts, assignment
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  ChevronLeft, MapPin, Users, CheckCircle, Clock,
  Cpu, Building2, AlertTriangle, ArrowRight, RefreshCw
} from "lucide-react";
import type { Complaint, ComplaintStatus, Department } from "@/types";
import { complaintService } from "@/services/complaint.service";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { StatusBadge } from "@/app/components/shared/StatusBadge";
import { ImpactScoreMeter } from "@/app/components/shared/ImpactScoreMeter";
import { CategoryIcon } from "@/app/components/shared/CategoryIcon";

const DF: React.CSSProperties = { fontFamily: "var(--font-display)" };

const DEPARTMENTS: { value: Department; label: string; icon: string }[] = [
  { value: "water_board",       label: "Water Board",         icon: "💧" },
  { value: "sanitation",        label: "Sanitation Dept",     icon: "🗑️" },
  { value: "public_works",      label: "Public Works",        icon: "🛣️" },
  { value: "electricity_board", label: "Electricity Board",   icon: "⚡" },
  { value: "storm_water",       label: "Storm Water Dept",    icon: "🌊" },
  { value: "health",            label: "Health Department",   icon: "🏥" },
  { value: "education",         label: "Education Dept",      icon: "🏫" },
  { value: "transport",         label: "Transport Dept",      icon: "🚌" },
  { value: "general",           label: "General Admin",       icon: "📋" },
];

const STATUS_ACTIONS: { status: ComplaintStatus; label: string; color: string }[] = [
  { status: "in_progress", label: "Mark In Progress", color: "bg-blue-500" },
  { status: "rejected",    label: "Reject",           color: "bg-red-500" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

interface Props {
  complaint: Complaint;
  onBack: () => void;
  onUpdated?: (updated: Complaint) => void;
}

export function MPComplaintDetail({ complaint: initialComplaint, onBack, onUpdated }: Props) {
  const [complaint, setComplaint] = useState(initialComplaint);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleAssign = (dept: Department) => {
    setUpdating(true);
    const updated = complaintService.assignDepartment(complaint.id, dept, "mp_001");
    if (updated) {
      setComplaint(updated);
      onUpdated?.(updated);
    }
    setShowDeptPicker(false);
    setUpdating(false);
  };

  const handleStatusUpdate = (status: ComplaintStatus) => {
    setUpdating(true);
    const messages: Record<ComplaintStatus, string> = {
      in_progress: "Work started on this complaint.",
      resolved: "Issue resolved and closed.",
      rejected: "Complaint rejected after review.",
      submitted: "", ai_processing: "", duplicate: "",
    };
    const updated = complaintService.updateStatus(complaint.id, status, messages[status] ?? "Status updated.", "mp_001");
    if (updated) {
      setComplaint(updated);
      onUpdated?.(updated);
    }
    setUpdating(false);
  };

  const ai = complaint.aiAnalysis;
  const score = complaint.impactScore;
  const suggestedDept = DEPARTMENTS.find((d) => d.value === ai?.suggestedDepartment);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 pt-5 pb-3 px-5 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ChevronLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">MP View — Complaint Detail</p>
            <p className="text-xs font-mono font-bold text-foreground">{complaint.shortId}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-green-700">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-5">

        {/* Photo */}
        {complaint.photos.length > 0 ? (
          <img src={complaint.photos[0].url} alt="Complaint" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-24 bg-muted flex items-center justify-center">
            <CategoryIcon category={complaint.category} size={28} showBg bgSize="w-12 h-12" />
          </div>
        )}

        <div className="px-5 pt-4 space-y-4">
          {/* Title + badges */}
          <div>
            <h1 className="text-base font-bold text-foreground mb-2 leading-snug" style={DF}>
              {complaint.title}
            </h1>
            <div className="flex flex-wrap gap-2 items-center">
              <SeverityBadge severity={complaint.severity} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={10} /> {complaint.ward}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users size={10} /> {complaint.citizensJoined + 1}
              </span>
            </div>
          </div>

          {/* AI MP Summary — the key decision tool */}
          {ai && (
            <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Cpu size={12} className="text-white" />
                </div>
                <span className="text-xs font-bold text-blue-800">AI Summary for MP</span>
                <span className="text-[10px] text-blue-500 ml-auto">
                  {Math.round(ai.confidenceScore * 100)}% confidence
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-900 leading-relaxed">{ai.mpSummary}</p>
            </div>
          )}

          {/* Impact Score */}
          {score && (
            <div className="p-4 bg-card rounded-2xl border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Impact Score</p>
              <ImpactScoreMeter score={score.total} size="lg" />
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{score.explanation}</p>
            </div>
          )}

          {/* Key Facts */}
          {ai?.keyFacts && ai.keyFacts.length > 0 && (
            <div className="p-4 bg-secondary rounded-2xl">
              <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide" style={DF}>Key Facts</p>
              <div className="space-y-1.5">
                {ai.keyFacts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-primary text-sm leading-none mt-0.5">•</span>
                    <span className="text-xs text-foreground leading-relaxed">{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommended Action */}
          {ai?.suggestedAction && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} className="text-amber-600" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Recommended Action</span>
              </div>
              <p className="text-sm text-amber-900 font-medium leading-relaxed">{ai.suggestedAction}</p>
              {suggestedDept && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-200">
                  <span>{suggestedDept.icon}</span>
                  <span className="text-xs font-semibold text-amber-800">{suggestedDept.label}</span>
                  <span className="text-[10px] text-amber-600 ml-1">(AI suggestion)</span>
                </div>
              )}
            </div>
          )}

          {/* Government Note */}
          {ai?.governmentNote && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Government Note</p>
              <p className="text-[11px] text-slate-700 leading-relaxed">{ai.governmentNote}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1"><Clock size={10} /> Reported: {formatDate(complaint.reportedAt)}</div>
          </div>

          {/* ── Action Panel ────────────────────────────────────────────────── */}
          <div className="space-y-2.5 pt-2 border-t border-border">
            <p className="text-xs font-bold text-foreground" style={DF}>Take Action</p>

            {/* Assign Department */}
            {!showDeptPicker ? (
              <button
                onClick={() => setShowDeptPicker(true)}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 active-press"
                style={DF}>
                <Building2 size={16} />
                {complaint.assignedDepartment ? "Reassign Department" : "Assign Department"}
                <ArrowRight size={14} className="ml-auto" />
              </button>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">Select Department</p>
                  <button onClick={() => setShowDeptPicker(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
                <div className="p-2 max-h-48 overflow-y-auto scrollbar-none">
                  {DEPARTMENTS.map((d) => (
                    <button key={d.value} onClick={() => handleAssign(d.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-secondary ${
                        complaint.assignedDepartment === d.value ? "bg-primary/5 border border-primary/20" : ""
                      }`}>
                      <span className="text-lg">{d.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{d.label}</span>
                      {ai?.suggestedDepartment === d.value && (
                        <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">
                          AI
                        </span>
                      )}
                      {complaint.assignedDepartment === d.value && (
                        <CheckCircle size={14} className="ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ACTIONS.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusUpdate(action.status)}
                  disabled={updating || complaint.status === action.status}
                  className={`py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                    complaint.status === action.status
                      ? "opacity-40 cursor-not-allowed"
                      : `${action.color} active-press`
                  }`}
                  style={DF}>
                  {updating ? <RefreshCw size={11} className="animate-spin" /> : null}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
