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
import { complaintService } from "@/services/complaint.service";
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

export function calculateDynamicImpactScore(c: Complaint) {
  // Severity weight (30%)
  let severityScore = 20;
  if (c.severity === "critical") severityScore = 100;
  else if (c.severity === "high") severityScore = 75;
  else if (c.severity === "medium") severityScore = 45;
  else if (c.severity === "low") severityScore = 20;

  // Citizen Support weight (25%)
  const supportScore = Math.min((c.citizensJoined + 1) * 4, 100);

  // Duplicate Reports weight (20%)
  const duplicateCount = c.duplicateMatches?.length || 0;
  const duplicateScore = Math.min(duplicateCount * 25, 100);

  // Trend Increase weight (15%)
  const trendScore = c.citizensJoined > 12 ? 100 : c.citizensJoined > 6 ? 60 : 30;

  // Report Age weight (10%)
  const ageMs = Date.now() - new Date(c.reportedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  let ageScore = 10;
  if (ageHours < 6) ageScore = 100;
  else if (ageHours < 24) ageScore = 80;
  else if (ageHours < 72) ageScore = 50;
  else if (ageHours < 168) ageScore = 30;

  const total = Math.round(
    severityScore * 0.3 +
    supportScore * 0.25 +
    duplicateScore * 0.2 +
    trendScore * 0.15 +
    ageScore * 0.1
  );

  return {
    total,
    breakdown: {
      severityScore,
      supportScore,
      duplicateScore,
      trendScore,
      ageScore,
      details: [
        `${c.severity.toUpperCase()} Severity (${severityScore}/100)`,
        `${c.citizensJoined + 1} Supporting Citizens (${supportScore}/100)`,
        `${duplicateCount} Similar Reports (${duplicateScore}/100)`,
        c.citizensJoined > 12 ? `Rapidly Increasing Trend (${trendScore}/100)` : `Stable Trend (${trendScore}/100)`,
        ageHours < 24 ? `Submitted within 24h (${ageScore}/100)` : `Submitted ${Math.round(ageHours / 24)}d ago (${ageScore}/100)`
      ]
    }
  };
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        showToast("AI Summary copied to clipboard.");
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
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText);
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
        navigator.clipboard.writeText(window.location.href);
        showToast("✓ Link Copied Successfully");
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("✓ Link Copied Successfully");
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
          <div className="px-5 pt-4">
            <div className="w-full py-8 border border-dashed border-border bg-card rounded-2xl flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground font-semibold">No Evidence Uploaded</span>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">Citizen submitted report without photographic attachments</p>
            </div>
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
                <MapPin size={11} className="text-slate-400" /> {complaint.ward}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Users size={11} className="text-slate-400" /> {complaint.citizensJoined + 1} Supporting Citizens
              </span>
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
                className="w-full py-2.5 bg-secondary text-muted-foreground border border-border border-dashed rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active-press"
                style={DF}>
                <Copy size={12} />
                Copy Brief Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
