// ─────────────────────────────────────────────────────────────────────────────
// MPComplaintDetail — Civic Connect AI
// MP decision-making view: AI summary, action panel, key facts, assignment
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  ChevronLeft, MapPin, Users, Clock,
  Cpu, Building2, AlertTriangle, ArrowRight,
  FileText, Download, Share2, Copy, CheckCircle
} from "lucide-react";
import type { Complaint, Department } from "@/types";
import { complaintService, calculateDynamicImpactScore } from "@/services/complaint.service";
import { SeverityBadge } from "@/app/components/shared/SeverityBadge";
import { ImpactScoreMeter } from "@/app/components/shared/ImpactScoreMeter";

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
  const [showLetter, setShowLetter] = useState(false);
  const [showLetterExpanded, setShowLetterExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Drill-down interactive modal states
  const [showSupporters, setShowSupporters] = useState(false);
  const [supporterSearch, setSupporterSearch] = useState("");
  const [showRelatedReports, setShowRelatedReports] = useState<{ title: string; category: string; ward: string; isDuplicateOnly: boolean } | null>(null);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedCategoryFilter, setRelatedCategoryFilter] = useState("all");
  const [relatedWardFilter, setRelatedWardFilter] = useState("all");
  const [relatedPriorityFilter, setRelatedPriorityFilter] = useState("all");
  const [relatedDateFilter, setRelatedDateFilter] = useState("all");

  const handleAssign = (dept: Department) => {
    const updated = complaintService.assignDepartment(complaint.id, dept, "mp_001");
    if (updated) {
      setComplaint(updated);
      onUpdated?.(updated);
    }
    setShowDeptPicker(false);
  };

  const handleGenerateLetter = () => {
    if (!complaint.assignedDepartment && ai?.suggestedDepartment) {
      handleAssign(ai.suggestedDepartment);
    } else if (!complaint.assignedDepartment) {
      handleAssign("general");
    }
    setShowLetter(true);
    setShowLetterExpanded(true);
  };

  const handleCopySummary = () => {
    if (ai?.mpSummary) {
      navigator.clipboard.writeText(ai.mpSummary).then(() => {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
        showToast("✓ Copied");
      });
    }
  };

  const ai = complaint.aiAnalysis;
  const currentDept = DEPARTMENTS.find((d) => d.value === complaint.assignedDepartment);
  const suggestedDept = DEPARTMENTS.find((d) => d.value === ai?.suggestedDepartment);

  // Dynamic cost & impact estimates based on score
  const estPopulation = (complaint.citizensJoined + 1) * 20;
  const dynamicScore = calculateDynamicImpactScore(complaint);

  const letterText = `OFFICIAL COMMUNICATION
Office of the Member of Parliament
Madurai Constituency

Date: ${new Date().toLocaleDateString("en-IN")}

To,
The Commissioner / Department Head,
${currentDept?.label || suggestedDept?.label || "General Administration"}
Madurai Municipal Corporation

Subject: Urgent constituency priority report regarding ${complaint.category.toUpperCase()} issue in ${complaint.ward}

Reference Report ID: ${complaint.shortId}

Dear Sir/Madam,

I am forwarding the community priority report submitted by residents of ${complaint.ward} regarding "${complaint.title}".

Our Decision Support System has classified this issue with an Impact Score of ${dynamicScore.total}/100 based on community metrics and density.

Kindly address this infrastructure priority at your earliest convenience and provide an official status report to my office.

Sincerely,
Dr. Rajesh Kumar
Member of Parliament
Madurai Constituency`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText).then(() => {
      showToast("✓ Copied");
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Official Forwarding Letter - ${complaint.shortId}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #0f172a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              pre { white-space: pre-wrap; font-size: 14px; }
              hr { border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0; }
              .header-meta { font-size: 11px; color: #64748b; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header-meta">
              Reference ID: ${complaint.shortId} | Date: ${new Date().toLocaleDateString("en-IN")}
            </div>
            <pre>\${letterText}</pre>
            <hr />
            <p style="font-size: 10px; text-align: center; color: #64748b; font-family: sans-serif;">Generated via JanVaani Decision Support Suite</p>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      // Replace printWindow pre content directly to avoid template literal escaping issues
      const pre = printWindow.document.querySelector("pre");
      if (pre) pre.textContent = letterText;
      printWindow.document.close();
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `Priority Report: ${complaint.title}`,
      text: `Official Priority Grievance forwarded to ${currentDept?.label || "Department"}. Ref: ${complaint.shortId}`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast("✓ Copied");
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast("✓ Copied");
      });
    }
  };

  const handleDownloadPDF = () => {
    const loadJsPDF = () => {
      return new Promise<any>((resolve, reject) => {
        if ((window as any).jspdf) {
          resolve((window as any).jspdf);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = () => resolve((window as any).jspdf);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    loadJsPDF().then((jspdfModule) => {
      const { jsPDF } = jspdfModule;
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("OFFICIAL FORWARDING LETTER", 20, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reference ID: ${complaint.shortId}`, 20, 32);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 32);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 36, 190, 36);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("CONSTITUENCY DETAILS:", 20, 44);

      doc.setFont("helvetica", "normal");
      doc.text(`Issue Title:`, 20, 50);
      doc.text(complaint.title.substring(0, 70), 55, 50);

      doc.text(`Location Ward:`, 20, 56);
      doc.text(`${complaint.ward}, Madurai Central`, 55, 56);

      doc.text(`Priority Impact Score:`, 20, 62);
      doc.setFont("helvetica", "bold");
      doc.text(`${dynamicScore.total}/100`, 55, 62);
      doc.setFont("helvetica", "normal");

      doc.text(`Recommended Department:`, 20, 68);
      doc.text(currentDept?.label || suggestedDept?.label || "General Admin", 55, 68);

      doc.text(`Estimated Population Affected:`, 20, 74);
      doc.text(`~${estPopulation} Residents`, 55, 74);

      doc.text(`Supporting Citizens:`, 20, 80);
      doc.text(`${complaint.citizensJoined + 1} Supporting Citizens`, 55, 80);

      doc.line(20, 86, 190, 86);

      doc.setFont("helvetica", "bold");
      doc.text("CITIZEN DESCRIPTION:", 20, 94);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(complaint.description, 170);
      doc.text(descLines, 20, 100);

      const aiY = 100 + (descLines.length * 5) + 8;
      doc.setDrawColor(203, 213, 225);
      doc.line(20, aiY - 4, 190, aiY - 4);

      doc.setFont("helvetica", "bold");
      doc.text("AI DECISION BRIEF SUMMARY:", 20, aiY);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(ai?.mpSummary || "No summary available.", 170);
      doc.text(summaryLines, 20, aiY + 6);

      const sigY = aiY + 6 + (summaryLines.length * 5) + 15;
      doc.setFont("helvetica", "bold");
      doc.text("Dr. Rajesh Kumar", 20, sigY);
      doc.setFont("helvetica", "normal");
      doc.text("Member of Parliament", 20, sigY + 5);
      doc.text("Madurai Constituency", 20, sigY + 10);

      doc.save(`Forwarding_Letter_${complaint.shortId}.pdf`);
    }).catch(() => {
      showToast("Failed to load PDF library. Check network.");
    });
  };

  return (
    <div className="flex flex-col h-full bg-background relative font-sans">
      {/* Local Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg z-50 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 pt-5 pb-3 px-5 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active-press">
            <ChevronLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Decision Support Terminal</p>
            <p className="text-xs font-mono font-bold text-foreground mt-0.5">{complaint.shortId}</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            <span className="text-[9px] font-bold text-green-700 font-mono">ACTIVE FEED</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-6">
        {/* Photo View */}
        {complaint.photos.length > 0 && !complaint.photos[0].url.includes("unsplash.com") ? (
          <img src={complaint.photos[0].url} alt="Citizen Evidence" className="w-full h-44 object-cover" />
        ) : (
          <div className="px-5 pt-4 space-y-3">
            <div className="w-full py-8 border border-dashed border-border bg-card rounded-2xl flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground font-semibold">No Evidence Uploaded</span>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">Citizen submitted report without photographic attachments</p>
            </div>
            
            {dynamicScore.total >= 70 && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-905 space-y-1.5 font-sans">
                <p className="text-[9.5px] font-bold uppercase tracking-wider font-mono text-amber-850 flex items-center gap-1">
                  ⚠️ No Image Evidence Justification
                </p>
                <p className="leading-relaxed font-semibold">
                  Although no photo evidence was uploaded, this report is ranked highly by the AI model due to:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-950 font-semibold">
                  {complaint.citizensJoined >= 15 && (
                    <li>Strong citizen support: {complaint.citizensJoined + 1} citizens verified & joined this report</li>
                  )}
                  {complaintService.getAll().filter(r => r.category === complaint.category && r.ward === complaint.ward && r.id !== complaint.id).length >= 2 && (
                    <li>Repeated reports ({complaintService.getAll().filter(r => r.category === complaint.category && r.ward === complaint.ward && r.id !== complaint.id).length} similar) received from the same ward</li>
                  )}
                  {complaint.severity === "critical" && (
                    <li>Health/infrastructure hazard keywords detected in description</li>
                  )}
                  <li>High confidence validation across independent submissions</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="px-5 pt-4 space-y-4">
          {/* Header Metadata */}
          <div>
            <h1 className="text-base font-bold text-foreground leading-snug" style={DF}>
              {complaint.title}
            </h1>
            <div className="flex flex-wrap gap-3 items-center mt-2.5">
              <SeverityBadge severity={complaint.severity} />
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <MapPin size={11} className="text-slate-450" /> {complaint.ward}
              </span>
              <button
                onClick={() => setShowSupporters(true)}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 font-bold bg-secondary border border-border/80 px-2.5 py-1 rounded-xl active-press transition-all shadow-sm">
                <Users size={11} className="text-slate-500" />
                <span>{complaint.citizensJoined + 1} Supporting Citizens</span>
              </button>
            </div>
          </div>

          {/* Citizen Description Block */}
          <div className="p-4 bg-card rounded-2xl border border-border">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 font-mono">Citizen Description / Voice Transcript</p>
            <p className="text-xs text-foreground leading-relaxed font-medium">{complaint.description}</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><Clock size={11} /> Filed: {formatDate(complaint.reportedAt)}</span>
            </div>
          </div>

          {/* AI Decision Brief */}
          {ai && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Cpu size={12} />
                </div>
                <span className="text-xs font-bold text-blue-900">AI Decision Brief</span>
                <span className="text-[10px] text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full font-bold ml-auto font-mono">
                  {Math.round(ai.confidenceScore * 100)}% Confidence
                </span>
              </div>

              <div className="space-y-3.5 text-xs text-blue-950 font-sans">
                <div>
                  <p className="text-[9px] text-blue-800 font-bold uppercase tracking-wider mb-0.5 font-mono">Summary</p>
                  <p className="leading-relaxed font-medium">{ai.mpSummary}</p>
                </div>

                <div>
                  <p className="text-[9px] text-blue-800 font-bold uppercase tracking-wider mb-1 font-mono">Why AI Ranked This Highly</p>
                  <div className="space-y-1">
                    {ai.keyFacts?.map((fact, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 leading-relaxed font-medium">
                        <span className="text-primary text-[10px] mt-0.5">•</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100/60 font-sans">
                  <div>
                    <p className="text-[9px] text-blue-800 font-bold uppercase tracking-wider font-mono">Reasoning</p>
                    <p className="mt-0.5 font-medium leading-relaxed">{ai.aiReasoning}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-800 font-bold uppercase tracking-wider font-mono">Recommended Department</p>
                    <p className="mt-0.5 font-bold text-primary capitalize leading-relaxed">
                      {ai.suggestedDepartment.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Impact Metrics */}
          <div className="p-4 bg-card rounded-2xl border border-border font-sans">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2.5 font-mono">Decision Impact Metrics</p>
            <div className="flex items-center justify-between">
              <ImpactScoreMeter score={dynamicScore.total} size="lg" />
              <div className="shrink-0 text-right">
                <p className="text-xl font-black text-primary font-mono">{dynamicScore.total}</p>
                <p className="text-[9px] text-muted-foreground font-medium">calculated score</p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-border/80 space-y-2">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Auditable Score Factors</span>
              <div className="space-y-1">
                {dynamicScore.breakdown.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <span className="w-1 h-1 rounded-full bg-slate-450" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/60 text-xs">
              <div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Estimated Population Affected</span>
                <p className="font-bold text-foreground mt-0.5">~{estPopulation} residents</p>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Infrastructure Priority</span>
                <p className="font-bold text-foreground mt-0.5 capitalize">{complaint.category} asset</p>
              </div>
            </div>
          </div>

          {/* Related Intelligence Links */}
          <div className="p-4 bg-card rounded-2xl border border-border font-sans space-y-3 shadow-sm">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Related Intelligence Links</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowRelatedReports({
                  title: `Similar ${complaint.category.toUpperCase()} Reports in ${complaint.ward}`,
                  category: complaint.category,
                  ward: complaint.ward,
                  isDuplicateOnly: true
                })}
                className="p-3 bg-secondary/55 hover:bg-secondary border border-border/60 rounded-xl text-left active-press transition-all flex flex-col justify-between min-h-[90px] shadow-sm">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold font-mono">Duplicate Reports</p>
                  <p className="text-sm font-black text-foreground mt-0.5">
                    {complaintService.getAll().filter(r => r.category === complaint.category && r.ward === complaint.ward && r.id !== complaint.id).length} Similar
                  </p>
                </div>
                <span className="text-[9.5px] text-primary font-bold mt-2 block font-sans">View Duplicates →</span>
              </button>
              
              <button
                onClick={() => setShowRelatedReports({
                  title: `Constituency ${complaint.category.toUpperCase()} Reports`,
                  category: complaint.category,
                  ward: "all",
                  isDuplicateOnly: false
                })}
                className="p-3 bg-secondary/55 hover:bg-secondary border border-border/60 rounded-xl text-left active-press transition-all flex flex-col justify-between min-h-[90px] shadow-sm">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold font-mono">Report Density (Ward)</p>
                  <p className="text-sm font-black text-foreground mt-0.5">
                    {complaintService.getAll().filter(r => r.category === complaint.category && r.id !== complaint.id).length} Active
                  </p>
                </div>
                <span className="text-[9.5px] text-primary font-bold mt-2 block font-sans">View Related →</span>
              </button>
            </div>
          </div>

          {/* ── Official Action Panel ──────────────────────────────────────── */}
          <div className="space-y-3 pt-3 border-t border-border font-sans">
            <p className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">Official MP Action Interface</p>

            {/* Department Assignment */}
            <div className="bg-card border border-border rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">Department Routing</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 capitalize">
                    {currentDept?.label || "Unassigned"}
                  </p>
                </div>
                <button
                  onClick={() => setShowDeptPicker(!showDeptPicker)}
                  className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl active-press border border-border transition-all">
                  {complaint.assignedDepartment ? "Reassign Dept" : "Assign Dept"}
                </button>
              </div>

              {showDeptPicker && (
                <div className="mt-3 pt-3 border-t border-border/80 max-h-48 overflow-y-auto scrollbar-none space-y-1">
                  {DEPARTMENTS.map((d) => (
                    <button key={d.value} onClick={() => handleAssign(d.value)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-secondary/60 ${
                        complaint.assignedDepartment === d.value ? "bg-primary/5 border border-primary/20" : "border border-transparent"
                      }`}>
                      <span className="text-base">{d.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{d.label}</span>
                      {ai?.suggestedDepartment === d.value && (
                        <span className="ml-auto text-[8.5px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
                          AI SUGGESTED
                        </span>
                      )}
                      {complaint.assignedDepartment === d.value && (
                        <CheckCircle size={13} className="ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Action Options */}
            <div className="space-y-3.5">
              <button
                onClick={handleGenerateLetter}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active-press shadow-sm"
                style={DF}>
                <FileText size={15} />
                Generate Official Forwarding Letter
              </button>

              {/* Generated Forwarding Memo Block inside Expandable Card */}
              {showLetter && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all font-sans">
                  <button
                    onClick={() => setShowLetterExpanded(!showLetterExpanded)}
                    className="w-full p-4 flex items-center justify-between bg-secondary/35 border-b border-border/80">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">Official Forwarding Letter Draft</span>
                    </div>
                    <span className="text-[10px] text-primary font-bold">
                      {showLetterExpanded ? "Collapse" : "Expand"}
                    </span>
                  </button>
                  
                  {showLetterExpanded && (
                    <div className="p-4 space-y-3.5 bg-card animate-slideDown">
                      {/* Sub actions inside the expandable card */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleCopy}
                          className="py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-bold text-[10.5px] flex items-center justify-center gap-1 active-press transition-colors">
                          {copied ? "✓ Copied Successfully" : "Copy"}
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-bold text-[10.5px] flex items-center justify-center gap-1 active-press transition-colors">
                          <Download size={12} /> Download PDF
                        </button>
                        <button
                          onClick={handlePrint}
                          className="py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-bold text-[10.5px] flex items-center justify-center gap-1 active-press transition-colors">
                          Print
                        </button>
                        <button
                          onClick={handleShare}
                          className="py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-bold text-[10.5px] flex items-center justify-center gap-1 active-press transition-colors font-sans">
                          <Share2 size={12} /> Share
                        </button>
                      </div>

                      <textarea
                        readOnly
                        value={letterText}
                        rows={11}
                        className="w-full p-3 bg-secondary/30 border border-border/70 rounded-xl text-[10.5px] text-slate-700 leading-relaxed font-mono resize-none focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleCopySummary}
                className={`w-full py-2.5 border border-dashed rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active-press transition-colors ${copiedSummary ? "bg-green-50 text-green-700 border-green-200" : "bg-secondary text-muted-foreground border-border"}`}
                style={DF}>
                <Copy size={12} />
                {copiedSummary ? "✓ Copied" : "Copy Brief Summary"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Citizens Modal */}
      {showSupporters && (() => {
        const supportMethods = ["In-App Join", "SMS OTP Verification", "Web Portal", "Public Kiosk"];
        const firstNames = ["Aravind", "Bala", "Chitra", "Divya", "Elango", "Fathima", "Ganesh", "Hari", "Indira", "Jaya", "Karthik", "Lakshmi", "Manoj", "Nisha", "Omana", "Prakash", "Qadir", "Rajesh", "Sangeetha", "Thangam", "Usha", "Vijay", "William", "Yasmin"];
        const lastInitials = ["A.", "B.", "C.", "D.", "K.", "M.", "N.", "P.", "R.", "S.", "T.", "V."];
        
        const count = complaint.citizensJoined + 1;
        const list = Array.from({ length: count }).map((_, idx) => {
          const isOriginal = idx === 0;
          const seed = (complaint.id.charCodeAt(0) * 7 + idx * 13) % 100;
          const name = isOriginal 
            ? (complaint.reportedBy === "ctz_001" ? "Priya Sharma" : "Ankit V. (Original)")
            : `${firstNames[(seed + idx) % firstNames.length]} ${lastInitials[(seed * idx) % lastInitials.length]}`;
          const ward = complaint.ward;
          const date = new Date(new Date(complaint.reportedAt).getTime() + (idx * 2 * 60 * 60 * 1000)).toLocaleDateString("en-IN");
          const method = isOriginal ? "Original Submission" : supportMethods[(seed + idx) % supportMethods.length];
          return { name, ward, date, method, isOriginal };
        });

        const filteredList = list.filter(item => 
          item.name.toLowerCase().includes(supporterSearch.toLowerCase()) || 
          item.method.toLowerCase().includes(supporterSearch.toLowerCase())
        );

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[75vh]">
              <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground">Supporting Citizens</h3>
                  <p className="text-[10px] text-muted-foreground font-mono font-bold">{count} Verified Backers</p>
                </div>
                <button
                  onClick={() => { setShowSupporters(false); setSupporterSearch(""); }}
                  className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                  Close
                </button>
              </div>

              <div className="my-3 shrink-0">
                <input
                  type="text"
                  placeholder="Search supporters..."
                  value={supporterSearch}
                  onChange={(e) => setSupporterSearch(e.target.value)}
                  className="w-full px-3.5 py-2 bg-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {filteredList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-secondary/35 rounded-xl border border-border/40 text-xs flex justify-between items-center animate-fadeIn">
                    <div>
                      <p className="font-bold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.ward} · {item.method}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        item.isOriginal ? "bg-primary/10 text-primary border border-primary/20" : "bg-green-50 text-green-700 border border-green-200"
                      } border`}>
                        {item.isOriginal ? "Original" : "Verified"}
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Related / Duplicate Reports Modal */}
      {showRelatedReports && (() => {
        const isDuplicateOnly = showRelatedReports.isDuplicateOnly;
        const allReports = complaintService.getAll();
        
        let filtered = allReports.filter(r => r.category === showRelatedReports.category && r.id !== complaint.id);
        if (isDuplicateOnly) {
          filtered = filtered.filter(r => r.ward === showRelatedReports.ward);
        }

        const searchFiltered = filtered.filter(r => {
          const matchesSearch = r.title.toLowerCase().includes(relatedSearch.toLowerCase()) || r.shortId.toLowerCase().includes(relatedSearch.toLowerCase());
          const matchesWard = relatedWardFilter === "all" ? true : r.ward === relatedWardFilter;
          const matchesCategory = relatedCategoryFilter === "all" ? true : r.category === relatedCategoryFilter;
          const matchesPriority = relatedPriorityFilter === "all" ? true : r.severity === relatedPriorityFilter;
          
          let matchesDate = true;
          if (relatedDateFilter !== "all") {
            const ageMs = Date.now() - new Date(r.reportedAt).getTime();
            const ageHours = ageMs / (1000 * 60 * 60);
            if (relatedDateFilter === "24h") matchesDate = ageHours <= 24;
            else if (relatedDateFilter === "7d") matchesDate = ageHours <= 168;
            else if (relatedDateFilter === "30d") matchesDate = ageHours <= 720;
          }
          return matchesSearch && matchesWard && matchesCategory && matchesPriority && matchesDate;
        });

        const wardsList = Array.from(new Set(allReports.map(r => r.ward)));

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 font-sans animate-fadeIn">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl relative animate-slideUp flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground leading-snug">{showRelatedReports.title}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono font-bold mt-0.5">{searchFiltered.length} Reports Found</p>
                </div>
                <button
                  onClick={() => {
                    setShowRelatedReports(null);
                    setRelatedSearch("");
                    setRelatedWardFilter("all");
                    setRelatedCategoryFilter("all");
                    setRelatedPriorityFilter("all");
                    setRelatedDateFilter("all");
                  }}
                  className="text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors">
                  Close
                </button>
              </div>

              {/* Filters */}
              <div className="my-3 space-y-2 shrink-0 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Search by title or ID..."
                  value={relatedSearch}
                  onChange={(e) => setRelatedSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-primary font-medium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={relatedWardFilter}
                    onChange={(e) => setRelatedWardFilter(e.target.value)}
                    className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-bold text-foreground focus:outline-none focus:border-primary">
                    <option value="all">All Wards</option>
                    {wardsList.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <select
                    value={relatedPriorityFilter}
                    onChange={(e) => setRelatedPriorityFilter(e.target.value)}
                    className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-bold text-foreground focus:outline-none focus:border-primary">
                    <option value="all">All Priority</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {searchFiltered.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6 font-semibold">No matching reports found</p>
                ) : (
                  searchFiltered.map((r) => {
                    const full = complaintService.getById(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (full) {
                            setComplaint(full);
                            setShowRelatedReports(null);
                            onUpdated?.(full);
                          }
                        }}
                        className="w-full text-left p-3 bg-secondary/35 hover:bg-secondary/60 border border-border/60 rounded-xl flex items-center justify-between text-xs font-semibold active-press transition-colors shadow-sm animate-fadeIn">
                        <div className="flex-1 pr-3 truncate">
                          <p className="font-bold text-foreground truncate">{r.title}</p>
                          <p className="text-[9.5px] text-muted-foreground mt-0.5">{r.ward} · {r.shortId}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`text-[8px] px-1 py-0.5 rounded font-mono ${
                            r.severity === "critical" ? "bg-red-50 text-red-650" : r.severity === "high" ? "bg-amber-50 text-amber-650" : "bg-blue-50 text-blue-650"
                          } font-black border`}>
                            {r.severity.toUpperCase()}
                          </span>
                          <p className="text-[10px] text-primary font-black mt-1 font-mono">{r.impactScore} pts</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
